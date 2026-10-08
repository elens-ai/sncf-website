import React, { useId } from 'react';
import { getCMSCopy } from '../cms/runtime';
import { SchoolBusDrawing } from './SchoolBusDrawing';
import { SchoolTeacherDrawing } from './SchoolTeacherDrawing';

export const Ink: React.FC<{ d: string; className?: string }> = ({ d, className = '' }) =>
  <path className={`service-sketch-ink ${className}`} pathLength="1" d={d} />;

/** Architectural outlines stay still: only the volunteers and natural details move. */
export function RedFortDrawing() {
  return <><g className="service-sketch-building" style={{ '--sketch-delay': '.1s' } as React.CSSProperties}>
    <path className="service-sketch-wash" fill="var(--sketch-rose)" d="M302 245V151L328 138H449L470 155H730L751 138H872L898 151V245Z" />
    <Ink d="M160 246H302V151L328 138H449L470 153V246M730 246V153L751 138H872L898 151V246H1040M302 165L328 157H449L470 168M730 168L751 157H872L898 165M302 173L328 165H449L470 176M730 176L751 165H872L898 173M302 241L328 249H449L470 241H730L751 249H872L898 241M328 165V249M449 165V249M751 165V249M872 165V249" />
    {[386, 814].map(x => <g key={x}>
      <Ink d={`M${x-44} 134V93H${x+44}V134M${x-50} 93H${x+50}L${x+45} 88H${x-45}ZM${x-36} 87V76Q${x-37} 54 ${x-15} 45Q${x-4} 41 ${x} 34Q${x+4} 41 ${x+15} 45Q${x+37} 54 ${x+36} 76V87M${x-34} 76H${x+34}M${x} 34V26M${x-27} 134V107Q${x-20} 91 ${x-12} 107V134M${x-5} 134V105Q${x+3} 91 ${x+11} 105V134M${x+18} 134V107Q${x+27} 91 ${x+34} 107V134`} />
      {[-48,-24,0,24,48].map(dx => <Ink key={dx} d={`M${x+dx-10} 151V139L${x+dx-6} 136Q${x+dx} 123 ${x+dx+6} 136L${x+dx+10} 139V151`} />)}
      {[-37,0,37].map(dx => <Ink key={dx} d={`M${x+dx-12} 237V199Q${x+dx-12} 187 ${x+dx} 180Q${x+dx+12} 187 ${x+dx+12} 199V237M${x+dx-8} 230V202Q${x+dx-8} 193 ${x+dx} 189Q${x+dx+8} 193 ${x+dx+8} 202V230`} />)}
    </g>)}
    {[489,711].map(x => <Ink key={x} d={`M${x-7} 161V56L${x-11} 50V44H${x+11}V50L${x+7} 56V161M${x-12} 45H${x+12}M${x-8} 42V32H${x+8}V42M${x-11} 31Q${x-10} 21 ${x} 18Q${x+10} 21 ${x+11} 31ZM${x} 18V12M${x-3} 34V42M${x+3} 34V42M${x-7} 68H${x+7}M${x-7} 72H${x+7}`} />)}
    <Ink d="M500 99H700M500 104H700M500 134H700M500 139H700M500 164H700M471 170H729M472 177H728M523 189H677L689 194H511ZM528 195V239M671 195V239M559 239V211H641V239M549 245H650L666 257H533Z" />
    {[516,544,572,600,628,656,684].map(x => <g key={x}>
      <Ink d={`M${x-11} 98V91Q${x-15} 80 ${x-5} 73L${x} 67L${x+5} 73Q${x+15} 80 ${x+11} 91V98M${x} 67V63M${x-12} 132V115Q${x-10} 109 ${x-6} 110Q${x} 101 ${x+6} 110Q${x+10} 109 ${x+12} 115V132M${x-11} 163V151Q${x-10} 145 ${x-5} 145Q${x} 139 ${x+5} 145Q${x+10} 145 ${x+11} 151V163`} />
    </g>)}
    <Ink className="service-sketch-fine" d="M174 253H518M683 253H1027M172 261H1026M315 179H454M747 179H882M510 181H691" />
  </g>
    <g aria-label="Indian national flag" className="service-sketch-indian-flag">
      <path d="M600 65V5" stroke="var(--sketch-ink)" opacity=".7" />
      <path d="M601 8C615 14 629 2 643 8V17.333C629 11.333 615 23.333 601 17.333Z" fill="#ff9933" stroke="none" />
      <path d="M601 17.333C615 23.333 629 11.333 643 17.333V26.667C629 20.667 615 32.667 601 26.667Z" fill="#fff" stroke="none" />
      <path d="M601 26.667C615 32.667 629 20.667 643 26.667V36C629 30 615 42 601 36Z" fill="#138808" stroke="none" />
      <circle cx="622" cy="22" r="3.7" fill="none" stroke="#000080" strokeWidth=".55" />
      <circle cx="622" cy="22" r=".65" fill="#000080" stroke="none" />
      {Array.from({ length: 24 }, (_, i) => {
        const angle = i * Math.PI / 12;
        return <path key={i} d={`M622 22L${622 + Math.cos(angle) * 3.7} ${22 + Math.sin(angle) * 3.7}`} stroke="#000080" strokeWidth=".25" />;
      })}
    </g>
  </>;
}

