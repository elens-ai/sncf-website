export const PAGE_ACTIVITY_EVENT = 'sncf-page-activity';

export function pageIsActive(element?: HTMLElement) {
  return !document.hidden && (document.documentElement.dataset.backgroundPaused !== 'true'
    || !!element?.closest('[aria-modal="true"], dialog[open]'));
}
