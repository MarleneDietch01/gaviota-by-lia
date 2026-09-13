'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { ArrowRight, Check, Copy, X } from 'lucide-react';
import { Button, LinkButton } from '@/components/ui/button';
import { GAVIOTA_PROMOTION } from '@/lib/commerce/promotion';
import {
  getSavedPromotion,
  markPromoCouponSeen,
  savePromotion,
  wasPromoCouponSeen,
} from '@/lib/commerce/promotion-storage';
import { localizedHref, pick, type Locale } from '@/lib/i18n';
import styles from './promo-coupon.module.css';

/**
 * El cupón GAVIOTA10: un ticket de dos cuerpos que entra volando en 3D.
 *
 * Aparece UNA vez por visitante. Al cerrarse queda marcado, así que no vuelve a
 * interrumpir; la barra superior sigue anunciando el código el resto de la
 * visita, y quien ya activó el descuento nunca lo ve.
 *
 * Se apoya en `<dialog>` + `showModal()`: el navegador da Escape, el fondo
 * inerte y la devolución del foco al cerrar. La trampa de Tab, en cambio, SÍ
 * se reimplementa (mismo patrón que el drawer de `site-header.tsx`): medido en
 * Chromium, al llegar al último control un Tab se escapa a `<body>` durante un
 * paso antes de volver al primero — el indicador de foco desaparece un
 * instante, que es justo lo que la trampa manual evita.
 */
const ARRIVE_DELAY_MS = 1400;
const LEAVE_MS = 320;
const TITLE_ID = 'promo-coupon-title';