export function TajMahalDrawing() {
  return <g className="service-sketch-building" style={{ '--sketch-delay': '.1s' } as React.CSSProperties}>
    <path className="service-sketch-wash" fill="var(--sketch-stone)" d="M463 246V158H538V117Q514 78 563 49Q591 36 600 23Q609 36 637 49Q686 78 662 117V158H737V246Z" />
    <Ink d="M323 247H877V259H323ZM455 247V158L476 145H536V130H664V145H724L745 158V247M476 145V247M724 145V247M536 132H664M536 139H664M536 246V147H664V246M543 245V154H657V245" />
    {/* Onion dome, cylindrical drum and lotus finial, kept in their real proportions. */}
    <Ink d="M543 129V114Q516 92 538 66Q550 50 570 42Q590 33 600 23Q610 33 630 42Q650 50 662 66Q684 92 657 114V129M543 114Q600 123 657 114M543 119Q600 128 657 119M600 23V8M596 17H604M597 8Q600 3 603 8M592 29Q600 31 608 29" />
    <Ink d="M555 246V199Q555 180 600 161Q645 180 645 199V246M563 246V201Q563 186 600 170Q637 186 637 201V246M583 246V222Q583 211 600 201Q617 211 617 222V246M588 242V224Q588 217 600 210Q612 217 612 224V242" />
    {[506,694].map(x => <g key={x}>
      <Ink d={`M${x-24} 144V120H${x+24}V144M${x-28} 120H${x+28}M${x-22} 117Q${x-29} 101 ${x-9} 91L${x} 83L${x+9} 91Q${x+29} 101 ${x+22} 117ZM${x} 83V77M${x-17} 143V132Q${x-10} 119 ${x-3} 132V143M${x+3} 143V132Q${x+10} 119 ${x+17} 132V143M${x-19} 194V177Q${x-19} 168 ${x} 158Q${x+19} 168 ${x+19} 177V194ZM${x-19} 239V218Q${x-19} 210 ${x} 199Q${x+19} 210 ${x+19} 218V239ZM${x-24} 149H${x+24}M${x-24} 197H${x+24}`} />
    </g>)}
    {/* Four distinct minarets: the rear pair is smaller in perspective. */}
    {[{x:353,y:55,w:10},{x:409,y:100,w:7},{x:791,y:100,w:7},{x:847,y:55,w:10}].map(({x,y,w}) => <g key={x}>
      <Ink d={`M${x-w-4} 247V240H${x-w}L${x-w+3} ${y+31}H${x+w-3}L${x+w} 240H${x+w+4}V247M${x-w-2} ${y+30}H${x+w+2}M${x-w-2} ${y+26}H${x+w+2}M${x-w} ${y+23}V${y+10}H${x+w}V${y+23}M${x-w-4} ${y+9}H${x+w+4}M${x-w} ${y+7}Q${x-w-2} ${y-2} ${x} ${y-6}Q${x+w+2} ${y-2} ${x+w} ${y+7}ZM${x} ${y-6}V${y-12}M${x-3} ${y+12}V${y+22}M${x+3} ${y+12}V${y+22}`} />
      {[.36,.7].map(t => {const yy=y+(240-y)*t; return <Ink key={t} d={`M${x-w-3} ${yy}H${x+w+3}V${yy+4}H${x-w-3}Z`} />;})}
    </g>)}
    {[461,530,670,739].map(x => <Ink key={x} d={`M${x-2} 159V135L${x-4} 132L${x} 127L${x+4} 132L${x+2} 135V159M${x} 127V120`} />)}
    <Ink className="service-sketch-fine" d="M336 254H863M487 154V244M524 154V244M676 154V244M713 154V244M569 194V244M631 194V244M550 143H651M568 262L537 279M633 262L664 279" />
  </g>;
}

export function FloodReliefDrawing() {
  return <>
    <g className="service-sketch-building">
      <Ink d="M269 221V140L342 91 415 140V232M255 146L342 84 429 146M304 223V164H338V223M356 178V157H386V178ZM362 157V178M356 167H386M862 232V156L917 118 974 155V222M851 161L917 110 985 160M884 226V183H913V229M934 185V170H954V185" />
      <Ink className="service-sketch-fine" d="M279 210H300M347 203H408M875 210H903M392 131V98H408V142M911 133H925" />
    </g>
    <g className="service-sketch-flood-water">
      <Ink d="M150 238Q180 229 210 238T270 238T330 238T390 238M821 246Q852 236 883 246T945 246T1007 246M159 304Q190 295 221 304T283 304T345 304M815 328Q846 319 877 328T939 328T1001 328M228 361Q259 353 290 361T352 361M542 371Q573 363 604 371T666 371T728 371" />
      <Ink className="service-sketch-fine" d="M264 268H368M837 281H955M187 335H281M927 355H1041M515 387H650" />
    </g>
    {/* Rescue boat carries a family; a volunteer passes a box from the dry bank. */}
    <g className="service-sketch-boat">
      <path className="service-sketch-wash" fill="var(--sketch-blue)" d="M361 283Q550 311 740 283L710 324Q543 347 390 320Z" />
      <Ink d="M361 283Q550 311 740 283L710 324Q543 347 390 320ZM375 295Q550 323 728 296M415 328Q549 347 690 332" />
      {/* Seated adult and child, with life jackets. */}
      <Ink d="M459 222Q445 217 448 200Q452 187 467 191Q480 197 475 212L469 223M448 199Q447 186 461 185Q477 186 480 202M453 222L440 235 435 277 477 286 489 269 482 235 470 223M459 225V269M447 235L444 264H455V231M463 231V269H478L476 235M441 246L424 264 408 269M448 254L430 272 410 278M408 269Q400 269 400 275L410 278M441 277L464 281 466 296M478 279L491 295" />
      <path className="service-sketch-wash" fill="var(--sketch-stone)" d="M448 232L455 228V268H442ZM464 229L476 235 480 270H464Z" />
      <Ink d="M520 253Q510 249 511 238Q513 229 524 231Q534 234 532 244L526 253M516 252L507 263 503 292M526 252L537 263 538 295M514 263V285M522 260V286M508 265L499 275 489 273M532 267L546 279M504 291L518 298M531 292L540 299" />
      {/* Volunteer in a life jacket, receiving supplies. */}
      <Ink d="M644 216Q631 210 635 195Q640 182 653 186Q665 192 660 206L654 216M635 194Q633 182 647 179Q663 181 665 195M641 216L627 230 624 273 665 282 679 266 667 229 656 216M644 224V266M632 229L629 260H640V225M649 224V267H666L662 232M633 276L630 295M656 280L666 296" />
      <path className="service-sketch-wash" fill="var(--sketch-rose)" d="M632 229L640 225V262H628ZM649 224L662 232 666 267H649Z" />
      <g className="service-sketch-relief-hands">
        <Ink d="M663 232L682 245 706 239M660 242L680 253 708 247M704 239Q712 232 718 238L717 245 708 247M632 239L653 253 691 258M631 248L652 262 693 266" />
      </g>
    </g>
    {/* Volunteer on the bank with essential supplies. */}
    <Ink d="M786 207Q773 202 778 186Q782 175 796 179Q807 185 802 198L796 209M778 186Q777 176 789 173Q805 175 807 188M783 209L771 223 768 260 799 269 811 251 806 222 797 210M779 218L789 230 799 219M780 268L773 300 770 340M793 269L796 298 811 336M770 340L762 346H779L784 339 785 306M811 336L807 344 824 348 829 343 820 337M773 231L752 247 733 243M778 240L757 257 735 252M803 233L786 254 746 263M805 244L790 263 749 271" />
    <path className="service-sketch-wash" fill="var(--sketch-stone)" d="M707 231L741 234V263L707 261Z" />
    <Ink d="M707 231L741 234V263L707 261ZM718 232V244L728 245V233M715 254L729 255M821 309H866V347H821ZM833 309V321H847V309M871 320H909V347H871ZM884 320V330H893V320M752 351Q840 356 922 350M821 303H854" />
  </>;
}

