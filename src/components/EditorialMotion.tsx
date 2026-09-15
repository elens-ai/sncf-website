import React, { useEffect, useRef } from 'react';
import './editorial.css';

export function EditorialHeading({ n, id, label, title, body, className = 'cv-threshold' }: { n: number; id: string; label: string; title: string; body: string; className?: string }) {
  return <header className={className} data-reveal><span className="cv-threshold-num font-artistic-heading" aria-hidden="true">{String(n).padStart(2,'0')}</span><p className="cv-threshold-label font-artistic-display">{label}</p><h2 id={`${id}-title`} className="cv-threshold-title font-artistic-heading">{title}</h2><p className="cv-threshold-body font-artistic-serif">{body}</p></header>;
}

/** Content is readable before JS; entrance effects attach only upon arrival. */
export function EditorialMotion({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.setAttribute('data-arrived', 'true');
        observer.unobserve(entry.target);
      }
    }), { threshold: .08 });
    ref.current.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`editorial ${className}`}>{children}</div>;
}
