/**
 * Concurrencia de inventario — la garantía que un checkout con pagos NO puede
 * romper: `commit_inventory_sale` NO debe descontar el stock dos veces cuando
 * dos eventos de pago del mismo pedido se procesan a la vez.
 *
 * Stripe entrega `checkout.session.completed` y `payment_intent.succeeded` como
 * POST separados (IDs de evento distintos, así que `payment_events` no los
 * deduplica) que Next.js procesa en paralelo. Ambos manejadores llaman a
 * `commit_inventory_sale(order_id)`.
 *
 * Ataca la base real con dos conexiones directas (`pg`), que es donde vive la
 * condición de carrera. Todo ocurre sobre un producto DRAFT desechable creado
 * aquí, invisible para el resto de la suite.
 *
 * Se salta si falta la URL de la base local.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client as PgClient } from 'pg';

const PG_URL = process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54822/postgres';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const describeInv = SUPABASE_URL ? describe : describe.skip;

let admin: PgClient;
let productId: string;
const openClients: PgClient[] = [];

async function pg(): Promise<PgClient> {
  const c = new PgClient({ connectionString: PG_URL });
  await c.connect();
  openClients.push(c);
  return c;
}

async function makeVariant(stock: number): Promise<string> {
  const { rows } = await admin.query(
    `insert into product_variants (product_id, name, price, stock_quantity, status)
     values ($1, 'conc-' || substr(md5(random()::text), 1, 8), 5000, $2, 'active')
     returning id`,
    [productId, stock],
  );
  return rows[0].id as string;
}

async function makeOrder(variantId: string, qty: number): Promise<string> {
  const { rows } = await admin.query(
    `insert into orders (customer_email, subtotal, shipping_total, grand_total,
                         order_status, payment_status)
     values ('concurrencia@ejemplo.test', $1, 0, $1, 'pending_payment', 'pending')
     returning id`,
    [5000 * qty],
  );
  const orderId = rows[0].id as string;
  await admin.query(
    `insert into order_items (order_id, product_id, variant_id, product_name,
                             quantity, unit_price, line_total)
     values ($1, $2, $3, 'Concurrencia', $4, 5000, $5)`,
    [orderId, productId, variantId, qty, 5000 * qty],
  );
  return orderId;
}

async function stockOf(variantId: string): Promise<number> {
  const { rows } = await admin.query('select stock_quantity from product_variants where id = $1', [variantId]);
  return rows[0].stock_quantity as number;
}

async function saleCount(orderId: string): Promise<number> {
  const { rows } = await admin.query(
    `select count(*)::int as n from inventory_movements
      where order_id = $1 and movement_type = 'sale'`,
    [orderId],
  );
  return rows[0].n as number;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Espera a que la conexión `blocker` tenga `commit_inventory_sale` esperando un lock. */
async function waitUntilCommitBlocks(probe: PgClient, timeoutMs = 15000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { rows } = await probe.query(
      `select 1 from pg_stat_activity
        where state = 'active' and wait_event_type = 'Lock'
          and query ilike '%commit_inventory_sale%'
          and query not ilike '%pg_stat_activity%'`,
    );
    if (rows.length > 0) return;
    await wait(75);
  }
  throw new Error('commit_inventory_sale nunca llegó a bloquearse en el FOR UPDATE');
}

beforeAll(async () => {
  if (!SUPABASE_URL) return;
  admin = await pg();
  const { rows } = await admin.query(
    `insert into products (name, slug, base_price, status, track_inventory)
     values ('Concurrencia (test)', 'zzz-concurrencia-' || substr(md5(random()::text), 1, 8),
             5000, 'draft', true)
     returning id`,
  );
  productId = rows[0].id as string;
});