export function HealDrawing() {
  return <>
    {/* Three facilities share a ground line; the glass wings follow the reference. */}
    <g className="service-sketch-health-city" transform="translate(-5 -20) scale(1.6)" style={{ '--sketch-delay': '.2s' } as React.CSSProperties}>
      <path className="service-sketch-wash" fill="var(--sketch-blue)" d="M42 137L154 124V205L42 218ZM53 88L150 73V125L53 138Z" />
      <Ink d="M37 140L158 126 214 144V218H37ZM42 145L154 132V213H42ZM154 132L209 148V213H154M49 138V90L150 73 172 81V131M45 91L151 71 176 80M54 93L148 78V125L54 137ZM154 75V126M172 135V105L201 99 221 105M174 108L200 102V140M205 102V142M169 106L201 97 224 104M37 218H218" />
      {[64,76,88,100,112,124,136].map(x => <Ink className="service-sketch-city-detail" key={x} d={`M${x} ${93-(x-54)*.16}V${135-(x-54)*.13}M${x} ${145-(x-42)*.12}V212`} />)}
      {[103,114,125].map(y => <Ink className="service-sketch-city-detail" key={y} d={`M54 ${y}L148 ${y-16}`} />)}
      {[157,173,189,205].map(y => <Ink className="service-sketch-city-detail" key={y} d={`M42 ${y}L154 ${y-8} 209 ${y+6}`} />)}
      <Ink className="service-sketch-city-detail" d="M164 139V213M176 143V213M188 146V213M200 149V213M179 109V139M188 106V141M196 104V142M174 117L201 111M174 128L201 123M92 213V190H110V213" />
      <rect data-health-city-exit x="92" y="190" width="18" height="23" fill="none" stroke="none" />
      {/* A pair of palms recalls the landscaped frontage in the reference. */}
      <Ink d="M52 225L55 184M54 192Q42 181 32 190M54 192Q46 173 36 176M54 192Q60 175 72 180M54 192Q65 183 76 192M194 225L191 183M191 191Q177 181 169 190M191 191Q178 172 170 179M191 191Q200 174 210 181M191 191Q201 182 214 194M31 228Q123 224 222 229" />
      <Ink d="M36 35H222V65H36ZM54 65V87M202 65V98" />
      <text className="service-sketch-city-name" x="129" y="48" textAnchor="middle">{getCMSCopy('copy.ServiceSceneArtwork.health-city-brand', 'Sant Nirankari')}</text>
      <text className="service-sketch-city-name" x="129" y="59" textAnchor="middle">{getCMSCopy('copy.ServiceSceneArtwork.health-city-name', 'Health City')}</text>
    </g>
    <g transform="translate(210 70) scale(.75)">
    <g className="service-sketch-clinic-sign">
      <Ink d="M410 -45H790V12H410ZM432 12V81M768 12V81" />
      <text className="service-sketch-school-name" x="600" y="-10" textAnchor="middle">{getCMSCopy('copy.ServiceSceneArtwork.health-centre-name', 'Sant Nirankari Health Centre')}</text>
    </g>
    <g className="service-sketch-building">
      <Ink d="M250 287V109H950V288M235 109L272 81H928L965 109ZM270 111V275M930 111V275M287 272H913M300 125H487V241H300ZM707 125H899V241H707ZM518 272V122H676V272M554 128H640M550 140H644M311 141H475M720 141H886" />
      <Ink d="M591 43H605V57H620V71H605V85H591V71H577V57H591ZM582 163Q598 149 612 163M582 180H618M582 195H618" />
      <Ink className="service-sketch-fine" d="M299 257H477M715 257H899M306 145L340 126M715 145L748 126M892 235L865 235M901 87H912M268 300H919" />
    </g>
    {/* Doctor listens to a seated patient. */}
    <g style={{ '--sketch-delay': '.7s' } as React.CSSProperties}>
      <path className="service-sketch-wash" fill="var(--sketch-blue)" d="M451 209L478 214 490 274 447 285 435 267Z" />
      <Ink d="M454 208Q443 202 446 189Q450 176 463 180Q477 185 472 198L465 210M446 187Q445 177 459 174Q475 177 477 188M450 210L439 220 433 258 443 283 485 276 486 227 470 211M452 215L461 228 470 216M455 229L450 260M464 230L473 256M446 282L442 315 439 346M470 280L473 314 486 343M439 346L433 353H451L454 345 456 318M486 343L481 351 499 355 505 350 494 342M440 232L427 254 437 269M447 239L438 254 446 264M444 264Q452 263 453 271L444 275 437 269" />
      <g className="service-sketch-care-hand">
        <Ink d="M480 227L500 244 533 239M481 238L499 253 534 247M533 239Q541 234 546 240L542 247 534 247" />
      </g>
      <Ink d="M448 217Q440 230 449 240Q462 249 471 236L468 218M458 242Q466 269 493 265Q516 261 523 245" />
      <circle cx="527" cy="244" r="5" />
      <Ink d="M544 219Q531 215 533 201Q538 189 550 193Q562 198 557 211L551 221M533 199Q531 190 544 187Q560 189 562 201M541 219L529 230 527 266 555 279 575 271 570 237 554 223M536 232L545 242 555 232M532 247L515 255 498 247M538 254L517 264 496 256M496 247Q488 244 487 250L496 256M555 278L582 279 586 322 601 342M546 281L568 289 570 327 580 348M601 342L595 348 611 352 616 347 608 340M580 348L575 354H593L597 349M518 278H579V288H518ZM523 288V352M574 290V347M574 240V278" />
    </g>
    {/* Reclining blood donor and clinician, composed from the supplied reference. */}
    <g style={{ '--sketch-delay': '1s' } as React.CSSProperties}>
      {/* Padded reclining chair, elevated leg support and a pedestal base. */}
      <path className="service-sketch-wash" fill="var(--sketch-rose)" d="M686 198Q699 189 705 201L730 270 768 281 840 307Q863 314 860 328Q854 337 840 333L768 310 718 294Z" />
      <Ink d="M686 198Q699 189 705 201L730 270 768 281 840 307Q863 314 860 328Q854 337 840 333L768 310 718 294ZM691 203L721 284 772 300 850 326M726 307L758 319H786M759 318V343H784V318M746 348H797V355H746ZM741 361H804M706 259L742 275 781 271M710 264L742 280 782 276M732 278L726 294M776 276V300" />
      {/* Donor: relaxed shoulders, bent elbow, shorts and supported lower legs. */}
      <path className="service-sketch-wash" fill="var(--sketch-leaf)" d="M711 217Q724 212 736 226L753 260 742 281 723 270 703 231Z" />
      <Ink d="M713 215Q702 212 703 199Q704 186 717 185Q731 185 735 198Q736 211 724 219M704 194Q700 188 708 181Q722 174 733 185L738 199M708 215L705 222Q699 228 704 242L717 262 726 277 745 282 755 264 745 238Q741 225 731 219M713 221Q721 232 732 222M711 236L724 252 747 258M706 243L721 261 746 266M746 258L756 257 762 261 758 266H746M730 278Q748 274 761 284L785 298 796 299M725 282Q739 294 758 297L781 307 791 307M786 298L825 306 842 308M782 307L817 317 835 319M842 308L852 307 861 315 858 322 849 321 835 319M832 314L840 316M747 285L742 292M723 200L728 201M715 205Q719 210 723 207" />
      <Ink d="M732 232L752 247 777 244M736 241L751 255 779 251M777 244L786 240 794 243 795 247 788 252 779 251" />
      {/* Clinician in scrubs, supporting the donor's extended arm. */}
      <path className="service-sketch-wash" fill="var(--sketch-blue)" d="M851 216Q868 211 880 221L893 266Q875 280 849 270L840 244Z" />
      <Ink d="M858 212Q845 208 845 194Q847 181 860 180Q874 182 877 195Q879 207 868 215M846 191Q841 182 851 175Q865 170 878 182L880 197M854 213L845 222Q838 232 841 246L849 270Q870 279 893 267L889 240Q887 223 873 216M856 220L865 229 874 220M851 233H861V241H851M853 274L849 309 848 344M870 276L873 310 879 344M848 344L839 352 858 354 862 347 864 313M879 344L875 352 893 355 901 350 888 343M852 260L884 260" />
      <g className="service-sketch-donation-hand">
        <Ink d="M845 231L823 243 797 240M848 242L825 252 798 248M797 240L789 238 784 243 789 249 798 248M883 237L869 254 812 259M888 246L875 264 811 268M812 259L803 256 799 261 804 268H811" />
      </g>
      {/* Collection bag and tubing: quiet clinical detail, with no graphic imagery. */}
      <Ink d="M933 352V195Q933 185 923 185H907V198M921 353H946M907 198V208M898 208H916L919 220V249Q907 256 895 249V220ZM902 212H912M900 227H914M900 233H914M896 219H918" />
      <path className="service-sketch-wash" fill="var(--sketch-rose)" d="M896 237H918V249Q907 255 896 249Z" />
      <path className="service-sketch-donation-tube" d="M784 247Q806 282 845 280Q885 279 896 245" />
      <Ink className="service-sketch-fine" d="M697 367H950M703 354H733M810 362H832" />
    </g>
    <g className="service-sketch-heartbeat"><Ink d="M336 184H362L371 170 382 202 392 183H455" /></g>
    </g>
    <g className="service-sketch-blood-bank" transform="translate(0 28)" style={{ '--sketch-delay': '.3s' } as React.CSSProperties}>
      <Ink d="M958 121L979 100H1170L1189 121ZM970 122V302H1177V122M979 291H1168M1050 291V188H1107V291M1078 188V291M1073 249V258M1085 249V258M986 145H1031V221H986ZM1124 145H1163V221H1124ZM986 183H1031M1124 183H1163M957 307H1190" />
      <Ink d="M977 8H1171V52H977ZM993 52V100M1155 52V100" />
      <text className="service-sketch-bank-name" x="1074" y="27" textAnchor="middle">{getCMSCopy('copy.ServiceSceneArtwork.blood-bank-brand', 'Sant Nirankari')}</text>
      <text className="service-sketch-bank-name" x="1074" y="44" textAnchor="middle">{getCMSCopy('copy.ServiceSceneArtwork.blood-bank-name', 'Blood Bank')}</text>
      <path className="service-sketch-wash" fill="var(--sketch-rose)" d="M1077 148Q1088 160 1088 166A11 11 0 0 1 1066 166Q1066 160 1077 148Z" />
      <Ink d="M1077 148Q1088 160 1088 166A11 11 0 0 1 1066 166Q1066 160 1077 148Z" />
      <Ink className="service-sketch-fine" d="M993 153L1004 153M1131 153H1142M1054 316H1105M979 273H1036M1119 273H1167" />
    </g>

  </>;
}

