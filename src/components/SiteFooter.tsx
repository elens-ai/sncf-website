import { resolveCMSMedia } from '../cms/media';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { getSiteSettings, siteOverride } from '../cms/siteSettings';
import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
import { Link } from 'react-router-dom';
import React from 'react';
import { MapPin, Phone, Mail, Heart, Handshake, CalendarHeart, ArrowUpRight, ArrowUp } from 'lucide-react';
import { UnSeal } from './UnAffiliation';
import { SOCIAL_ART } from './SocialSidebar';
import './site-footer.css';

/**
 * Site footer: the closing band.
 *
 * Links and contact details are transcribed from nirankarifoundation.org — the
 * same three groups its own footer carries, with the real destinations rather
 * than guessed paths.
 *
 * It closes every page on the same note: the site's own deep teal (the ground
 * its home sections end on), rising into the page in a wave edged with the
 * logo's five petal colours, the lotus faint behind it. It opens with an
 * invitation (give, partner, or join a moment) before the address and the
 * links, and ends with a way back to the top.
 *
 * Not a snap target — it is a closing band, not a screen, and snapping to it
 * would strand the reader on a wall of links.
 */

/* The link columns are Site settings → Footer columns in the CMS. */

interface SiteFooterProps {
  onOpenDonate: () => void;
}

const c = (key: string, fallback: string) => getCMSCopy(`copy.SiteFooter.${key}`, fallback);
/* the logo's petals, in the order they open */
const PETALS = ['#f81170', '#b357ad', '#6663b5', '#09a6cf', '#69b947'];

