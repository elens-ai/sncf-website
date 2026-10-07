import type { ReactNode } from 'react';
import './quote-words.css';

/** Matching decorative marks, kept out of the quote's accessible text. */
export function QuoteWords({ children }: { children: ReactNode }) {
  return <div className="quote-words">
    <span className="quote-mark" aria-hidden="true">“</span>
    {children}
    <span className="quote-mark quote-mark-close" aria-hidden="true">”</span>
  </div>;
}