export function EnrichDrawing({ compact = false }: { compact?: boolean }) {
  const entrance = useId().replace(/:/g, '');
  return <g className="service-sketch-enrich">
    <g transform={compact ? "translate(-90 10) scale(.65)" : "translate(-75 240) scale(.64)"}>
    <defs><clipPath id={`${entrance}-entrance`}><path d="M0 160H373V600H0Z" /></clipPath></defs>
    <g className="service-sketch-school-sign">
      <Ink d="M410 32H790V70H410ZM432 70V76M768 70V76" />
      <text className="service-sketch-school-name" x="600" y="57" textAnchor="middle">{getCMSCopy('copy.ServiceSceneArtwork.school-name', 'Sant Nirankari Public School')}</text>
    </g>
    <g className="service-sketch-building">
      <Ink d="M247 294V97H955V294M234 96L269 76H932L967 96ZM273 112H413V256H273ZM283 131H402M283 171H402M283 214H402M429 113H739V232H429ZM439 123H729V222H439M768 113H928V257H768ZM778 153H918M778 196H918M778 237H918" />
      {[292,313,338,360,382,788,810,835,857,885].map(x => <Ink key={x} d={`M${x} 166V140H${x+12}V166ZM${x} 210V183H${x+10}V210M${x+3} 142V164`} />)}
      <Ink className="service-sketch-fine" d="M468 157L477 135 486 157M472 149H482M501 136V157H511Q519 152 510 147Q519 140 511 136ZM541 137Q522 135 522 147Q522 160 541 156M462 184H542M462 198H524M587 151L608 139 629 151 608 163ZM608 139V125M608 163V181M587 151V169L608 181 629 169V151M282 283H914" />
    </g>
    {/* The entrance is in front of the walking path. The right jamb masks the
        pupils as they cross the threshold into the classroom. */}
    <g className="service-sketch-classroom-door" transform="translate(100 0)">
      <path d="M243 185H275V310H243Z" fill="#24566a" stroke="none" />
      <Ink d="M236 311V178H281V311M240 183H277M244 189L254 193V305L244 309ZM259 244V253M232 312H286L291 320H228ZM224 326H295" />
    </g>
    <g clipPath={`url(#${entrance}-entrance)`}>
      {[{x:78,y:268,delay:'0s',color:'var(--sketch-rose)'},{x:78,y:268,delay:'.8s',color:'var(--sketch-blue)'}].map(({x,y,delay,color}) => <g key={delay} transform={`translate(${x} ${y})`}>
        <g className="service-sketch-schoolgirl" style={{ animationDelay: delay }}>
          <g transform="scale(.7)">
          {/* Ponytail, school uniform and a backpack worn on both shoulders. */}
          <path className="service-sketch-wash" fill={color} d="M5 -29Q-5 -34 -10 -23L-12 -2Q-8 7 5 1ZM12 -1H35L44 23H5Z" />
          <Ink d="M16 -37Q7 -42 11 -54Q15 -64 26 -61Q34 -58 34 -50L38 -46 33 -43Q32 -34 23 -33M11 -53Q7 -65 21 -68Q37 -66 37 -54M10 -58Q-1 -62 -2 -49L-5 -39Q7 -41 8 -51M17 -35L12 -28 9 -9 13 1H35L37 -15 30 -29 24 -33M16 -26L22 -20 28 -26M13 1L5 23Q24 29 44 23L35 1M18 5L14 23M27 5L28 25M34 7L39 23M9 -25Q-4 -32 -10 -23L-12 -2Q-6 7 5 1M-8 -17H3V-4H-8ZM3 -27Q12 -35 17 -25L13 -8M8 -28Q14 -36 23 -28M33 -17L44 -4 51 -8M30 -10L42 4 55 -2M51 -8Q57 -13 60 -8L55 -2" />
          <g className="service-sketch-girl-leg service-sketch-girl-leg--near"><Ink d="M14 26L13 41 7 58M22 27L21 43 16 60M7 58L2 62 3 65H19L22 61 16 60M9 52L18 54" /></g>
          <g className="service-sketch-girl-leg service-sketch-girl-leg--far"><Ink d="M31 27L34 43 44 56M39 26L42 42 50 54M44 56L43 62 57 63 62 59 50 54M40 51L48 48" /></g>
          </g>
        </g>
      </g>)}
    </g>
    <Ink d="M373 185V311M376 185V311" />
    {/* Two children share an open book at the desk. */}
    <g style={{ '--sketch-delay': '.8s' } as React.CSSProperties}>
      <Ink d="M403 244Q391 238 395 225Q400 214 412 218Q423 224 418 236L412 245M395 223Q393 212 407 211Q422 213 425 226M400 245L388 257 385 282 419 291 431 277 424 253 414 245M402 252L408 261 417 252M390 270L407 279 430 273M396 261L411 270 430 265M388 285L410 299 408 337M417 290L430 305 439 334M408 337L403 343H419L423 338M439 334L436 341 452 344 457 339M382 271V294H432M386 296V341M430 296V337" />
      <Ink d="M529 241Q516 236 520 222Q525 210 538 215Q549 221 544 233L538 244M520 220Q517 211 531 207Q546 209 550 222M527 244L514 258 513 282 545 290 558 274 550 254 540 245M529 252L535 261 544 253M518 262L497 272 480 267M524 271L502 281 480 276M519 287L536 303 531 336M545 289L558 306 568 333M531 336L524 343H542L546 337M568 333L563 341 580 344 585 339M559 269V291H513M554 294V337" />
      <path className="service-sketch-wash" fill="var(--sketch-blue)" d="M389 257L402 249 416 249 428 272 418 287 385 280ZM514 258L527 248 539 248 551 256 557 273 544 286 514 281Z" />
      <Ink d="M407 285H543V293H407ZM415 294V355M535 294V355M423 330H526M426 273Q445 264 462 273Q480 265 499 274L492 286Q477 280 461 286Q445 280 430 285ZM462 273L461 286" />
      <g className="service-sketch-page"><Ink d="M461 284Q469 270 488 265L493 275Q478 275 461 284M471 277L485 272" /></g>
      <Ink className="service-sketch-fine" d="M367 361H578M620 330H731M856 324L858 296M858 312Q842 310 841 298Q856 296 858 312M858 306Q862 289 878 291Q879 307 858 306M843 325H875L870 347H849ZM839 351H879" />
    </g>
    </g>
    <g transform={compact ? "translate(-230 375) scale(.7)" : "translate(355 138) scale(.7)"}><NVCCentreDrawing /></g>
    <SchoolBusDrawing compact={compact} />
    <SchoolTeacherDrawing compact={compact} />
  </g>;
}

