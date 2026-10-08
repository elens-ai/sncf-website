import React from 'react';

/** The teacher remains beside the classroom throughout the bus arrival. */
export function SchoolTeacherDrawing({ compact = false }: { compact?: boolean }) {
  return <g className="school-teacher" transform={compact ? 'translate(355.25 215.4)' : 'translate(363.4 442.24)'}>
    <g transform="scale(.64)">
      <g transform="translate(-685 -316)" fill="none">
        <path fill="var(--sketch-rose)" fillOpacity=".16" stroke="none" d="M673 170L696 174 708 240 665 244Z" />
        <path d="M678 169Q665 166 665 151Q668 138 681 139Q695 144 691 158L685 171M666 148Q662 137 677 133Q695 134 698 155L692 175M675 171L662 185 657 223 667 246 705 240 710 208 697 177 687 170M675 180L681 189 690 179M701 189L720 210 710 229M695 200L709 214 702 223" />
        <g><path d="M668 245L666 278 665 310M676 246L676 279 679 308M665 310L656 315H674L679 308" /></g>
        <g><path d="M689 244L691 278 701 306M699 243L700 276 709 306M701 306L696 314 713 316 719 312 709 306" /></g>
        <g><path d="M666 185L648 173 623 167M662 195L644 182 622 175M623 167L615 164 611 169 621 175M612 169L605 163" /></g>
      </g>
    </g>
  </g>;
}
