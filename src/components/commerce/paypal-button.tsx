'use client';

import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n';

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError?: (error: unknown) => void;
        style?: Record<string, string>;
      }) => { render: (selector: string | HTMLElement) => void };
    };
  }
}

/**
 * Botón de PayPal (wallet + tarjetas vía PayPal).
 *
 * Carga el SDK oficial por `<script>` en vez de instalar `@paypal/react-paypal-js`:
 * es un único componente que se monta una vez, así que el coste de una
 * dependencia de React entera no compensa frente a ~20 líneas de carga manual.
 * El client ID es público a propósito — identifica la cuenta, no autentica
 * nada; la autorización real ocurre en el servidor (`create-order`/`capture-order`).
 */
export function PayPalButton({
  lines,
  locale,
  onSuccess,
  onError,
}: {
  lines: readonly { slug: string; quantity: number }[];
  locale: Locale;
  onSuccess: (orderNumber: string) => void;
  onError: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const orderNumberRef = useRef<string | null>(null);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) return;

    if (window.paypal) {
      // Diferido: fijar estado de forma síncrona dentro del cuerpo del efecto
      // encadena renders (regla de React 19). El SDK ya estaba cargado —de
      // una montura anterior del componente—, así que un microtask basta.
      queueMicrotask(() => setReady(true));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;
    script.async = true;
    script.onload = () => setReady(true);
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  useEffect(() => {
    if (!ready || !window.paypal || !containerRef.current) return;

    containerRef.current.innerHTML = '';

    window.paypal
      .Buttons({
        style: { layout: 'horizontal', color: 'gold', shape: 'rect', height: '48' },
        createOrder: async () => {
          const response = await fetch('/api/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lang: locale, lines }),
          });
          const data = (await response.json()) as { id?: string; orderNumber?: string; error?: string };
          if (!response.ok || !data.id) throw new Error(data.error ?? 'create_order_failed');
          orderNumberRef.current = data.orderNumber ?? null;
          return data.id;
        },
        onApprove: async (data) => {
          const response = await fetch('/api/paypal/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paypalOrderId: data.orderID }),
          });
          const result = (await response.json()) as { paid?: boolean };
          if (!response.ok || !result.paid) {
            onError();
            return;
          }
          onSuccess(orderNumberRef.current ?? '');
        },
        onError: () => onError(),
      })
      .render(containerRef.current);
  }, [ready, lines, locale, onSuccess, onError]);

  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) return null;

  return <div ref={containerRef} className="mt-3" />;
}