/** NIMA: the supplied banner's painter, sitar, tabla and classical dancer motifs. */
export function NimaDrawing() {
  return <>
    <g className="service-sketch-building"><Ink d="M154 348H1047M172 358H1021M174 133Q352 99 524 125M684 125Q858 99 1020 134" /></g>
    {/* Painter with palette and easel. */}
    <g className="service-sketch-nima-painter" style={{ '--sketch-delay': '.3s' } as React.CSSProperties}>
      <path className="service-sketch-wash" fill="var(--sketch-rose)" d="M233 169L256 172 273 280 223 280Z" />
      <Ink d="M240 164Q227 155 231 141Q237 128 249 135Q260 141 256 154L250 166M231 139Q225 131 233 125Q247 117 259 128Q268 143 260 163M235 163L225 180 221 239 224 280H273L269 218 258 178 251 167M228 178L238 190 250 179M230 282L230 317 225 344M253 282L255 312 267 342M225 344L218 351H236L241 345M267 342L263 350 280 352 285 347M229 197L213 224 229 237M236 205L224 223 236 231M228 233Q219 231 215 240Q219 253 237 253Q251 250 253 240Q246 230 236 237M227 243L229 246" />
      <g className="service-sketch-paint-hand"><Ink d="M258 189L280 206 301 183M259 201L282 216 307 189M301 183L307 175 313 181 307 189M309 178L326 161" /></g>
      <Ink d="M294 258L322 136H382L354 258ZM303 248L327 147H372L349 248ZM325 133L319 117M311 260L295 346M345 260L360 345M306 298H350M312 212Q330 191 353 214M324 199Q338 169 357 191M330 225L348 226" />
    </g>
    {/* Sitar player, seated cross-legged. */}
    <g style={{ '--sketch-delay': '.6s' } as React.CSSProperties}>
      <path className="service-sketch-wash" fill="var(--sketch-stone)" d="M427 218L459 220 470 282 443 294 410 277Z" />
      <Ink d="M434 216Q420 210 425 195Q430 184 443 188Q456 194 450 208L444 220M425 193Q419 184 430 180Q442 172 455 185L456 204M429 218L415 232 407 272 429 291 466 281 469 243 450 222M431 226L439 237 449 226M418 285Q395 291 388 315Q408 334 440 325L471 309M458 284Q483 285 493 307L466 323 426 318M389 316L380 325Q400 341 434 332M480 320L512 324 516 331 489 334 466 328" />
      <Ink d="M444 283L520 173 530 180 456 290M519 171L529 158 540 164 532 179ZM528 156L532 151M530 171L539 174M515 189L527 197M505 205L516 212M496 219L506 226M486 234L496 241M453 277Q431 266 424 285Q421 307 442 313Q465 316 471 298Q474 282 453 277ZM448 282L442 306M436 282L450 307" />
      <g className="service-sketch-sitar-hand"><Ink d="M415 243L425 271 442 285M422 241L435 267 447 278M463 239L482 246 499 218M469 251L486 253 504 224" /></g>
    </g>
    {/* Tabla player: two separate drums and a light alternating hand gesture. */}
    <g style={{ '--sketch-delay': '.9s' } as React.CSSProperties}>
      <Ink d="M626 210Q612 204 617 189Q623 177 636 182Q648 188 642 202L636 213M617 187Q610 179 621 173Q637 169 649 181L649 197M622 211L609 224 599 266 619 283 655 276 663 249 649 224 638 214M625 219L632 232 643 221M608 279Q588 287 583 310L610 327 631 312M650 278Q675 282 684 305L659 325 640 312M591 324L615 333M663 329L681 319" />
      <path className="service-sketch-wash" fill="var(--sketch-blue)" d="M610 224L624 215 639 216 653 229 663 250 654 273 616 280 600 265Z" />
      <Ink d="M608 290Q629 280 649 291L645 328Q628 341 611 328ZM608 290Q628 302 649 291M616 291Q628 286 640 291Q628 298 616 291M657 295Q675 284 697 295L701 325Q681 343 661 328ZM657 295Q678 309 697 295M667 295Q677 289 687 296Q678 302 667 295M616 302L619 328M627 304V331M639 302L638 329M666 307L670 329M679 309L680 334M691 305L692 329" />
      <g className="service-sketch-tabla-hands"><Ink d="M610 240L608 266 624 287M619 243L618 264 632 282M649 239L655 266 678 286M641 246L648 273 674 293M624 287L631 291 637 286 632 282M678 286L685 290 682 296 674 293" /></g>
    </g>
    {/* Classical dancer: raised mudra, pleated costume and ghungroo at the ankles. */}
    <g style={{ '--sketch-delay': '1.2s' } as React.CSSProperties}>
      <path className="service-sketch-wash" fill="var(--sketch-leaf)" d="M840 174L862 177 876 228 896 273 876 300 850 264 829 301 808 281 827 230Z" />
      <Ink d="M843 169Q830 162 835 148Q840 136 853 140Q865 147 859 160L853 173M835 148Q826 142 832 134Q844 123 860 132Q874 143 868 155M837 169L826 182 820 210 832 232 867 232 876 211 866 184 856 175M842 176L850 186 860 177M832 231L822 257 804 283 826 306 850 267 874 302 898 279 877 250 868 232M835 242L850 267 864 242M828 248L820 279 827 294M838 253L831 285M861 253L875 289M869 246L887 277M826 307L835 326 826 344M875 305L868 328 882 344M826 344L813 347 811 354 830 352 842 331M882 344L879 352 897 355 903 350 891 344M830 321L839 324M868 325L878 321M828 329L837 332M873 332L882 329" />
      <g className="service-sketch-dance-hand"><Ink d="M863 185L893 165 901 129M869 196L902 177 911 132M901 129L897 119 900 103 904 102 905 117 910 100 914 101 912 119 919 108 922 110 916 130M903 127L914 131" /></g>
      <Ink d="M831 188L805 204 825 218 849 210M828 199L818 205 828 209 847 203M847 203L857 203 861 207 856 212 849 210M842 144L852 145M846 158L851 159M827 230H873M835 238H870M842 189L845 220" />
    </g>
    <g className="service-sketch-music-notes">
      <Ink d="M554 152V123L577 116V145M554 152Q542 145 541 156Q545 164 554 158ZM577 145Q565 140 564 150Q568 159 577 151ZM554 131L577 124M739 179V148Q754 153 751 164M739 179Q727 173 726 183Q729 192 739 185M929 94V71L948 65V88M929 94Q919 89 919 97Q922 105 929 99M948 88Q938 83 938 91Q941 99 948 93" />
    </g>
  </>;
}

