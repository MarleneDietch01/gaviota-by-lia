'use client';

import { useEffect } from 'react';
import { clearPurchasedLines } from '@/lib/commerce/bag';

/**
 * Vacía de la bolsa lo que se acaba de pagar.
 *
 * La bolsa vive en `localStorage`, así que solo el navegador puede retirarla y
 * hace falta un componente de cliente. La página de éxito es de servidor y se
 * queda como está: esto no pinta nada, solo ejecuta el efecto.
 *
 * Se hace al VOLVER del pago, no al salir hacia Stripe: si la clienta cancela
 * o el pago falla, tiene que encontrar su bolsa intacta.
 */
export function ClearPurchasedBag() {
  useEffect(() => {
    clearPurchasedLines();
  }, []);

  return null;
}
