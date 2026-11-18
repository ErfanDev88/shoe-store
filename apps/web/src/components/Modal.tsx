'use client';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

type Side = 'center' | 'sm' | 'top' | 'end' | 'bottom' | 'full';

/**
 * Accessible modal built on the native <dialog>: focus trap, Esc to close, inert background, backdrop click to close.
 * Children are only mounted while open, so heavy content costs nothing until needed.
 */
export default function Modal({ open, onClose, side = 'center', label, children, closeButton = true }: { open: boolean; onClose: () => void; side?: Side; label: string; children: React.ReactNode; closeButton?: boolean }) {
  const t = useTranslations();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog ref={ref} aria-label={label} className={`dlg ${side === 'center' ? '' : `dlg-${side}`}`} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      {open && (
        <div className="relative min-h-full">
          {closeButton && (
            <button type="button" onClick={onClose} aria-label={t('common.close')} className="icon-btn absolute end-2 top-2 z-10 bg-surface/80 backdrop-blur">
              <X className="h-5 w-5" />
            </button>
          )}
          {children}
        </div>
      )}
    </dialog>
  );
}
