import { Link } from 'react-router-dom';
import React from 'react';
import { MapPin, Phone, Mail, Heart } from 'lucide-react';

/**
 * Site footer.
 *
 * Links and contact details are transcribed from nirankarifoundation.org — the
 * same three groups its own footer carries, with the real destinations rather
 * than guessed paths.
 *
 * It sits on the page-wide .accent-canvas like every other screen, with a dark
 * wash over it. That wash is deliberate, not the seam problem returning: a
 * footer is meant to read as a distinct band, and this is a translucent black
 * over the SAME gradient rather than a second gradient starting over.
 *
 * Not a snap target — it is a closing band, not a screen, and snapping to it
 * would strand the reader on a wall of links.
 */

/* Nothing here points at nirankarifoundation.org. This site replaces it and
   that domain is being decommissioned, so every link that used to leave for
   it now goes to the page here that carries the same material. The Mission's
   OTHER properties are separate live sites and still link out.

   Not yet rehoused: Privacy Policy, Terms of Service, Social Media Guidelines
   and Foreign Contributions had no equivalent page here, so rather than link
   to a dying domain they are held back until those pages exist. */
const GROUPS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Explore',
    links: [
      { label: 'Core Values', href: '/core-values' },
      { label: 'Projects', href: '/projects' },
      { label: 'Who We Are', href: '/who-we-are' },
      { label: 'Our Guiding Force', href: '/our-guiding-force' },
    ],
  },
  {
    title: 'Useful links',
    links: [
      { label: 'Awards and Honours', href: '/#awards' },
      { label: 'Our Partners', href: '/who-we-are' },
      { label: 'Contact', href: '/who-we-are' },
    ],
  },
  {
    title: 'Sant Nirankari Mission',
    links: [
      { label: 'Sant Nirankari Mission', href: 'https://nirankari.org/' },
      { label: 'Sant Nirankari Health City', href: 'https://www.nirankarihealthcity.org/' },
      { label: 'Sant Nirankari Public School', href: 'https://snps.edu.in/' },
      { label: 'NBGSM College, Sohna', href: 'https://nbgsmc.ac.in/' },
      { label: 'Sant Nirankari Blood Bank', href: 'https://www.santnirankaribloodbank.org/' },
    ],
  },
];

interface SiteFooterProps {
  onOpenDonate: () => void;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({ onOpenDonate }) => (
  <footer
    id="site-footer"
    className="site-footer relative z-10 w-full"
  >
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-12 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
        {/* Identity + contact */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            {/* the same white disc the header gives it — on the footer's deep
                ground the emblem's own petals had nothing to read against */}
            <span className="footer-badge" aria-hidden="true">
              <img
                src="https://elens-graphics.s3.ap-south-1.amazonaws.com/sncf-logo-only.webp"
                alt=""
                referrerPolicy="no-referrer"
              />
            </span>
            <div>
              <p className="font-artistic-display text-white text-[15px] font-extrabold tracking-[0.13em] uppercase leading-tight">
                Sant Nirankari
              </p>
              <p className="font-artistic-display text-white/75 text-[10px] font-semibold tracking-[0.18em] uppercase">
                Charitable Foundation
              </p>
            </div>
          </div>

          <p className="font-signature text-white text-[30px] leading-none mb-5">
            Service with Humility
          </p>

          <address className="not-italic space-y-2.5">
            <p className="flex items-start gap-2.5 text-[13px] text-white/70 leading-relaxed">
              <MapPin className="w-4 h-4 flex-none mt-0.5 text-white/45" />
              80-A, Avtar Marg, Sant Nirankari Colony, Delhi 110009
            </p>
            <a
              href="tel:+911147660380"
              className="flex items-center gap-2.5 text-[13px] text-white/70 hover:text-white transition-colors"
            >
              <Phone className="w-4 h-4 flex-none text-white/45" />
              011-47660380
            </a>
            <a
              href="mailto:accounts@nirankarifoundation.org"
              className="flex items-center gap-2.5 text-[13px] text-white/70 hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4 flex-none text-white/45" />
              accounts@nirankarifoundation.org
            </a>
          </address>

          <button
            onClick={onOpenDonate}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-neutral-900 font-bold text-[13px] shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <Heart className="w-3.5 h-3.5" fill="currentColor" />
            Contribute
          </button>
        </div>

        {/* Link groups */}
        <nav aria-label="Footer" className="grid gap-8 sm:grid-cols-3">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h2 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/55 mb-3">
                {group.title}
              </h2>
              <ul className="space-y-2">
                {group.links.map((link) => {
                  const cls =
                    'text-[13px] text-white/75 hover:text-white transition-colors';
                  /* our own routes stay in the app; only the Mission's other
                     sites open in a new tab */
                  const internal = link.href.startsWith('/');
                  return (
                    <li key={link.label}>
                      {internal ? (
                        <Link to={link.href} className={cls}>
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cls}
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Year is computed, so the notice cannot go stale the way a hardcoded
            one does — the source site still reads 2025. */}
        <p className="text-[12px] text-white/55">
          © 2010–{new Date().getFullYear()} Sant Nirankari Charitable Foundation
        </p>
        <p className="text-[12px] text-white/45">
          Donations are tax deductible under section 80G(5)(vi) of the Income Tax Act, 1961.
        </p>
      </div>
    </div>
  </footer>
);
