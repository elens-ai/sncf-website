import React from 'react';
import { Ink } from './ServiceSceneArtwork';

export function CleanupVolunteers() {
  return <g transform="translate(90 0)">
    <text className="service-sketch-volunteer-label" x="436" y="277" textAnchor="middle">SNCF</text>
    <text className="service-sketch-volunteer-label" x="567" y="274" textAnchor="middle">SNCF</text>
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
  </g>;
}
