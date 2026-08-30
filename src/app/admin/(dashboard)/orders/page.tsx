import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cents, formatMoney } from '@/lib/commerce/money';

export const metadata = { title: 'Pedidos' };
const PAGE_SIZE = 25;
const PLACEHOLDER = 'sin-correo@pendiente.gaviotabylia.com';
const PAYMENT: Record<string,string> = { pending:'Pendiente', authorized:'Autorizado', paid:'Cobrado', failed:'Fallido', cancelled:'Cancelado', refunded:'Reembolsado', partially_refunded:'Reembolso parcial', disputed:'En disputa' };
const SHIPPING: Record<string,string> = { unfulfilled:'Sin preparar', preparing:'Preparando', ready:'Listo para enviar', shipped:'Enviado', delivered:'Entregado', returned:'Devuelto' };
type Params = { q?:string; from?:string; to?:string; payment?:string; shipping?:string; kind?:string; page?:string };

export default async function OrdersPage({searchParams}:{searchParams:Promise<Params>}) {
  const p=await searchParams; const page=Math.max(1,Number(p.page)||1); const supabase=await createServerSupabaseClient();
  let query=supabase.from('orders').select('id,order_number,customer_email,grand_total,order_status,payment_status,fulfillment_status,created_at,payments(status)',{count:'exact'}).order('created_at',{ascending:false}).range((page-1)*PAGE_SIZE,page*PAGE_SIZE-1);
  if(p.q?.trim()) query=query.or(`order_number.ilike.%${p.q.trim()}%,customer_email.ilike.%${p.q.trim()}%`);
  if(p.from) query=query.gte('created_at',new Date(`${p.from}T00:00:00`).toISOString());
  if(p.to) query=query.lte('created_at',new Date(`${p.to}T23:59:59.999`).toISOString());
  if(p.payment) query=query.eq('payment_status',p.payment as never);
  if(p.shipping) query=query.eq('fulfillment_status',p.shipping as never);
  if(p.kind==='incomplete') query=query.eq('order_status','pending_payment');
  if(p.kind==='test') query=query.ilike('customer_email','%@gaviotabylia.test');
  if(p.kind==='identified') query=query.neq('customer_email',PLACEHOLDER).not('customer_email','ilike','%@gaviotabylia.test');
  const {data,error,count}=await query; const pages=Math.max(1,Math.ceil((count??0)/PAGE_SIZE));
  const field='min-h-10 rounded-xs border border-line-strong bg-white-warm px-3 text-sm';
  return <div><h1 className="font-display text-h2">Pedidos</h1><p className="mt-1 text-sm text-body">Busca y filtra sin borrar ni reclasificar registros.</p>
    <form className="mt-6 grid gap-3 rounded-sm border border-line bg-white-warm p-4 sm:grid-cols-2 xl:grid-cols-7">
      <input name="q" defaultValue={p.q} placeholder="Pedido o correo" className={field}/><input type="date" name="from" defaultValue={p.from} className={field}/><input type="date" name="to" defaultValue={p.to} className={field}/>
      <select name="payment" defaultValue={p.payment} className={field}><option value="">Cualquier pago</option>{Object.entries(PAYMENT).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
      <select name="shipping" defaultValue={p.shipping} className={field}><option value="">Cualquier envío</option>{Object.entries(SHIPPING).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
      <select name="kind" defaultValue={p.kind} className={field}><option value="">Todos los registros</option><option value="identified">Con cliente identificado</option><option value="incomplete">Checkout incompleto</option><option value="test">Marcado como prueba</option></select>
      <button className="rounded-xs bg-rose px-4 font-semibold text-white-warm">Filtrar</button>
    </form>
    {error?<p className="mt-6 text-danger">{error.message}</p>:data?.length?<><div className="mt-6 overflow-x-auto rounded-sm border border-line"><table className="w-full text-left text-sm"><thead className="bg-white-warm"><tr><th className="px-4 py-3">Pedido / registro</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Pago</th><th className="px-4 py-3">Envío</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Fecha</th></tr></thead><tbody>{data.map(o=>{const incomplete=o.order_status==='pending_payment';const test=o.customer_email.endsWith('@gaviotabylia.test');return <tr key={o.id} className="border-t border-line"><td className="px-4 py-3"><Link className="font-semibold hover:text-rose" href={`/admin/orders/${o.id}`}>{o.order_number}</Link><br/><span className="text-xs text-muted">{test?'Prueba (dato explícito)':incomplete?'Checkout incompleto':'Pedido'}</span></td><td className="px-4 py-3">{o.customer_email===PLACEHOLDER?'Sin datos de cliente':o.customer_email}</td><td className="px-4 py-3">{o.payments?.some(x=>x.status==='disputed')?'En disputa':PAYMENT[o.payment_status]??o.payment_status}</td><td className="px-4 py-3">{SHIPPING[o.fulfillment_status]??o.fulfillment_status}</td><td className="px-4 py-3 font-semibold">{formatMoney(cents(o.grand_total),'USD','es-US')}</td><td className="px-4 py-3 text-muted">{new Date(o.created_at).toLocaleDateString('es-DO')}</td></tr>})}</tbody></table></div>
      <nav className="mt-5 flex gap-2" aria-label="Paginación">{Array.from({length:pages},(_,i)=>i+1).map(n=><Link key={n} aria-current={n===page?'page':undefined} className={`grid size-10 place-items-center rounded-xs border ${n===page?'border-rose bg-rose/10':'border-line'}`} href={`/admin/orders?${new URLSearchParams({...p,page:String(n)}).toString()}`}>{n}</Link>)}</nav></>:<p className="mt-8 text-body">No hay pedidos para estos filtros.</p>}
  </div>;
}
