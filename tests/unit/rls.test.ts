/**
 * Pruebas de Row Level Security.
 *
 * Atacan la base de datos DIRECTAMENTE con la clave anónima, sin pasar por la
 * interfaz ni por las Server Actions. Es la única forma de comprobar que las
 * políticas RLS aguantan por sí solas: si un atacante obtiene la anon key —que
 * es pública por diseño— esto es exactamente lo que puede intentar.
 *
 * Toda prueba que empiece por "NO debe" tiene que fallar la operación.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const describeRls = SUPABASE_URL && ANON_KEY ? describe : describe.skip;

const CUSTOMER_A = { email: 'cliente.a@ejemplo.test', password: 'DevPassword123!' };
const CUSTOMER_B = { email: 'cliente.b@ejemplo.test', password: 'DevPassword123!' };
const ADMIN = { email: 'admin@ejemplo.test', password: 'DevPassword123!' };

const CUSTOMER_A_ID = '11111111-1111-1111-1111-111111111111';
const CUSTOMER_B_ID = '22222222-2222-2222-2222-222222222222';

/** Cliente sin sesión: representa a un visitante anónimo. */
function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function signedInClient(creds: {
  email: string;
  password: string;
}): Promise<SupabaseClient> {
  const client = anonClient();
  const { error } = await client.auth.signInWithPassword(creds);
  if (error) throw new Error(`No se pudo iniciar sesión: ${error.message}`);
  return client;
}

let anon: SupabaseClient;
let customerA: SupabaseClient;
let customerB: SupabaseClient;
let admin: SupabaseClient;

/** Pedido de la clienta B, creado con service_role para las pruebas de aislamiento. */
let orderOfB: string;

beforeAll(async () => {
  if (!SUPABASE_URL || !ANON_KEY) {
    return;
  }

  anon = anonClient();
  customerA = await signedInClient(CUSTOMER_A);
  customerB = await signedInClient(CUSTOMER_B);
  admin = await signedInClient(ADMIN);

  // Prepara un pedido de B con la service_role (así se crean los pedidos en
  // producción: nunca desde el cliente).
  const service = createClient(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    { auth: { persistSession: false } },
  );

  const { data, error } = await service
    .from('orders')
    .insert({
      user_id: CUSTOMER_B_ID,
      customer_email: CUSTOMER_B.email,
      subtotal: 5000,
      discount_total: 0,
      tax_total: 0,
      shipping_total: 800,
      grand_total: 5800,
    })
    .select('id')
    .single();

  if (error) throw new Error(`No se pudo preparar el pedido: ${error.message}`);
  orderOfB = data.id;
});

// ===========================================================================
describeRls('Catálogo: visibilidad pública', () => {
  it('anónimo SÍ puede leer productos activos', async () => {
    const { data, error } = await anon.from('products').select('id, name').eq('status', 'active');
    expect(error).toBeNull();
    expect(data?.length ?? 0).toBeGreaterThan(0);
  });

  it('anónimo NO debe ver productos en draft (Sunscreen, Tónico)', async () => {
    const { data } = await anon.from('products').select('id, slug');
    const slugs = (data ?? []).map((p) => p.slug);
    expect(slugs).not.toContain('sunscreen');
    expect(slugs).not.toContain('tonico-para-barba');
  });

  it('anónimo NO debe poder crear un producto', async () => {
    const { error } = await anon
      .from('products')
      .insert({ name: 'Pirata', slug: 'pirata', base_price: 1 });
    expect(error).not.toBeNull();
  });

  it('cliente NO debe poder modificar el precio de un producto', async () => {
    const { data } = await customerA
      .from('products')
      .update({ base_price: 1 })
      .eq('slug', 'aceite-anti-estrias')
      .select();
    // RLS filtra la fila: 0 filas afectadas, el precio queda intacto.
    expect(data ?? []).toHaveLength(0);

    const { data: check } = await anon
      .from('products')
      .select('base_price')
      .eq('slug', 'aceite-anti-estrias')
      .single();
    expect(check?.base_price).toBe(5000);
  });

  it('admin SÍ puede ver los productos en draft', async () => {
    const { data, error } = await admin.from('products').select('slug');
    expect(error).toBeNull();
    expect((data ?? []).map((p) => p.slug)).toContain('sunscreen');
  });
});