export const SiteFooter: React.FC<SiteFooterProps> = ({ onOpenDonate }) => {
  useCMSRevision();
  const site = getSiteSettings();
  const GROUPS = site.footerColumns;
  const toTop = () => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

  return (
  <footer
    id="site-footer"
    className="site-footer relative z-10 w-full"
  >
    {/* the band rises into the page in a wave, edged in the logo's petal colours */}
    <svg className="footer-crest" viewBox="0 0 1440 56" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="footer-petals" x1="0" x2="1" y1="0" y2="0">
          {PETALS.map((ink, i) => <stop key={ink} offset={i / (PETALS.length - 1)} stopColor={ink} />)}
        </linearGradient>
      </defs>
      <path className="footer-crest-fill" d="M0 56V32C240 6 480 0 720 18S1200 54 1440 24V56Z" />
      <path className="footer-crest-ink" d="M0 32C240 6 480 0 720 18S1200 54 1440 24" stroke="url(#footer-petals)" />
    </svg>
    <img className="footer-lotus" src={resolveCMSMedia(resolveCMSAsset('asset.SiteFooter.lotus', '/images/lotus-watermark.png'))} alt="" aria-hidden="true" draggable={false} />

    <div className="footer-inner w-full max-w-7xl mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-12 sm:py-14">
      {/* the closing invitation: three ways in */}
      <section className="footer-invite" aria-labelledby="footer-invite-title">
        <div className="footer-invite-copy">
          <p className="footer-signature font-signature">{siteOverride("branding", "tagline", getCMSCopy("copy.SiteFooter.56219e473693", "Service with Humility"))}</p>
          <h2 id="footer-invite-title">{c('invite-title', 'There is a place for you in this service.')}</h2>
          <p>{c('invite-lead', 'Give, partner with us, or simply turn up. Every hand that joins makes the circle stronger.')}</p>
        </div>
        <ul className="footer-ways">
          <li>
            <button type="button" className="footer-way" style={{ '--way': PETALS[0] } as React.CSSProperties} onClick={onOpenDonate}>
              <span className="footer-way-icon" aria-hidden="true"><Heart size={17} fill="currentColor" /></span>
              <strong>{getCMSCopy("copy.SiteFooter.97b0c61b99f6", "Contribute")}</strong>
              <span>{c('way-give', 'Give to the work that moves you')}</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          </li>
          <li>
            <Link className="footer-way" style={{ '--way': PETALS[3] } as React.CSSProperties} to="/?partner-invite=1#partners-section">
              <span className="footer-way-icon" aria-hidden="true"><Handshake size={18} /></span>
              <strong>{c('way-partner', 'Become a partner')}</strong>
              <span>{c('way-partner-line', 'Bring your organisation’s CSR to the work')}</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </li>
          <li>
            <Link className="footer-way" style={{ '--way': PETALS[4] } as React.CSSProperties} to="/#events-section">
              <span className="footer-way-icon" aria-hidden="true"><CalendarHeart size={18} /></span>
              <strong>{c('way-moment', 'Join a moment')}</strong>
              <span>{c('way-moment-line', 'Camps, drives and observances near you')}</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </li>
        </ul>
      </section>

      <div className="footer-main grid gap-10 lg:grid-cols-[1.2fr_2fr]">
        {/* Identity + contact */}
        <div className="footer-identity">
          <div className="flex items-center gap-3 mb-5">
            {/* the same white disc the header gives it — on the footer's deep
                ground the emblem's own petals had nothing to read against */}
            <span className="footer-badge" aria-hidden="true">
              <img
                src={resolveCMSMedia(siteOverride("branding", "logo", resolveCMSAsset("asset.SiteFooter.25aa35189463", "https://elens-graphics.s3.ap-south-1.amazonaws.com/sncf-logo-only.webp")))}
                alt=""
                referrerPolicy="no-referrer"
              />
            </span>
            <div>
              <p className="font-artistic-display text-white text-[15px] font-extrabold tracking-[0.13em] uppercase leading-tight">{siteOverride("branding", "name", getCMSCopy("copy.SiteFooter.3eeeb717e545", "Sant Nirankari"))}</p>
              <p className="font-artistic-display text-white/75 text-[10px] font-semibold tracking-[0.18em] uppercase">{getCMSCopy("copy.SiteFooter.4b0937769465", "Charitable Foundation")}</p>
            </div>
          </div>

          <address className="not-italic space-y-2.5">
            <p className="flex items-start gap-2.5 text-[13px] text-white/70 leading-relaxed">
              <MapPin className="w-4 h-4 flex-none mt-0.5 text-white/45" />{siteOverride("contact", "address", getCMSCopy("copy.SiteFooter.beb1d4c609ce", "80-A, Avtar Marg, Sant Nirankari Colony, Delhi 110009"))}</p>
            <a
              href={`tel:${site.contact.telephone.replace(/[^+0-9]/g, "")}`}
              className="flex items-center gap-2.5 text-[13px] text-white/70 hover:text-white transition-colors"
            >
              <Phone className="w-4 h-4 flex-none text-white/45" />{siteOverride("contact", "telephone", getCMSCopy("copy.SiteFooter.a4c324b95c22", "011-47660380"))}</a>
            <a
              href={`mailto:${site.contact.email}`}
              className="flex items-center gap-2.5 text-[13px] text-white/70 hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4 flex-none text-white/45" />{siteOverride("contact", "email", getCMSCopy("copy.SiteFooter.bee1eacddce6", "accounts@nirankarifoundation.org"))}</a>
          </address>

          {/* the same social links as the left-hand rail (Site settings → Social links) */}
          {site.social.length > 0 && (
            <ul className="footer-socials" aria-label={c('social', 'Follow the foundation')}>
              {site.social.map(link => {
                const art = SOCIAL_ART[link.platform];
                return art ? (
                  <li key={link.platform}>
                    <a className="footer-social" href={link.url} target="_blank" rel="noopener noreferrer" aria-label={art.ariaLabel} title={art.name}>{art.icon}</a>
                  </li>
                ) : null;
              })}
            </ul>
          )}
          {/* the foundation's UN standing, on every page */}
          <div className="mt-5"><UnSeal /></div>
        </div>

        {/* Link groups */}
        <nav aria-label={getCMSCopy("copy.SiteFooter.26c87bb51e69", "Footer")} className="grid gap-8 sm:grid-cols-3">
          {GROUPS.map((group, gi) => (
            <div key={group.title}>
              <h2 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/55 mb-3">
                <i className="footer-group-dot" style={{ color: PETALS[gi % PETALS.length] }} aria-hidden="true" />{group.title}
              </h2>
              <ul className="space-y-2">
                {group.links.map((link) => {
                  const cls =
                    'footer-link text-[13px] text-white/75 hover:text-white transition-colors';
                  /* our own routes stay in the app; only the Mission's other
                     sites open in a new tab */
                  const internal = link.href.startsWith('/');
                  return (
                    <li key={`${link.label}-${link.href}`}>
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
                          {link.label}<ArrowUpRight className="footer-link-away" size={12} aria-hidden="true" />
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

      <div className="footer-base">
        {/* Year is computed, so the notice cannot go stale the way a hardcoded
            one does — the source site still reads 2025. */}
        <p className="text-[12px] text-white/55">{getCMSCopy("copy.SiteFooter.fc07ad55cde7", "© 2010–")}{new Date().getFullYear()}{getCMSCopy("copy.SiteFooter.e69147f309ca", " Sant Nirankari Charitable Foundation")}</p>
        <p className="text-[12px] text-white/45">{getCMSCopy("copy.SiteFooter.4e29309898d7", "Donations are tax deductible under section 80G(5)(vi) of the Income Tax Act, 1961.")}</p>
        <button type="button" className="footer-top" onClick={toTop}><ArrowUp size={14} aria-hidden="true" />{c('top', 'Back to top')}</button>
      </div>
    </div>
  </footer>
);
};