/** Four equal rooms make the NVC programmes one coherent campus. */
export function NVCCentreDrawing() {
  return <g className="service-sketch-nvc-campus" style={{ '--sketch-delay': '.3s' } as React.CSSProperties}>
    <Ink d="M359 144L383 121H1138L1161 144ZM370 145V515H1150V145M379 506H1140M370 330H1150M760 153V506M384 153H1136M375 524H1147" />
    <Ink d="M530 55H989V107H530ZM549 107V121M970 107V121" />
    <text className="service-sketch-nvc-name" x="760" y="78" textAnchor="middle">{getCMSCopy('copy.ServiceSceneArtwork.nima-building-name', 'Nirankari Vocational Centre')}</text>
    <text className="service-sketch-nvc-subtitle" x="760" y="97" textAnchor="middle">{getCMSCopy('copy.ServiceSceneArtwork.nvc-subtitle', 'Learning • Skills • Creativity')}</text>
    <g className="service-sketch-nvc-room" aria-label="NIMA music, dance and painting">
      <text className="service-sketch-room-label" x="565" y="178" textAnchor="middle">{getCMSCopy('copy.ServiceSceneArtwork.nima-room', 'NIMA')}</text>
      <g transform="translate(310 177) scale(.42 .4)"><NimaDrawing /></g>
    </g>
    <g className="service-sketch-nvc-room" aria-label="Sewing Centre">
      <text className="service-sketch-room-label" x="955" y="178" textAnchor="middle">{getCMSCopy('copy.ServiceSceneArtwork.sewing-name', 'Sewing Centre')}</text>
      <g transform="translate(-680 -115) scale(1.5)">
      <Ink d="M1043 222Q1033 218 1037 209Q1041 201 1050 205Q1059 211 1054 219L1050 226M1037 208Q1033 200 1045 198Q1058 201 1061 212M1041 225L1033 234 1032 252 1053 258 1064 246 1055 229M1034 257L1050 265 1052 283M1054 258L1068 268 1073 283M1028 247V263H1064M1031 264V284M1069 251H1148V257H1069ZM1077 258V284M1140 258V284M1080 247V226H1100Q1107 226 1107 233V235H1121V244H1101V233H1089V247ZM1081 247H1129M1124 229V240M1091 225V218H1097V225M1130 241Q1140 242 1142 251L1147 275 1128 278 1122 256" />
      <g className="service-sketch-sewing-hands"><Ink d="M1039 236L1055 244 1080 240M1040 243L1058 251 1080 246" /></g>
      <g className="service-sketch-sewing-needle"><Ink d="M1123 239V247M1119 247H1127" /></g>
    </g>
    </g>
    <g className="service-sketch-nvc-room" aria-label="Library">
      <text className="service-sketch-room-label" x="565" y="359" textAnchor="middle">{getCMSCopy('copy.ServiceSceneArtwork.library', 'Library')}</text>
      <g transform="translate(-502 18) scale(1.3)">
    <Ink d="M728 295H803V367H728ZM732 318H799M732 342H799M733 362H798M733 299H744V315H733ZM748 298H758V315H748ZM763 300H774V315H763ZM779 298H790V315H779ZM733 324H745V339H733ZM751 323H760V339H751ZM766 325L775 322 781 337 772 340ZM785 323H794V339H785ZM734 347H745V359H734ZM750 347H762V359H750ZM767 347H779V359H767ZM785 347H795V359H785" />
    <Ink d="M824 329V352H852M828 353V372M851 353V372M845 371H855M864 371H875M825 372H914" />
    <Ink d="M839 321Q830 316 833 307Q837 299 846 302Q855 308 851 317L845 322M835 323L827 333 830 348 852 348 858 334 849 324M831 333L847 339 864 334M836 342L849 347 865 341M831 350L847 356 849 370M850 351L862 359 869 370M857 346H911V352H857ZM863 353V371M905 353V371M861 338Q874 331 884 336Q895 331 906 337L902 345Q892 341 883 345Q873 341 864 346ZM884 336L883 345" />
        <g className="service-sketch-library-page"><Ink d="M883 344Q893 328 908 331L908 339Q894 338 883 344" /></g>
      </g>
    </g>
    <g className="service-sketch-nvc-room" aria-label="Coaching">
      <text className="service-sketch-room-label" x="955" y="359" textAnchor="middle">{getCMSCopy('copy.ServiceSceneArtwork.coaching', 'Coaching')}</text>
      <g transform="translate(-477 -15) scale(1.35)">
    <Ink d="M946 296H1128V327H946ZM952 302H1025M952 310H1009M970 317H989M1052 302L1062 310 1052 318M1070 305H1084M1070 312H1084M1102 306Q1094 303 1095 296Q1098 289 1105 292Q1112 298 1107 304M1098 307L1091 316 1093 336H1114L1117 318 1108 307M1095 338L1093 365M1108 338L1116 365M1092 318L1083 313 1077 315M1112 318L1122 330M1089 366H1099M1110 366H1120" />
    {[975,1036].map(x=><g key={x}>
      <Ink d={`M${x} 343Q${x-8} 340 ${x-6} 333Q${x-2} 326 ${x+5} 330Q${x+12} 335 ${x+6} 342M${x-3} 344L${x-10} 353 ${x-8} 366H${x+13}L${x+15} 354 ${x+7} 344M${x-17} 359H${x+23}V364H${x-17}ZM${x-13} 365V376M${x+18} 365V376`} />
    </g>)}
        <g className="service-sketch-coaching-pointer"><Ink d="M1092 318L1074 306 1059 307M1094 324L1072 314 1058 312M1059 307L1049 298" /></g>
        <g className="service-sketch-learning-pencil"><Ink d="M978 351L985 357 999 355M999 355L1003 350" /></g>
      </g>
    </g>
  </g>;
}

