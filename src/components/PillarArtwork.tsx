import React from 'react';
import './pillar-artwork.css';

/** Decorative activity-specific drawings; no image requests or animation loop. */
export const PillarArtwork: React.FC<{ pillarId: string; variant?: 'background' | 'album'; visible?: boolean }> = ({ pillarId, variant = 'background', visible }) => (
  <div className={`pillar-artwork pillar-artwork--${variant}`} data-art={pillarId} data-visible={visible} aria-hidden="true">
    <svg viewBox="0 0 900 620" fill="none" focusable="false">
      <g className="pillar-art-wash" fill="currentColor">
        <path d="M486 48C640-42 892 62 860 241S905 467 739 550 448 535 444 400 333 138 486 48Z" />
        <circle cx="248" cy="445" r="115" />
      </g>
      <g className="pillar-art-lines" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {pillarId === 'heal' && <>
          <path d="M477 198C409 98 288 201 379 289L477 379 575 289C666 201 545 98 477 198Z" />
          <path d="M266 281H397L419 244 450 324 478 270 495 281H690" strokeWidth="3" />
          <path d="M624 136V104H656V136H688V168H656V200H624V168H592V136Z" />
          <path d="M331 373C306 416 283 434 283 459A48 48 0 0 0 379 459C379 434 356 416 331 373Z" />
          <path d="M433 471C463 443 488 449 521 462L584 469C607 471 611 493 590 501L532 507M398 519L449 535C492 551 520 550 559 530L674 461C703 441 686 418 665 428L603 458M378 481L410 456" />
          <circle cx="754" cy="326" r="66" /><circle cx="754" cy="326" r="85" strokeDasharray="2 12" />
        </>}
        {pillarId === 'enrich' && <>
          <path d="M287 272Q374 241 470 299Q566 241 653 272V465Q560 438 470 496Q379 438 287 465ZM470 299V496" strokeWidth="3" />
          <path d="M314 312Q378 295 439 329M314 342Q378 325 439 359M314 372Q378 355 439 389M501 329Q562 295 626 312M501 359Q562 325 626 342M501 389Q562 355 626 372" />
          <path d="M381 158L480 119 579 158 480 199ZM419 176V213Q480 246 542 213V176M579 158V223" />
          <path d="M692 272L730 200 750 210 712 282 689 300ZM699 260L719 270" />
          <circle cx="333" cy="147" r="35" /><path d="M333 96V78M282 147H264M297 111L284 98M369 111L382 98" />
          <path d="M240 523Q415 577 613 529T818 399" strokeDasharray="3 11" />
        </>}
        {pillarId === 'empower' && <>
          <path d="M496 464V208M496 316C421 320 376 272 378 207C447 206 494 248 496 316ZM496 264C568 266 610 219 611 158C541 158 497 201 496 264Z" strokeWidth="3" />
          <path d="M496 391C565 393 607 348 610 291C542 289 497 329 496 391ZM496 357L421 252M496 245L567 202M496 373L567 331" />
          <circle cx="339" cy="366" r="26" /><circle cx="657" cy="366" r="26" /><circle cx="496" cy="477" r="26" />
          <path d="M286 479V445Q286 404 339 404Q365 404 386 424L422 450M710 479V445Q710 404 657 404Q631 404 610 424L574 450M444 560V548Q444 514 496 514Q548 514 548 548V560" />
          <path d="M272 293A246 246 0 0 1 697 225M687 191L701 229 662 232M732 453A247 247 0 0 1 642 549" strokeDasharray="4 10" />
          <path d="M257 527Q334 500 406 526M586 526Q662 500 739 527" />
        </>}
        {pillarId === 'projects' && <>
          <path d="M291 377V237H402V377M317 237V204H376V237M334 267H359M346 255V279M317 307H334M359 307H377M317 337H334M359 337H377M439 377V283H518V377M546 377V185H635V377M568 217H611M568 246H611M568 275H611M568 304H611" />
          <path d="M240 387H758M696 384V265M696 211L655 286H737ZM671 257L646 315H746" strokeWidth="3" />
          <path d="M284 433Q370 410 467 441T701 431M248 467Q341 444 457 475T748 465M290 502Q398 480 509 509T720 502M324 537Q418 518 507 540T669 538" />
          <circle cx="746" cy="164" r="39" /><path d="M746 104V88M806 164H822M788 122L800 110M704 122L692 110" />
          <path d="M234 341V181Q234 140 275 140H412M423 117V163M400 140H446" strokeDasharray="3 10" />
        </>}
      </g>
      <g className="pillar-art-sparks" fill="currentColor"><circle cx="220" cy="240" r="4" /><circle cx="787" cy="425" r="5" /><circle cx="574" cy="90" r="3" /><circle cx="382" cy="568" r="3" /></g>
    </svg>
  </div>
);