// ===========================================================================
describeRls('Perfiles: aislamiento y escalada de privilegios', () => {
  it('cliente A SÍ ve su propio perfil', async () => {
    const { data, error } = await customerA.from('profiles').select('id, email').eq('id', CUSTOMER_A_ID).single();
    expect(error).toBeNull();
    expect(data?.id).toBe(CUSTOMER_A_ID);
  });

  it('cliente A NO debe ver el perfil de la clienta B', async () => {
    const { data } = await customerA.from('profiles').select('id').eq('id', CUSTOMER_B_ID);
    expect(data ?? []).toHaveLength(0);
  });

  it('cliente NO debe poder ascenderse a admin', async () => {
    const { error } = await customerA
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', CUSTOMER_A_ID);

    // El trigger prevent_role_escalation lanza 42501.
    expect(error).not.toBeNull();

    const { data } = await customerA.from('profiles').select('role').eq('id', CUSTOMER_A_ID).single();
    expect(data?.role).toBe('customer');
  });

  it('cliente NO debe poder reactivarse si está suspendido', async () => {
    const { error } = await customerA
      .from('profiles')
      .update({ status: 'suspended' })
      .eq('id', CUSTOMER_A_ID);
    expect(error).not.toBeNull();
  });

  it('cliente SÍ puede editar su nombre', async () => {
    const { error } = await customerA
      .from('profiles')
      .update({ first_name: 'Ana María' })
      .eq('id', CUSTOMER_A_ID);
    expect(error).toBeNull();
  });

  it('anónimo NO debe leer ningún perfil', async () => {
    const { data } = await anon.from('profiles').select('id');
    expect(data ?? []).toHaveLength(0);
  });
});

// ===========================================================================
describeRls('Pedidos: el activo más sensible', () => {
  it('cliente B SÍ ve su propio pedido', async () => {
    const { data, error } = await customerB.from('orders').select('id').eq('id', orderOfB);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(1);
  });

  it('cliente A NO debe ver el pedido de la clienta B', async () => {
    const { data } = await customerA.from('orders').select('id').eq('id', orderOfB);
    expect(data ?? []).toHaveLength(0);
  });

  it('anónimo NO debe leer ningún pedido', async () => {
    const { data } = await anon.from('orders').select('id');
    expect(data ?? []).toHaveLength(0);
  });

  it('cliente NO debe poder crear un pedido directamente', async () => {
    const { error } = await customerA.from('orders').insert({
      user_id: CUSTOMER_A_ID,
      customer_email: CUSTOMER_A.email,
      subtotal: 1,
      grand_total: 1,
    });
    expect(error).not.toBeNull();
  });

  it('cliente NO debe poder alterar el total de su pedido', async () => {
    const { data } = await customerB
      .from('orders')
      .update({ grand_total: 1 })
      .eq('id', orderOfB)
      .select();
    expect(data ?? []).toHaveLength(0);
  });

  it('cliente NO debe poder marcar su pedido como pagado', async () => {
    const { data } = await customerB
      .from('orders')
      .update({ payment_status: 'paid', order_status: 'paid' })
      .eq('id', orderOfB)
      .select();
    expect(data ?? []).toHaveLength(0);
  });

  it('admin SÍ puede ver todos los pedidos', async () => {
    const { data, error } = await admin.from('orders').select('id');
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });
});

// ===========================================================================
describeRls('Pagos: sin acceso para clientes', () => {
  it('cliente NO debe leer la tabla de pagos', async () => {
    const { data } = await customerA.from('payments').select('id');
    expect(data ?? []).toHaveLength(0);
  });

  it('cliente NO debe leer los eventos de webhook', async () => {
    const { data } = await customerA.from('payment_events').select('id');
    expect(data ?? []).toHaveLength(0);
  });

  it('anónimo NO debe leer pagos', async () => {
    const { data } = await anon.from('payments').select('id');
    expect(data ?? []).toHaveLength(0);
  });
});

// ===========================================================================
describeRls('Inventario: libro mayor inmutable', () => {
  it('cliente NO debe leer los movimientos de inventario', async () => {
    const { data } = await customerA.from('inventory_movements').select('id');
    expect(data ?? []).toHaveLength(0);
  });

  it('cliente NO debe poder modificar el stock', async () => {
    const { data } = await customerA
      .from('product_variants')
      .update({ stock_quantity: 9999 })
      .eq('sku', 'GBL-ACE-115-V')
      .select();
    expect(data ?? []).toHaveLength(0);
  });

  it('ni siquiera un admin puede editar un movimiento (tabla inmutable)', async () => {
    const { data: movements } = await admin
      .from('inventory_movements')
      .select('id')
      .limit(1);

    if ((movements ?? []).length > 0) {
      const { error } = await admin
        .from('inventory_movements')
        .update({ reason: 'manipulado' })
        .eq('id', movements![0]!.id);
      expect(error).not.toBeNull();
    }
  });

  it('admin SÍ puede leer los movimientos', async () => {
    const { error } = await admin.from('inventory_movements').select('id').limit(1);
    expect(error).toBeNull();
  });
});