export function DisasterReliefDrawing() {
  return <g className="service-sketch-disaster-relief" style={{ '--sketch-delay': '.6s' } as React.CSSProperties}>
    {/* A simple relief shelter with a packet distribution counter. */}
    <Ink d="M32 195L62 151H263L289 195ZM46 196V285M276 196V283M55 173H270M71 112H253V139H71ZM87 139V151M237 139V151" />
    <text className="service-sketch-room-label" x="162" y="130" textAnchor="middle">{getCMSCopy('copy.ServiceSceneArtwork.disaster-relief', 'Disaster Relief')}</text>
    <Ink className="service-sketch-fine" d="M55 207H105M259 205H270M26 351H294M38 358H256" />
    {/* Parent and child waiting together; the volunteer offers a packed meal. */}
    <Ink d="M116 240Q104 235 107 222Q112 212 123 216Q133 222 129 233L123 242M108 220Q106 211 117 208Q134 211 134 225M114 241L105 251 101 278 114 294 138 286 141 263 128 245M115 248L121 257 129 248M112 294L109 316 107 340M128 292L132 315 141 339M107 340L99 346H115L119 340M141 339L136 345 152 349 158 344M135 258L150 269 167 263M132 266L149 277 169 271M167 263L175 260 180 265 176 271 169 271M104 259L89 279M109 267L94 283" />
    <Ink d="M72 279Q62 273 65 263Q69 255 78 258Q88 264 84 272L78 281M70 280L62 290 60 311H87L91 293 81 282M66 313L63 337M79 314L83 337M62 337L58 343H71M82 337L91 342M63 292L52 307M88 290L96 281M95 280L91 274" />
    {/* Branded volunteer vest and an unmistakable handled meal packet. */}
    <path className="service-sketch-wash" fill="var(--sketch-blue)" d="M212 235L232 235 245 267 238 294 205 293 196 267Z" />
    <Ink d="M215 232Q204 227 207 214Q212 203 223 207Q236 213 231 225L225 235M207 213Q205 204 218 201Q232 203 236 216M214 234L204 243 195 271 205 295 238 294 246 270 237 245 228 235M212 242L220 252 229 243M218 254V284M203 252L207 285M237 254L232 286M208 296L205 318 202 341M228 297L231 318 241 339M202 341L196 348H212L216 341M241 339L237 346 254 350 261 345M229 273H237V281H229" />
    <text className="service-sketch-volunteer-label" x="226" y="263" textAnchor="middle">SNCF</text>
    <g className="service-sketch-relief-offer">
      <Ink d="M202 253L187 264 172 261M205 262L189 273 172 269M239 257L226 278 188 283M239 268L230 287 188 291" />
      <path className="service-sketch-wash" fill="var(--sketch-stone)" d="M165 254H188L192 280H162Z" />
      <Ink d="M165 254H188L192 280H162ZM170 254V249Q176 243 182 249V254M166 270H188M177 270V279" />
    </g>
    {/* Additional packed supplies wait under the shelter. */}
    <Ink d="M252 300H285V333H252ZM262 301V310H272V301M250 288H284V300H250ZM263 289V296M261 337H291M286 310H301V334H286M259 320H278" />
  </g>;
}
