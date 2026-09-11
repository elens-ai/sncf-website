import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { getCMSCopy, getCMSSnapshot, getCMSRevision, getCMSPreviewState, startCMSPolling, subscribeCMS } from './runtime';

const CMSRevisionContext = createContext(0);

/** Publication changes preserve component identity, focus and the visitor's scroll position. */
export function CMSContentProvider({ children }: { children: ReactNode }) {
  const revision = useSyncExternalStore(subscribeCMS, getCMSRevision, () => 0);
  useEffect(startCMSPolling, []);
  const preview = getCMSPreviewState();
  return <CMSRevisionContext.Provider value={revision}>
    {children}
    {preview && <aside role="status" style={{ position: 'fixed', bottom: 12, right: 12, zIndex: 99999, background: '#102b25', color: '#fff', border: '1px solid #81c9ad', borderRadius: 8, padding: '8px 14px', fontSize: 12, maxWidth: 340 }}>
      {preview === 'connected' ? 'CMS draft preview · Only signed-in editors can see this.' : preview === 'unauthorized' ? 'CMS preview · Sign in to the CMS, then refresh this tab. Showing bundled content.' : 'CMS preview offline · Showing the last loaded content while reconnecting.'}
    </aside>}
  </CMSRevisionContext.Provider>;
}

export const useCMSRevision = () => useContext(CMSRevisionContext);

export function useCMSText(key: string, fallback: string) {
  useCMSRevision();
  return getCMSCopy(key, fallback);
}

export function CMSSection({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  useCMSRevision();
  const settings = getCMSSnapshot().components?.[id];
  if (settings?.enabled === false) return null;
  // Avoid a new containing block around the long sticky pavilion and hero sections.
  return className ? <div className={className} data-cms-component={id}>{children}</div> : <>{children}</>;
}
