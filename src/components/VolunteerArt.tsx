import React from 'react';

/**
 * The SNCF volunteers, drawn flat.
 *
 * At every drive the volunteers are the event — rows of royal-blue tees and
 * caps, as in the foundation's own photographs. These two figures put that
 * uniform into the event cards the way the reference poster flanks its
 * invitation with its people: flat vector, the site's illustration language,
 * zero image weight.
 *
 * VOLUNTEER_BLUE is sampled from the uniform in the photographs.
 */

export const VOLUNTEER_BLUE = '#2456c0';
const BLUE_DEEP = '#18409a';
const BLUE_TRIM = '#6b96e8';
const SKIN = '#e7b489';
const LEAF = '#35b378';
const LEAF_DEEP = '#238a5e';
const POT = '#b4552e';
const POT_RIM = '#8a3f22';

/** Volunteer holding a sapling — the planting-drive pose. */
export const VolunteerPlanting: React.FC<{ className?: string }> = ({
  className = 'w-20 h-20',
}) => (
  <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
    {/* torso */}
    <path d="M28 96V70a20 20 0 0 1 40 0v26z" fill={VOLUNTEER_BLUE} />
    {/* sleeve trim */}
    <path d="M28 78h6v18h-6zM62 78h6v18h-6z" fill={BLUE_TRIM} opacity="0.9" />
    {/* head */}
    <circle cx="48" cy="30" r="12" fill={SKIN} />
    {/* cap dome + brim */}
    <path d="M36 28a12 12 0 0 1 24 0v1H36z" fill={VOLUNTEER_BLUE} />
    <rect x="33" y="27" width="30" height="5" rx="2.5" fill={BLUE_DEEP} />
    {/* arms reaching to the pot */}
    <path
      d="M33 70q3 9 10 11M63 70q-3 9-10 11"
      stroke={SKIN}
      strokeWidth="6"
      strokeLinecap="round"
      fill="none"
    />
    {/* chest badge */}
    <circle cx="48" cy="72" r="4.5" fill="#ffffff" />
    <circle cx="48" cy="72" r="2" fill={VOLUNTEER_BLUE} />
    {/* pot */}
    <rect x="38" y="80" width="20" height="4" rx="2" fill={POT_RIM} />
    <path d="M40 84h16l-2 12H42z" fill={POT} />
    {/* sapling */}
    <path d="M48 80V66" stroke={LEAF_DEEP} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M48 66c-9-2-13-8-13-15 9 0 13 7 13 15z" fill={LEAF} />
    <path d="M48 70c8-1 12-6 12-13-8 0-12 6-12 13z" fill={LEAF_DEEP} />
  </svg>
);

/** Volunteer waving — the welcome-in pose. */
export const VolunteerWaving: React.FC<{ className?: string }> = ({
  className = 'w-20 h-20',
}) => (
  <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
    {/* raised waving arm, behind the torso */}
    <path
      d="M62 68q11-7 13-20"
      stroke={SKIN}
      strokeWidth="6"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="76" cy="45" r="4.5" fill={SKIN} />
    {/* torso */}
    <path d="M28 96V72a20 20 0 0 1 40 0v24z" fill={VOLUNTEER_BLUE} />
    {/* sleeve trim */}
    <path d="M28 80h6v16h-6zM62 80h6v16h-6z" fill={BLUE_TRIM} opacity="0.9" />
    {/* head */}
    <circle cx="48" cy="32" r="12" fill={SKIN} />
    {/* cap dome + brim */}
    <path d="M36 30a12 12 0 0 1 24 0v1H36z" fill={VOLUNTEER_BLUE} />
    <rect x="33" y="29" width="30" height="5" rx="2.5" fill={BLUE_DEEP} />
    {/* chest badge */}
    <circle cx="48" cy="74" r="4.5" fill="#ffffff" />
    <circle cx="48" cy="74" r="2" fill={VOLUNTEER_BLUE} />
  </svg>
);

/**
 * The planning table — volunteers in uniform around a whiteboard, working
 * out the next drive. The reference-poster composition (a team mid-planning
 * at the card's foot) redrawn as SNCF volunteers: blue tees, blue caps, a
 * board of charts and a sapling on the table. One wide flat-vector scene,
 * meant to sit full-bleed at the bottom of the invitation card.
 */