type Stage = 'hidden' | 'open' | 'leaving';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function PromoCoupon({ locale }: { locale: Locale }) {
  const [stage, setStage] = useState<Stage>('hidden');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'manual'>('idle');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLSpanElement>(null);
  const { code, percentOff } = GAVIOTA_PROMOTION;
  const visible = stage !== 'hidden';

  useEffect(() => {
    // Ya lo vio, o ya activó el descuento: no se le interrumpe.
    if (wasPromoCouponSeen() || getSavedPromotion()) return;
    const timeout = window.setTimeout(() => setStage('open'), ARRIVE_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (stage !== 'open') return;
    dialogRef.current?.showModal();
    // El foco entra en el panel, no en la primera acción. Sin `preventScroll`,
    // en pantallas bajas el navegador desplaza el diálogo para "encajar" un
    // panel más alto que su caja y deja la cabecera fuera de vista.
    cardRef.current?.focus({ preventScroll: true });
    // `showModal` también lleva el foco, y lo hace con el cupón aún desplazado
    // por la animación de entrada: sin esto el diálogo queda desplazado.
    if (dialogRef.current) dialogRef.current.scrollTop = 0;
    // Se marca al abrir: si recarga con el cupón en pantalla, tampoco reaparece.
    markPromoCouponSeen();
  }, [stage]);

  // Trampa de Tab: ver la nota de arriba sobre por qué no basta con el modal
  // nativo. Igual que en `site-header.tsx`, Escape lo maneja `onCancel`.
  useEffect(() => {
    if (stage !== 'open') return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const card = cardRef.current;
      if (!card) return;

      const items = Array.from(
        card.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;

      const first = items[0]!;
      const last = items[items.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [stage]);

  useEffect(() => {
    if (!visible) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [visible]);

  useEffect(() => {
    if (stage !== 'leaving') return;
    const timeout = window.setTimeout(() => {
      dialogRef.current?.close();
      setStage('hidden');
    }, LEAVE_MS);
    return () => window.clearTimeout(timeout);
  }, [stage]);

  useEffect(() => {
    if (copyState === 'idle') return;
    const timeout = window.setTimeout(() => setCopyState('idle'), 3000);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  const dismiss = useCallback((instant = false) => {
    markPromoCouponSeen();
    if (instant || prefersReducedMotion()) {
      dialogRef.current?.close();
      setStage('hidden');
      return;
    }
    setStage('leaving');
  }, []);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState('copied');
    } catch {
      // Si se deniega el portapapeles, se selecciona el código visible.
      if (codeRef.current) {
        const range = document.createRange();
        range.selectNodeContents(codeRef.current);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      setCopyState('manual');
    }
  }

  /* Inclinación por puntero: el mismo idioma que `product-tilt`. Solo ratón, y
     neutralizada en CSS cuando se pide menos movimiento. */
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    event.currentTarget.style.setProperty('--tilt-x', `${((0.5 - y) * 7).toFixed(2)}deg`);
    event.currentTarget.style.setProperty('--tilt-y', `${((x - 0.5) * 9).toFixed(2)}deg`);
    event.currentTarget.style.setProperty('--glow-x', `${(x * 100).toFixed(1)}%`);
    event.currentTarget.style.setProperty('--glow-y', `${(y * 100).toFixed(1)}%`);
  };

  const resetTilt = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty('--tilt-x', '0deg');
    event.currentTarget.style.setProperty('--tilt-y', '0deg');
  };

  if (!visible) return null;

  return (
    <dialog
      ref={dialogRef}
      data-stage={stage}
      className={styles.dialog}
      aria-labelledby={TITLE_ID}
      onCancel={(event) => {
        // Escape: se intercepta para que salga con su animación y quede marcado.
        event.preventDefault();
        dismiss();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <div className={styles.flight}>
        <div
          ref={cardRef}
          tabIndex={-1}
          className={styles.card}
          onPointerMove={onPointerMove}
          onPointerLeave={resetTilt}
        >
          <span aria-hidden="true" className={styles.halo} />
          <span aria-hidden="true" className={styles.foil} />

          <button
            type="button"
            onClick={() => dismiss()}
            className={styles.close}
            aria-label={pick(locale, 'Close offer', 'Cerrar la oferta')}
          >
            <X size={18} aria-hidden="true" />
          </button>

          <div className={styles.top}>
            <p className={styles.eyebrow}>{pick(locale, 'A gift for you', 'Un regalo para ti')}</p>
            <h2 id={TITLE_ID} className={styles.headline}>
              <span className={styles.percent}>
                {pick(locale, `${percentOff}%`, `${percentOff} %`)}
              </span>
              <span className={styles.headlineText}>
                {pick(locale, 'off your whole ', 'en todo tu ')}
                <em className="accent-word">ritual</em>
              </span>
            </h2>
            <p className={styles.support}>
              {pick(
                locale,
                'The code applies to every product in your order.',
                'El código se aplica a todos los productos de tu pedido.',
              )}
            </p>
          </div>

          <hr aria-hidden="true" className={`rule-champagne ${styles.seam}`} />

          <div className={styles.bottom}>
            <button
              type="button"
              onClick={copyCode}
              className={styles.code}
              aria-label={pick(locale, `Copy code ${code}`, `Copiar código ${code}`)}
            >
              <span ref={codeRef}>{code}</span>
              {copyState === 'copied' ? (
                <Check size={16} aria-hidden="true" />
              ) : (
                <Copy size={16} aria-hidden="true" />
              )}
            </button>

            <span role="status" aria-live="polite" className={styles.feedback}>
              {copyState === 'copied'
                ? pick(locale, 'Code copied!', '¡Código copiado!')
                : copyState === 'manual'
                  ? pick(locale, `Select and copy ${code}`, `Selecciona y copia ${code}`)
                  : ''}
            </span>

            <div className={styles.actions}>
              <LinkButton
                href={localizedHref(locale, '/shop')}
                block
                onClick={() => {
                  savePromotion(code);
                  dismiss(true);
                }}
                onAuxClick={(event) => {
                  if (event.button === 1) savePromotion(code);
                }}
              >
                {pick(locale, `Shop with ${percentOff}% off`, 'Comprar con descuento')}
                <ArrowRight size={16} aria-hidden="true" />
              </LinkButton>
              <Button variant="onDarkOutline" size="sm" block onClick={() => dismiss()}>
                {pick(locale, 'Maybe later', 'Ahora no')}
              </Button>
            </div>

            <p className={styles.fine}>
              {pick(
                locale,
                'The discount does not apply to shipping.',
                'El descuento no incluye el envío.',
              )}
            </p>
          </div>
        </div>
      </div>
    </dialog>
  );
}
