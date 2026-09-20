import 'server-only';

import { headers } from 'next/headers';

/**
 * Cómo se construyen las claves de cubo del limitador de intentos.
 *
 * -----------------------------------------------------------------------------
 * POR QUÉ EXISTE ESTE ARCHIVO
 * -----------------------------------------------------------------------------
 * El registro limitaba con `register:${email}`, la dirección tal cual la
 * escribe quien rellena el formulario. Eso se rompió en producción: entre el 1
 * y el 17 de septiembre de 2026 entraron cinco altas de bot con direcciones
 * así:
 *
 *     e.mxw.iypveq161@gmail.com
 *     a.c.u.ye.mi.wih.ul.24@gmail.com
 *     connorg.ai.ne.s3.8.0@gmail.com
 *
 * Gmail IGNORA los puntos del nombre de usuario: las tres llegan a buzones
 * `emxwiypveq161`, `acuyemiwihul24` y `connorgaines380`. Para el limitador, en
 * cambio, cada variante puntuada era una cadena distinta y estrenaba su propio
 * contador. El límite de "3 intentos por correo" nunca llegó a dispararse.
 *
 * El daño no era que entraran en la tienda —ninguna de esas cuentas confirmó
 * el correo ni inició sesión jamás— sino que cada alta mandaba un correo de
 * confirmación a una persona real que no lo había pedido. Cinco desconocidos a
 * un clic de marcar el dominio como spam, y detrás de ese dominio van los
 * recibos de compra de las clientas de verdad.
 * -----------------------------------------------------------------------------
 */

/**
 * Reduce una dirección a la forma canónica del buzón que realmente la recibe,
 * PARA CONTAR INTENTOS Y PARA NADA MÁS.
 *
 * Lo que devuelve esta función no es un correo: es un identificador de cubo.
 * Nunca debe guardarse en `profiles.email`, mandarse a Supabase Auth ni
 * mostrarse a nadie. Quien se registra como `ana.lopez@gmail.com` debe seguir
 * viendo ese correo en su cuenta y recibiendo ahí sus pedidos; lo único que
 * cambia es que comparte contador con `analopez@gmail.com`, porque son la
 * misma persona.
 *
 * Dos normalizaciones, con motivos distintos:
 *
 *   · `+etiqueta` se descarta en TODOS los dominios. Es una convención estable
 *     de Gmail, Outlook, Proton, Fastmail e iCloud: lo que va tras el `+` es
 *     una etiqueta de filtrado, no parte de la identidad del buzón.
 *
 *   · Los puntos se descartan SOLO en Gmail. En el resto de proveedores el
 *     punto sí distingue cuentas — `j.perez@empresa.com` y `jperez@empresa.com`
 *     pueden ser dos personas diferentes, y meterlas en el mismo cubo dejaría a
 *     una sin poder registrarse porque la otra lo intentó antes.
 */
export function rateLimitEmailKey(email: string): string {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf('@');

  // Sin `@`, o empezando por él, no hay nada que canonizar. Zod ya validó el
  // formato antes de llegar aquí, así que esto es defensa en profundidad: una
  // clave rara es preferible a lanzar en mitad de un registro legítimo.
  if (at <= 0) return normalized;

  let local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);

  // `> 0` y no `!== -1`: si el `+` va al principio, recortar dejaría la parte
  // local vacía y todas esas direcciones caerían en un mismo cubo `@dominio`.
  const plus = local.indexOf('+');
  if (plus > 0) local = local.slice(0, plus);

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    // googlemail.com es el dominio histórico de Gmail y entrega en el mismo
    // buzón, así que ambos convergen en una sola clave.
    return `${local.replaceAll('.', '')}@gmail.com`;
  }

  return `${local}@${domain}`;
}

/**
 * IP de quien hace la petición, para limitar por origen además de por correo.
 *
 * Canonizar el correo cierra el truco de los puntos, pero no impide que un bot
 * use mil direcciones distintas de verdad — y esas cinco altas eran cinco
 * buzones reales diferentes, no variantes de uno solo. El límite por IP es lo
 * que corta ese caso.
 *
 * `x-forwarded-for` llega como lista separada por comas (`cliente, proxy1,
 * proxy2`) y el primer elemento es el cliente. Detrás de Vercel esa cabecera
 * la fija la plataforma, no el navegador, así que no es falsificable desde
 * fuera; en local puede no venir, y entonces se agrupa todo bajo 'unknown' —
 * que es lo correcto para desarrollo y da igual en producción.
 */
export async function requestIp(): Promise<string> {
  const headerList = await headers();

  const forwarded = headerList.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) return forwarded;

  return headerList.get('x-real-ip')?.trim() || 'unknown';
}
