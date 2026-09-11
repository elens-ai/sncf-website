import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getCMSCopy } from '../cms/runtime';
import { DonationExperience } from './DonationExperience';

export const DonateModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [isOpen]);
  if (!isOpen) return null;
  return createPortal(<dialog ref={dialogRef} id="donate-modal-backdrop" aria-label={getCMSCopy('copy.DonateModal.ca9e7065cc38', 'Ways to contribute')}
    onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div id="donate-modal-panel"><DonationExperience onClose={onClose} /></div>
  </dialog>, document.body);
};
