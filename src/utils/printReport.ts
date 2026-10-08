import '../components/report-print.css';

/** One programme on a printed report. */
export interface ReportProgramme {
  title: string;
  blurb: string;
  period: string;
  dataPoints: { label: string; value: string }[];
  /** The UN goals it advances, e.g. "SDG 3 Good health and well-being". */
  goals?: string[];
}

export interface Report {
  /** The document's title, also the saved PDF's name. */
  title: string;
  subtitle: string;
  /** The cornerstone's or project's colour, for the rule and the figures. */
  ink: string;
  foundation: string;
  programmes: ReportProgramme[];
  source: string;
}

const escape = (text: string) => text.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string));

/**
 * A REPORT TO KEEP. Opens the browser's print dialog on a clean A4 copy of a
 * cornerstone's or project's report (its programmes, every reported figure,
 * their periods and the source), from which it can be saved as a PDF. The
 * copy is laid in a layer of its own at the foot of the page, shown only to
 * the printer while the page itself is hidden from it, and removed once the
 * dialog closes. The page's title is the saved file's name for the while.
 */
export function printReport(report: Report) {
  document.querySelector('.report-print-root')?.remove();
  const root = document.createElement('div');
  root.className = 'report-print-root';
  root.style.setProperty('--ink', report.ink);
  const printed = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  root.innerHTML = `
    <article class="report-sheet">
      <header class="report-sheet-head">
        <div>
          <p class="report-sheet-foundation">${escape(report.foundation)}</p>
          <h1>${escape(report.title)}</h1>
          <p class="report-sheet-subtitle">${escape(report.subtitle)}</p>
        </div>
        <img src="/images/sncf-logo.webp" alt="" />
      </header>
      ${report.programmes.map(programme => `
        <section class="report-sheet-programme">
          <h2>${escape(programme.title)}</h2>
          <p class="report-sheet-period">${escape(programme.period)}${programme.goals?.length ? ` · ${escape(programme.goals.join(' · '))}` : ''}</p>
          <p class="report-sheet-blurb">${escape(programme.blurb)}</p>
          <table><tbody>${programme.dataPoints.map(point => `<tr><th scope="row">${escape(point.label)}</th><td>${escape(point.value)}</td></tr>`).join('')}</tbody></table>
        </section>`).join('')}
      <footer class="report-sheet-foot"><p>${escape(report.source)}</p><p>${escape(window.location.host)} · ${escape(printed)}</p></footer>
    </article>`;
  document.body.appendChild(root);
  document.body.classList.add('printing-report');
  const title = document.title;
  document.title = report.title;
  const done = () => {
    document.body.classList.remove('printing-report');
    document.title = title;
    root.remove();
    window.removeEventListener('afterprint', done);
  };
  window.addEventListener('afterprint', done);
  /* let the copy lay out, and its logo load, before the dialog opens */
  const open = () => requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  const logo = root.querySelector('img');
  if (logo && !logo.complete) {
    logo.addEventListener('load', open, { once: true });
    logo.addEventListener('error', open, { once: true });
  } else open();
}
