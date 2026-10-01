# SNCF Content Studio

The website is connected to a Payload CMS (the "Content Studio"). Published changes reach open visitor tabs without rebuilding the frontend or resetting their scroll position. The bundled site remains available when the CMS is offline.

## Start locally

1. In the repository root, install the frontend dependencies with `npm ci`.
2. In `backend`, install the CMS dependencies with `npm ci`.
3. Copy `backend/.env.example` to `backend/.env` **only if the file does not already exist**. Set `PAYLOAD_SECRET` to a new random secret from `openssl rand -base64 32`. Keep this file private. SQLite (`DATABASE_URI=file:./cms-dev.db`) works locally without another service.
4. From the repository root, generate the content import with `npm run cms:seed`.
5. In `backend`, run `npm run seed`, then `npm run dev`.
6. In the repository root, run `npm run dev`.
7. Open `http://localhost:3001/admin`. Payload's first-user screen creates your administrator account; the seed does not create accounts or passwords. The website is at `http://localhost:3000`.

Use the same hostname for the CMS and frontend (`localhost` for both, or `127.0.0.1` for both) so authenticated preview cookies work consistently.

The Vite development server proxies `/api` to port 3001. Set `CMS_PROXY_TARGET` if the local CMS runs elsewhere. The built frontend accepts a public `VITE_CMS_URL`, such as `https://cms.example.org`; otherwise it calls `/api` on its own origin. Never place a CMS secret or API key in a `VITE_` environment variable.

## Where things are

The studio's start page lists the common tasks. The sidebar is grouped the same way:

