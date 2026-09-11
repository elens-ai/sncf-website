# SNCF Content Studio

The existing site is connected to Payload CMS. Published changes reach open visitor tabs without rebuilding the frontend or resetting their scroll position. The bundled site remains available when the CMS is offline.

## Start locally

1. In the repository root, install the frontend dependencies with `npm ci`.
2. In `backend`, install the CMS dependencies with `npm ci`.
3. Copy `backend/.env.example` to `backend/.env` **only if the file does not already exist**. Set `PAYLOAD_SECRET` to a new random secret from `openssl rand -base64 32`. Keep this file private. SQLite (`DATABASE_URI=file:./cms-dev.db`) works locally without another service.
4. From the repository root, generate the source-content import with `node --import tsx scripts/generate-cms-seed.ts`.
5. In `backend`, run `npm run seed`, then `npm run dev`.
6. In the repository root, run `npm run dev`.
7. Open `http://localhost:3001/admin`. Payload's first-user screen creates your administrator account; the seed does not create accounts or passwords. The website is at `http://localhost:3000`.

Use the same hostname for the CMS and frontend (`localhost` for both, or `127.0.0.1` for both) so authenticated preview cookies work consistently.

The Vite development server proxies `/api` to port 3001. Set `CMS_PROXY_TARGET` if the local CMS runs elsewhere. The built frontend accepts a public `VITE_CMS_URL`, such as `https://cms.example.org`; otherwise it calls `/api` on its own origin. Never place a CMS secret or API key in a `VITE_` environment variable.

## What is managed

| Studio area | What changes on the website |
| --- | --- |
| Pillars | Hero and pavilion headings, descriptions, accents, summary statistics, highlights and supporting text. |
| Activities | All activity records and project records, reporting periods, headline measures, detailed statistics, descriptions and attached images. |
| Live statistics | Individual published measures with reporting periods and sources. Publication writes a statistics audit record. Activity/pillar metric edits synchronize their related measures. |
| Events | Annual observances and ongoing programmes, descriptions, links, confirmed venues and times. Annual dates continue to resolve to the next occurrence. |
| Partners | Organisation names, contributions and notes. Brand artwork and colours are in Site settings → Partner brands. New partners can use a logo or initials. |
| Awards | Verified honours, awarding bodies, dates and photo galleries. An empty award list remains an intentional placeholder, not invented honours. |
| Gallery items | Every reading-room gallery, activity plate and physical pavilion photograph, including captions, alt text, poster images and films. |
| Media | Images, videos, audio and GLB/glTF models, organised with folders, tags, alt text, credits, sources and an illustrative-media flag. |
| Content slots | Existing headings, prose, labels, button text, accessibility descriptions and registered links, searchable by component and current text. |
| Asset slots | Replace a specific component's source or a shared `/images/...`, `/video/...` or `/models/...` asset. |
| Component settings | Enable/disable sections and shared controls. Home sections have an order field. The linked hero/pavilion introduction moves together. |
| Site, navigation & branding | Global identity, logo, tagline, contact information, SEO, navigation menus and partner brands. |
| Pavilion materials, lighting & motion | Material colours, roughness, metalness and texture URLs; room palettes; lights; film windows and frosting; model files; camera motion; bounded render quality; planters, barriers, benches, frames, carpet and finale mosaic settings. |
| Pages | Page SEO and additional `/pages/:slug` pages using text, media, card grids and supported events/awards components. Existing bespoke page layouts use their content/component slots. |

The initial import is compiled from the existing source records and media registry. It does not invent statistics, awards or partnerships. Regenerating the JSON updates the import file; `npm run seed` creates missing entries and preserves already authored records.

## Edit and publish

1. Find the record, component, text slot or asset slot in the Studio.
2. Make the change and save a draft. Contributors can draft; editors and administrators can publish. Administrators manage accounts.
3. Use the preview link with `?cms-preview=true` on the website. A signed-in CMS session is required. Draft responses stay private, and the browser never saves them in its persistent content cache. Preview refreshes approximately every five seconds while the tab is visible.
4. Publish when ready. Public tabs check for updates approximately every 30 seconds, using conditional HTTP requests. New tabs request the current publication during startup.

