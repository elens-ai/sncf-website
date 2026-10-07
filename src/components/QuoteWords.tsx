import type { ReactNode } from 'react';
import './quote-words.css';

/** Matching decorative marks, kept out of the quote's accessible text. Without `close`, the quote sets its own
    closing mark at the end of its words (Saying's `closeInline`). */
export function QuoteWords({ children, close = true }: { children: ReactNode; close?: boolean }) {
  return <div className="quote-words">
    <span className="quote-mark" aria-hidden="true">“</span>
    {children}
    {close && <span className="quote-mark quote-mark-close" aria-hidden="true">”</span>}
  </div>;
}
