# Sant Nirankari Charitable Foundation — website

A single-page React site for the Sant Nirankari Charitable Foundation (SNCF).
One long scroll, seven screens, no router: a welcome splash hands off to a 3D
hero wheel, which hands its accent colour down through every screen beneath it.

Live source of the content: <https://nirankarifoundation.org>.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint       # tsc --noEmit  (this is the typecheck; there is no ESLint)
npm run build      # -> dist/
npm run preview
```

Docker, if you prefer:

```bash
./start.sh          # dev + hot reload -> :3000
./start.sh prod     # build + nginx    -> :8080
./start.sh stop | logs | shell | clean
```

`DEV_PORT` / `PROD_PORT` override the ports.

---

## Stack

| | |
|---|---|
| Framework | React 19 + TypeScript 5.8 |
| Build | Vite 6 |
| Styling | **Tailwind CSS v4, CSS-first** |
| Icons | `lucide-react` |
| Animation | `motion` (Framer Motion v12) — used only by the partnership screen; everything else is hand-written CSS |
| Deploy | Dockerfile (multi-stage) + `docker/nginx.conf` |

### The one thing to know about styling

**There is no `tailwind.config.js`, and there must not be one.** Tailwind v4
is configured from CSS. Theme values go in `@theme { … }` blocks inside
`src/index.css`; the plugin is wired in `vite.config.ts`.

`src/index.css` is ~5,000 lines and is the real weight of this project — most
screens paint nothing themselves and rely on it. It is organised as one shared
base followed by per-screen blocks appended in order, each fenced by a banner
comment. Screen blocks are *appended*, never interleaved, which is what makes
`git checkout <sha> -- src/index.css` a safe way to restore a single screen.

Fonts are loaded by one `<link>` in `index.html`: Cinzel, Dancing Script,
Sacramento, Plus Jakarta Sans, Outfit, Work Sans, Inter, Urbanist. Add to that
link rather than opening a second request. `Brittany Signature` is licensed and
not served by Google — `public/fonts/README.md` explains the fallback chain.

---

## Page order

`src/App.tsx` is the whole page. Sections in render order:

| # | Component | What it is |
|---|---|---|
| 0 | `WelcomeSplashScreen` | Splash; ends with a shared-element logo flight into the header |
| 1 | `Header` | Fixed header + `MainNav` mega menu, tinted by the active pillar |
| — | `SocialSidebar`, `SectionJumpButton` | Viewport fixtures — **root level on purpose**, see below |
| 2 | `HeroSection` | 3D pillar wheel (`HeroOrbitWheel`, `SncfLotus3D`). Owns the page's accent colour |
| 3 | `PillarsSection` | The rooms below the hero — scroll-pinned, 1,693 lines, the largest component |
| 4 | `EventsSection` | Upcoming observances + `EventsCalendarModal` |
| 5 | `AwardsSection` | Honours carousel (+ `AwardLightbox`) |
| 6 | `PartnershipSection` | Partners screen — video hero, floating navbar, logo marquee |
| 7 | `SiteFooter` | Closing band. Deliberately not a scroll-snap target |

Overlays live at the end of `App`: `PillarModal`, `DonateModal`,
`GalleryModal`, `SearchModal`, `DevotionalLightboxModal`, `InvitationCard`.

### One gradient for the whole page

`App` renders a single `.accent-canvas` layer, **absolute, not fixed**, so the
colour ramp spans the full document height and runs continuously from the hero
to the last screen. Individual sections paint no ground of their own — that is
why there is never a seam at a section boundary, and why a section that *does*
set its own background will visibly break the run.

### Why some things sit at root level

`SocialSidebar` and `SectionJumpButton` are `position: fixed` fixtures. Inside
a section they were captured by that section's stacking context (`relative
z-10`) and by its `transform` / `will-change` containing block — the social
icons ended up sliced off behind the footer. At root their z-index is real:
above sections and footer (z-10), below header and modals (z-50).

---

## Content lives in `src/data/`

Components render; they do not carry facts. Every figure, name and date is in
one of these, with its source stated in the file header.

| File | Holds | Source |
|---|---|---|
| `pillars.ts` | The four pillars — Heal, Enrich, Empower, Projects — with accent colours, stats, highlights | SNCF activity report, March 2026 |
| `activities.ts` | Every reported activity and its full data column set | Same report; `period` names the row |
| `events.ts` | `annual` (fixed calendar date, year computed) and `ongoing` observances | UN / WHO / Mission calendar |
| `partners.ts` | 12 partner organisations and what each collaboration delivered | `nirankarifoundation.org/our-partners/` |
| `navigation.ts` | Header nav and the Core Values mega menu | Mirrors the live site |
| `awards.ts` | **Empty on purpose** — see below | — |
| `pillarMedia.ts` | Per-pillar imagery | — |

### The content rule

**Do not invent names, conferring bodies, years, figures or citations for this
foundation.** It is a real organisation and a wrong claim is a real problem.

`AWARDS` ships as an empty array with its interface fully defined. The awards
screen renders correctly against it and says so in the UI. Fill it when real
photographs and confirmed `title / awardedBy / year` values arrive — not
before. `events.ts` follows the same discipline: venues and times are absent
because a guessed address is a person turning up to nothing.

---

## Assets

```
public/images/            programme photography, leader portraits, lotus mark
public/images/partners/   9 partner marks (3 partners publish no usable icon)
public/images/petals/     hero wheel petal art
public/video/             partnership.mp4 (2.7 MB, H.264, faststart)
public/fonts/             Brittany Signature (see its README)
tools/                    logo sources + build-logo-shapes.py
```

Two asset conventions that are load-bearing:

- **Write asset paths out in full.** Building a path from a prefix
  (`` `${P}/un.png` ``) leaves no literal string in the bundled JS, which
  breaks any tooling that inlines assets by finding those strings.
- `partnership.mp4` has had its `moov` atom relocated ahead of `mdat`
  (faststart), so playback begins on the first bytes instead of after a full
  2.7 MB download. Keep that property if you replace the file.

---

## Branches

| Branch | Role |
|---|---|
| `vansh` | Active development. Current work lands here |
| `dev`, `main` | Behind `vansh` |
| `claude/project-analysis-m1kp1v` | Agent working branch |

---

## Known state / cleanup

- **Orphaned components.** `PartnersSection.tsx` (the Media Wall step-and-repeat)
  and `PartnersHero.tsx` (the orbit visualisation) are two earlier builds of the
  partners screen. Both are complete and swap back into `App.tsx` on one import
  line; neither is currently imported. Delete them if you have settled on the
  video hero.
- **`@google/genai` is a dependency but unused** in `src/`. So are `express`,
  `dotenv` and `qrcode` in places — check before pruning.
- `README.md` is still the generated AI Studio scaffold text and describes a
  `GEMINI_API_KEY` step that this project does not use. This file supersedes it.
- No test suite. `npm run lint` is a typecheck only.
- The production bundle is ~590 KB of JS in one chunk; Vite warns about it.
  Code-splitting the modals would be the obvious first cut.