The preview status badge tells you whether drafts are connected, sign-in is needed, or the last loaded content is being shown during a connection failure. A signed-out public tab cannot request unpublished records through the publication endpoint.

## Replace a photo, film, model or texture

Upload to **Media**, supply useful alt text and any attribution, then choose that upload in the target record or asset slot. Existing bundled files remain usable as source URLs. Supported uploads include JPEG, PNG, WebP, AVIF, GIF, MP4, WebM, MP3, M4A, Ogg, WAV and GLB/glTF; the upload limit is 150 MB. Prefer self-contained GLB models. Images receive thumbnail, card and full-size variants.

For a global replacement of a bundled image, use its path asset slot, for example `/images/pavilion/heal-1.jpg`. A component-specific asset slot takes precedence when an intentional local override exists. Pavilion window video/poster and model URLs can also be edited directly in Pavilion settings. Use a new filename when changing bytes so browser/CDN caching cannot retain an old file under the same URL.

Gallery group keys identify placement:

- `pavilion:heal`, `pavilion:enrich`, `pavilion:empower`, `pavilion:projects`: five camera-aligned frames in each room.
- `media:heal`, `media:project-amrit`, `media:who-we-are`, etc.: the corresponding page/subsection gallery.
- `plates:heal`, `plates:enrich`, etc.: activity plates.

Keep original stable keys when updating existing records. Their titles and media can change. A Live statistics key such as `activity:blood-donation:metric:units-collected` identifies the existing measure; edit its value, label and reporting period, not its key.

## Efficiency and layout boundaries

- A compact public publication is fetched once during startup, with a 1.2-second network deadline and validated cached/bundled fallback. Visitor rendering never waits indefinitely for the CMS.
- Unchanged content returns HTTP 304 using ETags. Hidden/offline tabs stop making useful requests, and repeated failures back off to five-minute intervals.
- Publications update data and React's external store together. Open activity records preserve their identity; publication does not remount the website, reset scroll or restart every animation.
- The pavilion only rebuilds its scene when scene configuration, models or media actually change. Ordinary copy and statistics updates do not rebuild it. Model replacements use source-aware caches and release unused GPU resources.
- The physical exhibition remains four rooms with five camera stops each. Missing or malformed required entries fall back to their bundled equivalents. Material and camera values are bounded so an accidental large setting does not create an unusable renderer.
- Page/section content and the exposed component/material controls are editable. Adding a completely new React component, an arbitrary 3D floor plan, custom shaders or new behaviour still requires a code change; the CMS does not execute uploaded code.

Statistics do not invent a real-time feed. They update when an authorised person or integration publishes verified figures. Integrations can use Payload's authenticated collection API with server-side credentials; no integration credentials belong in the browser.

## Production

Use HTTPS, a durable database and persistent media storage. PostgreSQL is supported through `DATABASE_URI`; use the backend migrations for production rather than development schema synchronization. Set a strong `PAYLOAD_SECRET`, public CMS/site URLs and the allowed frontend origins. The CMS service must be deployed as well as the static frontend; a frontend deployment alone cannot host Payload or its database.

Back up the database and media directory together before migrations or releases. Keep secret environment files, local SQLite databases and uploads out of Git. Restrict editor/admin accounts to their intended roles. See `backend/README.md` and the repository's infrastructure configuration for deployment commands.

## Validation

Run from the repository root:

```sh
npm run lint
npm run build
node --import tsx --test src/cms/runtime.test.ts src/cms/pavilionDefaults.test.ts
```

The runtime checks cover malformed publications, unsafe URLs, fallback behaviour, live-stat updates, preserved dialog records, mutable content tables, event dates and the fixed pavilion camera layout. Backend checks cover publication access, role restrictions, statistics synchronization and caching.
