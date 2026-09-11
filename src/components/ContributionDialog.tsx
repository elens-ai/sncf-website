import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ContributionForm } from './ContributionForm';

export function ContributionDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const focus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => { dialog.close(); document.body.style.overflow = overflow; if (focus?.isConnected) focus.focus({ preventScroll: true }); };
  }, []);
  return createPortal(<dialog ref={ref} className="contribution-dialog" aria-label="Contribution details" onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div className="contribution-dialog-content"><button type="button" className="contribution-dialog-close" aria-label="Close contribution form" onClick={onClose}><X size={22}/></button><ContributionForm onBack={onClose}/></div></dialog>, document.body);
}