// ===========================================================================
describeRls('Cupones: sin lectura directa', () => {
  it('cliente NO debe poder listar los cupones', async () => {
    const { data } = await customerA.from('coupons').select('code');
    expect(data ?? []).toHaveLength(0);
  });

  it('anónimo NO debe poder listar los cupones', async () => {
    const { data } = await anon.from('coupons').select('code');
    expect(data ?? []).toHaveLength(0);
  });
});

// ===========================================================================
describeRls('Reseñas: moderación y compra verificada', () => {
  it('cliente NO debe poder autoaprobarse una reseña', async () => {
    const { error } = await customerA.from('reviews').insert({
      product_id: 'a0000001-0000-4000-8000-000000000001',
      user_id: CUSTOMER_A_ID,
      rating: 5,
      status: 'approved',
    });
    expect(error).not.toBeNull();
  });

  it('cliente NO debe poder marcarse la compra como verificada', async () => {
    const { error } = await customerA.from('reviews').insert({
      product_id: 'a0000003-0000-4000-8000-000000000003',
      user_id: CUSTOMER_A_ID,
      rating: 5,
      verified_purchase: true,
    });
    expect(error).not.toBeNull();
  });

  it('anónimo NO ve reseñas pendientes', async () => {
    const { data } = await anon.from('reviews').select('id').eq('status', 'pending');
    expect(data ?? []).toHaveLength(0);
  });
});

// ===========================================================================
describeRls('Contenido y ajustes', () => {
  it('anónimo SÍ lee las secciones activas', async () => {
    const { data, error } = await anon.from('content_sections').select('section_key');
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });

  it('anónimo NO ve las secciones en draft (testimonios, UGC)', async () => {
    const { data } = await anon.from('content_sections').select('section_key');
    const keys = (data ?? []).map((s) => s.section_key);
    expect(keys).not.toContain('home.testimonials');
    expect(keys).not.toContain('home.ugc');
  });

  it('cliente NO debe leer site_settings', async () => {
    const { data } = await customerA.from('site_settings').select('setting_key');
    expect(data ?? []).toHaveLength(0);
  });

  it('cliente NO debe poder editar el contenido del sitio', async () => {
    const { data } = await customerA
      .from('content_sections')
      .update({ title: 'Hackeado' })
      .eq('section_key', 'home.hero')
      .select();
    expect(data ?? []).toHaveLength(0);
  });
});

// ===========================================================================
describeRls('Auditoría: solo super_admin', () => {
  it('cliente NO debe leer la auditoría', async () => {
    const { data } = await customerA.from('audit_logs').select('id');
    expect(data ?? []).toHaveLength(0);
  });

  it('un admin normal NO debe leer la auditoría (es de super_admin)', async () => {
    const { data } = await admin.from('audit_logs').select('id');
    expect(data ?? []).toHaveLength(0);
  });
});

// ===========================================================================
describeRls('Comunicaciones', () => {
  it('cliente NO debe leer los mensajes de contacto', async () => {
    const { data } = await customerA.from('contact_messages').select('id');
    expect(data ?? []).toHaveLength(0);
  });

  it('cliente NO debe leer la lista de la newsletter', async () => {
    const { data } = await customerA.from('newsletter_subscribers').select('email');
    expect(data ?? []).toHaveLength(0);
  });

  it('anónimo NO debe poder insertar en la newsletter (debe pasar por la API)', async () => {
    const { error } = await anon
      .from('newsletter_subscribers')
      .insert({ email: 'spam@ejemplo.test' });
    expect(error).not.toBeNull();
  });
});

// ===========================================================================
describeRls('Funciones de inventario: no invocables por clientes', () => {
  it('cliente NO debe poder reservar inventario', async () => {
    const { error } = await customerA.rpc('reserve_inventory', {
      p_variant_id: 'b0000001-0000-4000-8000-000000000001',
      p_quantity: 1,
    });
    expect(error).not.toBeNull();
  });

  it('cliente NO debe poder calcular descuentos de cupón', async () => {
    const { error } = await customerA.rpc('calculate_coupon_discount', {
      p_code: 'CUALQUIERA',
      p_subtotal: 10000,
    });
    expect(error).not.toBeNull();
  });

  it('cliente NO debe poder ajustar inventario (adjust_inventory exige is_admin)', async () => {
    const { error } = await customerA.rpc('adjust_inventory', {
      p_variant_id: 'b0000001-0000-4000-8000-000000000001',
      p_new_quantity: 9999,
      p_reason: 'intento',
    });
    expect(error).not.toBeNull();
  });
});