export const VolunteersPlanning: React.FC<{ className?: string }> = ({
  className = 'w-full h-auto',
}) => (
  <svg viewBox="0 0 320 150" className={className} aria-hidden="true">
    {/* ---- whiteboard on an A-frame stand ---- */}
    <path d="M128 74l-10 48M192 74l10 48" stroke="#33549c" strokeWidth="4" strokeLinecap="round" />
    <rect x="112" y="16" width="96" height="60" rx="5" fill="#ffffff" />
    <rect x="112" y="16" width="96" height="60" rx="5" fill="none" stroke="#c8cfdd" strokeWidth="2" />
    {/* bars */}
    <rect x="124" y="48" width="9" height="18" rx="2" fill={BLUE_TRIM} />
    <rect x="137" y="38" width="9" height="28" rx="2" fill={VOLUNTEER_BLUE} />
    <rect x="150" y="28" width="9" height="38" rx="2" fill={BLUE_DEEP} />
    {/* rising line */}
    <path d="M168 60l12-12 10 6 14-18" stroke={LEAF} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="204" cy="36" r="3" fill={LEAF} />
    {/* mini calendar row */}
    <circle cx="126" cy="24" r="2.2" fill="#2FA96B" />
    <circle cx="134" cy="24" r="2.2" fill="#64b5f6" />
    <circle cx="142" cy="24" r="2.2" fill="#f48fb1" />
    <circle cx="150" cy="24" r="2.2" fill="#6ac8ed" />
    {/* speech bubble */}
    <rect x="86" y="6" width="28" height="15" rx="7.5" fill="#ffffff" opacity="0.92" />
    <circle cx="95" cy="13.5" r="1.8" fill={VOLUNTEER_BLUE} />
    <circle cx="100" cy="13.5" r="1.8" fill={VOLUNTEER_BLUE} />
    <circle cx="105" cy="13.5" r="1.8" fill={VOLUNTEER_BLUE} />

    {/* ---- presenter, pointing at the board ---- */}
    <path d="M232 66q-16-8-24-20" stroke={SKIN} strokeWidth="5" strokeLinecap="round" fill="none" />
    <circle cx="206" cy="44" r="3.5" fill={SKIN} />
    <rect x="234" y="96" width="8" height="26" rx="3" fill="#1c3a7a" />
    <rect x="248" y="96" width="8" height="26" rx="3" fill="#1c3a7a" />
    <rect x="231" y="119" width="12" height="5" rx="2.5" fill="#0f2350" />
    <rect x="246" y="119" width="12" height="5" rx="2.5" fill="#0f2350" />
    <path d="M230 100V70a15 15 0 0 1 30 0v30z" fill={VOLUNTEER_BLUE} />
    <circle cx="245" cy="46" r="10" fill={SKIN} />
    <path d="M235 44a10 10 0 0 1 20 0v1h-20z" fill={VOLUNTEER_BLUE} />
    <rect x="228" y="43" width="21" height="4" rx="2" fill={BLUE_DEEP} />
    <circle cx="245" cy="74" r="3.5" fill="#ffffff" />

    {/* ---- seated volunteer, left, hand raised ---- */}
    <rect x="16" y="78" width="6" height="30" rx="3" fill="#33549c" />
    <rect x="14" y="106" width="30" height="6" rx="3" fill="#33549c" />
    <path d="M60 92q12-4 15-16" stroke={SKIN} strokeWidth="4.5" strokeLinecap="round" fill="none" />
    <circle cx="76" cy="74" r="3.2" fill={SKIN} />
    <path d="M34 108V88a13 13 0 0 1 26 0v20z" fill={VOLUNTEER_BLUE} />
    <circle cx="47" cy="66" r="9" fill={SKIN} />
    <path d="M38 64a9 9 0 0 1 18 0v1H38z" fill={VOLUNTEER_BLUE} />
    <rect x="40" y="63" width="19" height="3.5" rx="1.75" fill={BLUE_DEEP} />

    {/* ---- seated volunteer, right, at a laptop ---- */}
    <rect x="298" y="80" width="6" height="30" rx="3" fill="#33549c" />
    <rect x="276" y="108" width="30" height="6" rx="3" fill="#33549c" />
    <path d="M272 110V90a13 13 0 0 1 26 0v20z" fill={VOLUNTEER_BLUE} />
    <circle cx="285" cy="68" r="9" fill={SKIN} />
    <path d="M276 66a9 9 0 0 1 18 0v1h-18z" fill={VOLUNTEER_BLUE} />
    <rect x="263" y="65" width="19" height="3.5" rx="1.75" fill={BLUE_DEEP} />
    <path d="M282 92q-8 4-14 3" stroke={SKIN} strokeWidth="4.5" strokeLinecap="round" fill="none" />

    {/* ---- table, in front of everyone ---- */}
    <rect x="52" y="112" width="216" height="6" rx="3" fill="#33549c" opacity="0.55" />
    <rect x="46" y="100" width="228" height="11" rx="5.5" fill="#4a7ad4" />
    <rect x="58" y="111" width="7" height="30" rx="3" fill="#33549c" />
    <rect x="255" y="111" width="7" height="30" rx="3" fill="#33549c" />
    {/* papers + laptop base + sapling on the table */}
    <rect x="84" y="93" width="24" height="7" rx="1.5" fill="#ffffff" opacity="0.95" transform="rotate(-4 96 96)" />
    <rect x="240" y="90" width="18" height="10" rx="1.5" fill="#23407e" />
    <rect x="237" y="99" width="24" height="3" rx="1.5" fill="#33549c" />
    <rect x="152" y="94" width="16" height="4" rx="2" fill={POT_RIM} />
    <path d="M154 98h12l-1.5 8h-9z" fill={POT} />
    <path d="M160 94v-9" stroke={LEAF_DEEP} strokeWidth="2" strokeLinecap="round" />
    <path d="M160 85c-6-1.5-9-5.5-9-10 6 0 9 4.5 9 10z" fill={LEAF} />
    <path d="M160 88c5-1 8-4.5 8-9-5.5 0-8 4-8 9z" fill={LEAF_DEEP} />
  </svg>
);
