import { resolveCMSMedia } from '../cms/media';
import { getCMSLink } from '../cms/links';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { getSiteSettings, siteOverride } from '../cms/siteSettings';
import { getCMSCopy, resolveCMSAsset } from '../cms/runtime';
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
const getGroups = (): { title: string; links: { label: string; href: string }[] }[] => [
  {
    title: getCMSCopy("copy.SiteFooter.3b73900b8d29", "Explore"),
    links: [
      { label: getCMSCopy("copy.SiteFooter.5912782f153a", "Core Values"), href: getCMSLink("copy.Link.SiteFooter.2a4827271280", "/core-values") },
      { label: getCMSCopy("copy.SiteFooter.04e2a9728af7", "Projects"), href: getCMSLink("copy.Link.SiteFooter.902ceeb21a5f", "/projects") },
      { label: getCMSCopy("copy.SiteFooter.10a516acef81", "Who We Are"), href: getCMSLink("copy.Link.SiteFooter.3146c10d2d72", "/who-we-are") },
      { label: getCMSCopy("copy.SiteFooter.b733f26c2ca4", "Our Guiding Force"), href: getCMSLink("copy.Link.SiteFooter.bd0b0305afe8", "/our-guiding-force") },
    ],
  },
  {
    title: getCMSCopy("copy.SiteFooter.44cf6ffe1e9a", "Useful links"),
    links: [
      { label: getCMSCopy("copy.SiteFooter.d0db09ad56c2", "Awards and Honours"), href: getCMSLink("copy.Link.SiteFooter.eab672aebd73", "/#awards") },
      { label: getCMSCopy("copy.SiteFooter.8a787be23f3f", "Our Partners"), href: getCMSLink("copy.Link.SiteFooter.3146c10d2d72", "/who-we-are") },
      { label: getCMSCopy("copy.SiteFooter.2b5c3d26721a", "Contact"), href: getCMSLink("copy.Link.SiteFooter.3146c10d2d72", "/who-we-are") },
    ],
  },
  {
    title: getCMSCopy("copy.SiteFooter.4e51d6a701d7", "Sant Nirankari Mission"),
    links: [
      { label: getCMSCopy("copy.SiteFooter.4e51d6a701d7", "Sant Nirankari Mission"), href: getCMSLink("copy.Link.SiteFooter.a23cd263f359", "https://nirankari.org/") },
      { label: getCMSCopy("copy.SiteFooter.3c66946f7a8a", "Sant Nirankari Health City"), href: getCMSLink("copy.Link.SiteFooter.b03f7697e124", "https://www.nirankarihealthcity.org/") },
      { label: getCMSCopy("copy.SiteFooter.74740a4515c9", "Sant Nirankari Public School"), href: getCMSLink("copy.Link.SiteFooter.5050e737372d", "https://snps.edu.in/") },
      { label: getCMSCopy("copy.SiteFooter.ff19513517ce", "NBGSM College, Sohna"), href: getCMSLink("copy.Link.SiteFooter.ddd6fdf34d33", "https://nbgsmc.ac.in/") },
      { label: getCMSCopy("copy.SiteFooter.52bd35a89e0e", "Sant Nirankari Blood Bank"), href: getCMSLink("copy.Link.SiteFooter.e164241f70f5", "https://www.santnirankaribloodbank.org/") },
    ],
  },
];

interface SiteFooterProps {
  onOpenDonate: () => void;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({ onOpenDonate }) => {
  useCMSRevision();
  const site = getSiteSettings();
  const GROUPS = getGroups();
  return (
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

          <p className="font-signature text-white text-[30px] leading-none mb-5">{siteOverride("branding", "tagline", getCMSCopy("copy.SiteFooter.56219e473693", "Service with Humility"))}</p>

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

          <button
            onClick={onOpenDonate}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-neutral-900 font-bold text-[13px] shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <Heart className="w-3.5 h-3.5" fill="currentColor" />{getCMSCopy("copy.SiteFooter.97b0c61b99f6", "Contribute")}</button>
        </div>

        {/* Link groups */}
        <nav aria-label={getCMSCopy("copy.SiteFooter.26c87bb51e69", "Footer")} className="grid gap-8 sm:grid-cols-3">
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
        <p className="text-[12px] text-white/55">{getCMSCopy("copy.SiteFooter.fc07ad55cde7", "© 2010–")}{new Date().getFullYear()}{getCMSCopy("copy.SiteFooter.e69147f309ca", " Sant Nirankari Charitable Foundation")}</p>
        <p className="text-[12px] text-white/45">{getCMSCopy("copy.SiteFooter.4e29309898d7", "Donations are tax deductible under section 80G(5)(vi) of the Income Tax Act, 1961.")}</p>
      </div>
    </div>
  </footer>
);
};