afterAll(async () => {
  // Limpieza: la suite pgTAP asume un seed intacto, así que no se deja rastro.
  // `session_replication_role = replica` desactiva los triggers de
  // inmutabilidad (inventory_movements / order_status_history) y las FK.
  if (admin && productId) {
    try {
      await admin.query("set session_replication_role = 'replica'");
      await admin.query(
        `delete from inventory_movements
          where variant_id in (select id from product_variants where product_id = $1)`,
        [productId],
      );
      await admin.query(
        `delete from order_status_history where order_id in (
           select order_id from order_items where product_id = $1)`,
        [productId],
      );
      await admin.query(
        `delete from orders where id in (select order_id from order_items where product_id = $1)`,
        [productId],
      );
      await admin.query('delete from order_items where product_id = $1', [productId]);
      await admin.query('delete from product_variants where product_id = $1', [productId]);
      await admin.query('delete from product_images where product_id = $1', [productId]);
      await admin.query('delete from products where id = $1', [productId]);
      await admin.query("set session_replication_role = 'origin'");
    } catch {
      /* mejor esfuerzo */
    }
  }
  await Promise.all(openClients.map((c) => c.end().catch(() => {})));
});

describeInv('commit_inventory_sale bajo concurrencia', () => {
  it('dos eventos de pago simultáneos del mismo pedido descuentan el stock UNA sola vez', async () => {
    const variantId = await makeVariant(15);
    const orderId = await makeOrder(variantId, 3);

    const first = await pg();
    const probe = await pg();
    const second = await pg();

    // "Primer evento": toma el lock de la fila de la variante y lo mantiene.
    await first.query('begin');
    await first.query('select stock_quantity from product_variants where id = $1 for update', [variantId]);

    // "Segundo evento": la función real, en su propia conexión. Pasa el chequeo
    // de idempotencia (aún no hay asiento) y se queda esperando en el FOR UPDATE.
    const secondRun = second.query('select commit_inventory_sale($1) as n', [orderId]);
    await waitUntilCommitBlocks(probe);

    // El primer evento confirma la venta (lo mismo que hace la función) y suelta el lock.
    await first.query(
      `update product_variants
          set stock_quantity = stock_quantity - 3,
              reserved_quantity = greatest(0, reserved_quantity - 3), updated_at = now()
        where id = $1`,
      [variantId],
    );
    await first.query(
      `insert into inventory_movements (product_id, variant_id, movement_type, quantity,
         previous_quantity, new_quantity, reason, order_id)
       values ($1, $2, 'sale', -3, 15, 12, 'primer evento', $3)`,
      [productId, variantId, orderId],
    );
    await first.query('commit');

    await secondRun; // no debe lanzar

    expect(await stockOf(variantId)).toBe(12); // 15 - 3, y NO 15 - 3 - 3 = 9
    expect(await saleCount(orderId)).toBe(1);
  }, 30_000);

  it('reintento secuencial del webhook tampoco vuelve a descontar', async () => {
    const variantId = await makeVariant(10);
    const orderId = await makeOrder(variantId, 4);
    await admin.query('select commit_inventory_sale($1)', [orderId]);
    await admin.query('select commit_inventory_sale($1)', [orderId]);
    await admin.query('select commit_inventory_sale($1)', [orderId]);
    expect(await stockOf(variantId)).toBe(6);
    expect(await saleCount(orderId)).toBe(1);
  });

  it('dos pedidos por la última unidad: uno gana, el stock nunca queda negativo', async () => {
    const variantId = await makeVariant(1);
    const order1 = await makeOrder(variantId, 1);
    const order2 = await makeOrder(variantId, 1);

    const c1 = await pg();
    const c2 = await pg();
    const results = await Promise.allSettled([
      c1.query('select commit_inventory_sale($1)', [order1]),
      c2.query('select commit_inventory_sale($1)', [order2]),
    ]);

    const rejected = results.filter((r) => r.status === 'rejected');
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason.message).toMatch(/INSUFFICIENT_STOCK/);
    expect(await stockOf(variantId)).toBe(0); // exactamente 0, jamás -1
  });
});