| Sidebar | What changes on the website |
| --- | --- |
| **Content → Pillars** | Heal, Enrich, Empower and Projects: names, headlines, descriptions, emblem captions (“Care, in every leaf.”), colours, summary figures and highlights. |
| **Content → Programmes & projects** | Every programme and project. *Details*: title, pillar, reporting period, description. *Figures*: the headline figure and every reported figure. *On the website*: the tile symbol, the short name used in menus, the hover photos that blend in behind the home page section (with an optional spot kept clear, e.g. people at a photo's centre), and the faint photo behind the Core Values card. |
| **Content → Events** | Annual observances and ongoing programmes, descriptions, links, venues and times. Annual dates resolve to the next occurrence. |
| **Content → Partners** | Organisations, what was done together, and their logo, short name, initials and brand colour. |
| **Content → Awards** | Verified honours, awarding bodies, years and photos. An empty list is an intentional placeholder, never invented honours. |
| **Website text & images → Website text** | Every heading, sentence, button and label. Filter by **Page**, or search for the words you see on the website. |
| **Website text & images → Website images** | Logos, portraits and artwork built into the page design, with thumbnails. |
| **Website text & images → Galleries** | The five *Pillar photos* of each pillar (they fill the home page tiles, the photo emblem and the Core Values collage) and the photo/film galleries on Projects, Who We Are and Our Guiding Force. |
| **Website text & images → Media library** | Every upload: photos, films, sound and 3D models, with alt text, credits, folders and tags. |
| **Site setup → Site settings** | Organisation name, logo and tagline; contact details; the main menu; footer columns; social links; default search & sharing text and image. |
| **Site setup → Page titles & SEO** | The title and description search engines show for each page. Extra pages at `/pages/<address>` can be built from sections. |
| **Site setup → Sections on/off** | Show or hide whole sections; order the home page sections. |
| **Site setup → 3D models** | The `.glb` models in the pillar cards and on the Projects page. |
| **Statistics → Live statistics** | The published figures behind every number, with periods and sources. Editing a figure on a programme or pillar updates these automatically. |
| **Statistics → Statistics history** | Every published change to a figure: before, after and who published it (editors and admins). |
| **Administration → Users** | Accounts and roles (admins). |

The import is compiled from the existing site content and media. It does not invent statistics, awards or partnerships. `npm run seed` creates missing entries and never overwrites authored records.

## Edit and publish

1. Find the item from the start page or the sidebar.
2. Make the change. Work is saved as a draft every few seconds. Contributors can draft; editors and administrators publish. Administrators manage accounts.
3. Open **Live preview** (the eye icon) to see the draft on the page where it appears, at phone, tablet or desktop size. A signed-in CMS session is required; draft content is never public or cached.
4. **Publish** when ready. Public tabs check for updates about every 30 seconds; new tabs load the current publication on start-up.

## Replace a photo, film, logo or model

Every image field has the same three parts: a **Preview**, an **Image** picker (choose from the Media library or upload) and, beneath it, **Or a file path / link** for a bundled file such as `/images/photo.jpg` or an `https://` address. An upload always wins over a path.

- **Programme photos** (hover photos, Core Values card, detail photos): edit the programme, tab *On the website*.
- **Pillar photos and galleries:** Galleries; filter by *Shown in*.
- **Partner logos:** the partner's record, *Logo & branding*.
- **Header/footer logo and sharing image:** Site settings.
- **Logos, portraits and design artwork:** Website images.
- **3D models:** Site setup → 3D models.

Supported uploads: JPEG, PNG, WebP, AVIF, GIF, MP4, WebM, MP3, M4A, Ogg, WAV and GLB/glTF, up to 150 MB. Prefer self-contained GLB models. Images receive thumbnail, card and full-size (1800px) variants; the website serves the full-size variant rather than the camera original, and records an upload's width and height automatically. Use a new filename when changing the bytes of a bundled file so browser/CDN caching cannot keep the old one.

Keep a record's **Website ID** (in the sidebar) unchanged; only administrators can edit it. Titles, text and media can change freely.

## For developers

- **Text and image slots.** Components read editable text with `getCMSCopy(key, fallback)` and design images with `resolveCMSAsset(key, fallback)` / `resolveCMSMedia(path)`. The registries `src/cms/generatedCopy.json` and `generatedAssets.json` list every slot; `npm run cms:registry` reports slots the code uses but the CMS lacks, and slots nothing uses, and `npm run cms:registry -- --write` fixes both. A test fails CI when they drift. After changing slots, run `npm run cms:seed` and re-seed.
- **Page and section labels.** `scripts/generate-cms-seed.ts` maps each component to the page and section editors see (`COMPONENT_AREAS`). Add new components there.
- **Programme presentation** (icon, menu label, hover photos/focus, card photo) is part of each record in `src/data/activities.ts`; the icon list lives in `src/data/activityIcons.ts` and the CMS offers the same options.
- **Uploads in the snapshot.** An upload field named `media` fills `src`; any field named `<name>Media` fills `<name>` (e.g. `logoMedia` → `logo`), so new upload/path pairs need no snapshot code.
- **Schema changes** need a PostgreSQL migration (`npm run migrate:create <name>` in `backend` with a Postgres `DATABASE_URI`); CI rejects schema drift. Drizzle asks whether new columns are renames; answer *create* unless you are deliberately renaming. Adding or changing labels, descriptions, tabs, rows and other admin-only options needs no migration.

## Efficiency and layout boundaries

- A compact public publication is fetched once during start-up, with a 1.2-second network deadline and a validated cached/bundled fallback. Visitor rendering never waits indefinitely for the CMS.
- Unchanged content returns HTTP 304 using ETags. Hidden/offline tabs stop making requests, and repeated failures back off to five-minute intervals.
- Publications update data and React's external store together; open records keep their identity, scroll position is preserved and animations do not restart.
- Missing or malformed entries fall back to their bundled equivalents one by one: a bad hover photo is dropped, not the programme. The number and order of pillars is fixed.
- Content, text, images, menus and the exposed section switches are editable. Adding a completely new component or behaviour still requires a code change; the CMS never executes uploaded code.

Statistics do not invent a real-time feed. They update when an authorised person or integration publishes verified figures, through Payload's authenticated REST API with server-side credentials; no credentials belong in the browser.

## Production

Use HTTPS, a durable PostgreSQL database and persistent media storage. Run `npm run migrate` before starting a new CMS release; development (SQLite) synchronises its schema automatically. Set a strong `PAYLOAD_SECRET`, the public CMS/site URLs and the allowed frontend origins. The CMS service must be deployed as well as the static frontend; a frontend deployment alone cannot host Payload or its database. Until the CMS is deployed and `VITE_CMS_URL` is set, the live website shows its bundled content.

Back up the database and media directory together before migrations or releases. Keep secret environment files, local SQLite databases and uploads out of Git. See `backend/README.md` and the repository's infrastructure configuration for deployment commands.

## Validation

Run from the repository root:

```sh
npm run lint
npm test
npm run build
```

and in `backend`: `npm run lint`, `npm test`, `node --import tsx scripts/access-integration.ts`, `npm run build`, and with a seeded server running `node --import tsx scripts/smoke-api.ts`.

The checks cover malformed publications, unsafe URLs, fallback behaviour, programme presentation fields, the slot registry, live-stat updates, preserved dialog records and event dates; backend checks cover publication access, role restrictions, statistics synchronisation, caching, preview links and the public snapshot.
