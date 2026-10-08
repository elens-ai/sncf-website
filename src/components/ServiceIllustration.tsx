import React, { useEffect, useId, useState } from 'react';
import { getCMSCopy } from '../cms/runtime';
import { useCMSRevision } from '../cms/CMSContentProvider';
import { useServiceScene } from './useServiceScene';
import { AmbulancePass } from './AmbulancePass';
import { Ink, RedFortDrawing, TajMahalDrawing, FloodReliefDrawing, HealDrawing, EnrichDrawing, NimaDrawing, DisasterReliefDrawing } from './ServiceSceneArtwork';
import { RailwayCleanupDrawing } from './RailwayCleanupDrawing';
import { DEFAULT_ILLUSTRATION_SECONDS, localIllustrationSettings, useIllustrationTiming } from './useIllustrationTiming';
import './empower-service-scene.css';

/** Original vector illustration: a civic courtyard being cared for together.
 * The drawing enters once; only the small gestures repeat while visible. */
export function ServiceIllustration({ home = false, pillar = 'empower' }: { home?: boolean; pillar?: 'heal' | 'enrich' | 'empower' }) {
  useCMSRevision();
  const [choice, setChoice] = useState(0);
  const scene = pillar === 'heal' ? 'heal' : pillar === 'enrich' ? (choice === 1 ? 'nima' : 'learning') : (['red-fort', 'taj-mahal', 'flood-relief', 'railway'] as const)[choice] ?? 'red-fort';
  const text = {
    heal: { eyebrow: getCMSCopy('copy.ServiceIllustration.heal-label', 'Heal • Care with compassion'), caption: getCMSCopy('copy.ServiceIllustration.heal-caption', 'A little care. A healthier tomorrow.'), description: getCMSCopy('copy.ServiceIllustration.heal-description', 'A hand-drawn community clinic: a doctor cares for a patient, while a second doctor attends a seated blood donor beside a collection bag.') },
    learning: { eyebrow: getCMSCopy('copy.ServiceIllustration.enrich-label', 'Enrich • Room to grow'), caption: getCMSCopy('copy.ServiceIllustration.enrich-caption', 'Every lesson opens a new possibility.'), description: getCMSCopy('copy.ServiceIllustration.enrich-description', 'A teacher stands beside the classroom at Sant Nirankari Public School while a bus brings pupils to school. The Nirankari Vocational Centre has rooms for arts, sewing, a library and coaching.') },
    nima: { eyebrow: getCMSCopy('copy.ServiceIllustration.nima-label', 'NIMA • Music, dance & painting'), caption: getCMSCopy('copy.ServiceIllustration.nima-caption', 'Where creativity finds its expression.'), description: getCMSCopy('copy.ServiceIllustration.nima-description', 'Illustrations inspired by the NIMA banner: a painter at an easel, a sitar player, a tabla player and a classical dancer.') },
    'red-fort': { eyebrow: getCMSCopy('copy.ServiceIllustration.fort-label', 'Empower • Red Fort, Delhi'), caption: getCMSCopy('copy.ServiceIllustration.fort-caption', 'Small acts of care. A shared tomorrow.'), description: getCMSCopy('copy.ServiceIllustration.fort-description', 'The Red Fort Lahori Gate, with its seven domes, flanking bastions and Indian flag. Volunteers sweep and care for the surrounding grounds.') },
    'taj-mahal': { eyebrow: getCMSCopy('copy.ServiceIllustration.taj-label', 'Empower • Taj Mahal, Agra'), caption: getCMSCopy('copy.ServiceIllustration.taj-caption', 'Caring for the places we share.'), description: getCMSCopy('copy.ServiceIllustration.taj-description', 'The Taj Mahal with its central onion dome, symmetrical arched facade and four minarets. Volunteers care for the surrounding grounds.') },
    railway: { eyebrow: getCMSCopy('copy.ServiceIllustration.railway-label', 'Empower • Bhodwal Majri'), caption: getCMSCopy('copy.ServiceIllustration.railway-caption', 'Every journey begins with care.'), description: getCMSCopy('copy.ServiceIllustration.railway-description', 'The SNCF Express passenger train approaches the viewer along the tracks and slows to a stop at Bhodwal Majri. Six SNCF saints independently sweep and collect litter across the left-hand platform throughout.') },
    'flood-relief': { eyebrow: getCMSCopy('copy.ServiceIllustration.flood-label', 'Empower • Flood Relief'), caption: getCMSCopy('copy.ServiceIllustration.flood-caption', 'Standing together when it matters most.'), description: getCMSCopy('copy.ServiceIllustration.flood-description', 'Volunteers pass essential supplies to a rescue boat carrying a family in life jackets, with flooded homes in the distance.') },
  }[scene];
  const choices = pillar === 'empower' ? [getCMSCopy('copy.ServiceIllustration.fort-button', 'Red Fort'), getCMSCopy('copy.ServiceIllustration.taj-button', 'Taj Mahal'), getCMSCopy('copy.ServiceIllustration.flood-button', 'Flood Relief'), getCMSCopy('copy.ServiceIllustration.railway-button', 'Bhodwal Majri')] : pillar === 'enrich' ? [getCMSCopy('copy.ServiceIllustration.learning-button', 'Learning'), getCMSCopy('copy.ServiceIllustration.nima-button', 'NIMA')] : [];
  const { root, arrived, compact, active } = useServiceScene();
  const { seconds, updateSeconds } = useIllustrationTiming();
  const timingId = useId();
  const [editingTiming, setEditingTiming] = useState(false);
  useEffect(() => {
    if (pillar !== 'empower' || !arrived || !active || editingTiming) return;
    const timer = window.setInterval(() => setChoice(current => (current + 1) % 4), seconds * 1000);
    return () => window.clearInterval(timer);
  }, [pillar, arrived, active, editingTiming, seconds, choice]);


  return <section ref={root} className={`empower-service-scene${home ? ' empower-service-scene--home' : ''}`}
    data-pillar={pillar} data-arrived={arrived} data-autoplay={pillar === 'empower'} data-scene={scene}
    style={pillar === 'empower' ? { '--scene-cycle': `${seconds}s` } as React.CSSProperties : undefined} aria-label={text.eyebrow}>
    <div className="service-sketch-intro">
      <span aria-hidden="true" />
      <p>{text.eyebrow}</p>
      <span aria-hidden="true" />
    </div>
    <svg key={scene} className="service-sketch" data-layout={scene === 'learning' ? (compact ? 'campus-stacked' : 'campus') : 'landscape'} viewBox={pillar === 'enrich' && scene === 'learning' ? (compact ? "0 0 600 800" : "0 150 1200 470") : (scene === 'railway' ? "0 0 1200 500" : "0 0 1200 410")} preserveAspectRatio="xMidYMid meet" role="img"
      aria-label={text.description}>
      {scene === 'heal' ? <HealDrawing /> : scene === 'learning' ? <EnrichDrawing compact={compact} /> : scene === 'nima' ? <NimaDrawing /> : scene === 'flood-relief' ? <FloodReliefDrawing /> : scene === 'railway' ? <RailwayCleanupDrawing /> : <>
      {scene === 'red-fort' ? <RedFortDrawing /> : <TajMahalDrawing />}
      <g className="service-sketch-landscape" style={{ '--sketch-delay': '.4s' } as React.CSSProperties}>
        <Ink d="M67 281Q150 275 222 279L316 279M885 278Q1004 272 1137 281M103 335Q216 329 330 334M839 344Q961 339 1092 345M361 368Q533 365 664 370M675 370Q762 367 842 372" />
        <Ink className="service-sketch-fine" d="M32 295L188 293M949 299L1168 296M194 352L256 351M901 361L968 360M481 260L538 259M659 260L722 262" />
        <g className="service-sketch-tree" style={{ transformOrigin: '1048px 275px' }}>
          <path className="service-sketch-wash" d="M1028 223Q982 227 989 189Q972 163 1000 142Q996 111 1028 108Q1055 83 1081 112Q1115 108 1118 145Q1146 160 1127 187Q1131 217 1094 222Z" fill="var(--sketch-leaf)" />
          <Ink d="M1028 223Q982 227 989 189Q972 163 1000 142Q996 111 1028 108Q1055 83 1081 112Q1115 108 1118 145Q1146 160 1127 187Q1131 217 1094 222M1039 278Q1048 230 1049 167M1060 278Q1056 220 1054 163M1047 223L1022 195M1055 211L1088 181M1037 278L1066 278" />
          <Ink className="service-sketch-fine" d="M998 173Q1003 159 1017 157M1066 131Q1089 127 1096 146M1091 206Q1105 205 1112 194" />
        </g>
        <DisasterReliefDrawing />
      </g>
      {/* Sweeping: relaxed clothing, bent elbow and a gentle broom gesture. */}
      <g className="service-sketch-person" style={{ '--sketch-delay': '.9s' } as React.CSSProperties}>
        <path className="service-sketch-wash" fill="var(--sketch-blue)" d="M416 251Q440 236 454 252L466 286 452 296 425 292Z" />
        <Ink d="M426 240Q414 234 418 220Q423 207 436 212Q448 217 443 230L437 243M419 220Q431 225 445 220M419 216Q417 207 429 206Q442 207 445 216M426 240L422 251M437 241L444 247M421 248Q410 250 410 264L415 293 449 299 459 284 451 255 442 247M425 248L431 257 441 247M433 259L436 284M445 260L451 261M421 299L416 322 417 352M436 300L438 323 452 347M417 352L411 357 429 357 430 352 432 325M452 347L450 353 465 357 470 352 461 347M424 318L432 308" />
        <g className="service-sketch-sweep">
          <Ink d="M416 262L432 280 453 286M414 271L429 289 451 292M452 286Q460 283 463 287L460 293 451 292M448 257L466 276 477 294M447 269L458 282 468 299M468 299Q470 307 476 304L482 300 477 294M451 274L490 337M456 272L494 335" />
          <path className="service-sketch-wash" fill="var(--sketch-stone)" d="M488 333L496 331 519 350Q504 359 486 359Z" />
          <Ink d="M488 333L496 331 519 350Q504 359 486 359ZM492 337L493 354M495 337L501 353M498 339L508 351M490 332L496 328" />
        </g>
        <Ink className="service-sketch-fine" d="M418 358Q441 361 471 359M416 275L418 283M430 225L431 230 435 230" />
      </g>
      {/* A second volunteer gathers the swept leaves in a reusable sack. */}
      <g className="service-sketch-person service-sketch-collector" style={{ '--sketch-delay': '1.1s' } as React.CSSProperties}>
        <path className="service-sketch-wash" fill="var(--sketch-rose)" d="M559 238L583 244 584 278 570 293 548 279Z" />
        <Ink d="M563 239Q550 229 557 218Q564 207 574 213Q585 220 579 234L573 242M556 220Q556 207 569 207Q581 211 583 222M561 237L556 245M574 239L580 244M557 242L548 252 544 278 564 293 582 280 584 250 577 242M560 249L568 258 577 249M552 282L547 315 536 341M568 292L571 314 579 339M536 341L530 347 546 348 550 340 559 317M579 339L576 347 592 349 596 346 588 340M557 318L563 306M550 256L536 278 524 303M557 265L545 282 532 307M524 303Q519 311 525 314L532 307M580 257L597 272 591 302M575 266L589 277 584 302M584 302Q581 310 587 311L591 302" />
        <path className="service-sketch-wash" fill="var(--sketch-leaf)" d="M517 309Q548 300 589 309L592 350Q559 362 522 351Z" />
        <Ink d="M517 309Q548 300 589 309L592 350Q559 362 522 351ZM520 314Q551 308 587 315M532 314L535 342M579 315L576 347M564 308L560 320" />
      </g>
      {/* Planting: the kneeling figure and sapling form the mobile focal point. */}
      <g className="service-sketch-person" style={{ '--sketch-delay': '1.3s' } as React.CSSProperties}>
        <path className="service-sketch-wash" fill="var(--sketch-blue)" d="M736 266L753 265 772 282 762 305 737 304 725 288Z" />
        <Ink d="M740 262Q728 257 732 245Q738 234 749 240Q760 246 754 257L748 265M731 245Q732 234 744 233Q756 235 758 246M738 261L735 267M749 261L752 267M735 265Q725 273 724 287L735 306 759 308 772 288 753 267M739 270L744 278 752 268M739 307L718 321 706 344 719 350 740 330 768 330 779 344M759 308L777 315Q788 326 783 342L779 348 754 348M706 344L698 349 708 355 723 351M750 348L749 354 781 355 785 349" />
        <g className="service-sketch-planting">
          <Ink d="M728 278L710 296 689 313M734 286L717 304 694 319M689 313Q682 314 684 319L694 321 698 317M763 282L744 300 708 316M765 292L748 309 712 323M708 316Q700 315 700 320L710 326 716 321" />
        </g>
        <Ink d="M660 345Q681 335 703 342M655 351Q681 354 710 348M727 357L786 358M789 326L807 348M802 345L794 352 800 359 814 351Z" />
        <g className="service-sketch-sapling">
          <path className="service-sketch-wash" fill="var(--sketch-leaf)" d="M682 307Q660 309 656 291Q676 289 682 307M683 293Q684 271 702 271Q705 290 683 293M682 321Q689 303 707 310Q702 326 682 321" />
          <Ink d="M681 344Q685 317 682 286M682 307Q660 309 656 291Q676 289 682 307M683 293Q684 271 702 271Q705 290 683 293M682 321Q689 303 707 310Q702 326 682 321" />
        </g>
      </g>
      <g className="service-sketch-person service-sketch-watering" style={{ '--sketch-delay': '1.5s' } as React.CSSProperties}>
        <path className="service-sketch-wash" fill="var(--sketch-stone)" d="M930 223Q947 213 961 228L966 263 935 267Z" />
        <Ink d="M940 220Q928 215 933 202Q939 191 950 197Q960 203 954 215L948 222M933 202Q932 191 945 190Q957 193 959 203M938 221L932 229 928 257 937 271 966 265 963 230 951 220M942 270L938 292 940 325M956 269L957 294 968 322M940 325L933 330 948 332 951 326 950 296M968 322L964 329 981 333 985 329 977 323M934 235L922 254 900 265M940 244L929 261 905 272M900 265Q894 266 897 273L906 272M960 237L967 252 950 268M955 246L958 252 946 264" />
        <g className="service-sketch-can">
          <path className="service-sketch-wash" fill="var(--sketch-blue)" d="M894 271L925 279 920 304 889 295Z" />
          <Ink d="M894 271L925 279 920 304 889 295ZM899 272Q901 251 918 260L920 277M893 282L877 276 868 288 872 292 884 284 891 290M925 283Q944 282 938 294L922 297M864 285L874 293" />
          <path className="service-sketch-water" d="M866 295L858 310M870 298L865 317M862 295L852 306" />
        </g>
        <Ink d="M837 330Q853 326 871 332M851 330L853 316M852 322Q841 322 839 312Q850 310 852 322M853 320Q855 308 866 312Q864 322 853 320" />
      </g>
      <g className="service-sketch-details" style={{ '--sketch-delay': '1.8s' } as React.CSSProperties}>
        <Ink d="M495 365Q503 359 508 364Q503 370 495 365M478 364L471 367M641 356L647 353M810 372L826 373M309 328Q303 314 309 312Q315 314 309 328M315 330L321 321" />
        <g className="service-sketch-birds"><Ink d="M725 74Q733 66 741 73Q747 66 754 71M778 89Q784 83 790 89Q795 83 801 88" /></g>
        <Ink className="service-sketch-fine" d="M91 363L97 354 100 364M101 364L108 359M1112 339L1119 327 1124 339M1125 339L1132 332" />
      </g>
      </>}
    </svg>
    {pillar === 'heal' && <AmbulancePass />}
    <p className="service-sketch-caption">{text.caption}</p>
    {choices.length > 0 && <div className="service-sketch-choices" role="group" aria-label={getCMSCopy('copy.ServiceIllustration.choose-scene', 'Choose an illustration')}>
      {choices.map((label, index) => <button key={label} type="button" aria-pressed={choice === index} onClick={() => setChoice(index)}>{label}</button>)}
    </div>}
    {pillar === 'empower' && localIllustrationSettings && <details className="illustration-dev-settings">
      <summary>Illustration timing <span>Dev only</span></summary>
      <label htmlFor={timingId}>Change scene every
        <span><input id={timingId} aria-label="Illustration interval in seconds" onFocus={() => setEditingTiming(true)} onBlur={() => setEditingTiming(false)} type="number" min="1" max="60" step=".5" value={seconds}
          onChange={event => updateSeconds(Number(event.target.value))} /> seconds</span>
      </label>
      <button type="button" onClick={() => updateSeconds(DEFAULT_ILLUSTRATION_SECONDS)}>Reset to 4 seconds</button>
    </details>}
  </section>;
}
