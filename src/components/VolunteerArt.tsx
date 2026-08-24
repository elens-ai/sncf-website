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
