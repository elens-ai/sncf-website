/** Existing public identity and contact details; not invented authoring examples. */
export const siteDefaults = {
  branding: {
    name: 'Sant Nirankari Charitable Foundation',
    logo: 'https://elens-graphics.s3.ap-south-1.amazonaws.com/sncf-logo-only.webp',
    tagline: 'Service with Humility',
  },
  contact: {
    email: 'accounts@nirankarifoundation.org',
    telephone: '011-47660380',
    address: '80-A, Avtar Marg, Sant Nirankari Colony, Delhi 110009',
  },
  seo: {
    title: 'Sant Nirankari Charitable Foundation',
    description: 'Service with humility — Heal, Enrich, Empower.',
    image: '/images/sncf-logo.webp',
  },
  /** Icons down the left edge and in the footer; a platform without a URL is not shown.
      The foundation's own profiles, as the footer of nirankarifoundation.org lists
      them (checked October 2026): Facebook, X, YouTube and Instagram; and its
      LinkedIn company page (Sant Nirankari Charitable Foundation (SNCF)), which
      is shown in the footer only (SocialSidebar). */
  social: [
    { platform: 'instagram', url: 'https://www.instagram.com/nirankaricharitablefoundation/' },
    { platform: 'youtube', url: 'https://www.youtube.com/channel/UCdAj1x5SmFLzQEJNvu5jezw' },
    { platform: 'facebook', url: 'https://www.facebook.com/santnirankaricharitablefoundation' },
    { platform: 'x', url: 'https://x.com/santnirankari' },
    { platform: 'linkedin', url: 'https://www.linkedin.com/company/sant-nirankari-charitable-foundation-sncf/' },
  ] as SocialLink[],
  /* Nothing here points at nirankarifoundation.org: that domain is being
     decommissioned, so its material links to the pages here instead. Privacy
     Policy, Terms, Social Media Guidelines and Foreign Contributions are held
     back until those pages exist. */
  footerColumns: [
    { title: 'Explore', links: [
      { label: 'Core Values', href: '/core-values' },
      { label: 'Projects', href: '/projects' },
      { label: 'Who We Are', href: '/who-we-are' },
      { label: 'Our Guiding Force', href: '/our-guiding-force' },
    ] },
    { title: 'Useful links', links: [
      { label: 'Awards and Honours', href: '/#awards-section' },
      { label: 'Our Partners', href: '/who-we-are#partners' },
      { label: 'Contact', href: '/who-we-are#contact' },
    ] },
    { title: 'Sant Nirankari Mission', links: [
      { label: 'Sant Nirankari Mission', href: 'https://nirankari.org/' },
      { label: 'Sant Nirankari Health City', href: 'https://www.nirankarihealthcity.org/' },
      { label: 'Sant Nirankari Public School', href: 'https://snps.edu.in/' },
      { label: 'NBGSM College, Sohna', href: 'https://nbgsmc.ac.in/' },
      { label: 'Sant Nirankari Blood Bank', href: 'https://www.santnirankaribloodbank.org/' },
    ] },
  ] as FooterColumn[],
};

export const SOCIAL_PLATFORMS = ['instagram', 'youtube', 'spotify', 'facebook', 'x', 'linkedin', 'whatsapp'] as const;
export interface SocialLink { platform: typeof SOCIAL_PLATFORMS[number]; url: string }
export interface FooterColumn { title: string; links: { label: string; href: string }[] }
