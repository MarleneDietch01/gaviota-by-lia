'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Copy } from 'lucide-react';
import { GAVIOTA_PROMOTION } from '@/lib/commerce/promotion';
import { savePromotion } from '@/lib/commerce/promotion-storage';
import { localizedHref, pick, type Locale } from '@/lib/i18n';
import styles from './announcement-bar.module.css';

export function AnnouncementBar({ locale }: { locale: Locale }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'manual'>('idle');
  const codeRef = useRef<HTMLSpanElement>(null);
  const { code, percentOff } = GAVIOTA_PROMOTION;

  useEffect(() => {
    if (copyState === 'idle') return;
    const timeout = window.setTimeout(() => setCopyState('idle'), 3000);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState('copied');
    } catch {
      // If clipboard permission is denied, select the visible code for copying.
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

  return (
    <aside aria-label={pick(locale, 'Special offer', 'Promoción especial')} className={styles.bar}>
      <div className={styles.content}>
        <p className={styles.message}>
          <span className={styles.intro}>{pick(locale, 'A little gift for your ritual: ', 'Un detalle para tu ritual: ')}</span>
          <strong>{pick(locale, `${percentOff}% off products`, `${percentOff}% de descuento en productos`)}</strong>
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            onClick={copyCode}
            aria-label={pick(locale, `Copy code ${code}`, `Copiar código ${code}`)}
            className={styles.code}
          >
            <span ref={codeRef}>{code}</span>
            {copyState === 'copied' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          </button>
          <Link
            href={localizedHref(locale, '/shop')}
            onClick={() => savePromotion(code)}
            onAuxClick={(event) => { if (event.button === 1) savePromotion(code); }}
            className={styles.shop}
          >
            {pick(locale, 'Shop with 10% off', 'Comprar con descuento')}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <span role="status" aria-live="polite" className={styles.feedback}>
          {copyState === 'copied'
            ? pick(locale, 'Code copied!', '¡Código copiado!')
            : copyState === 'manual'
              ? pick(locale, 'Select and copy GAVIOTA10', 'Selecciona y copia GAVIOTA10')
              : ''}
        </span>
      </div>
    </aside>
  );
}
