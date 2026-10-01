# SNCF Content Studio

Payload CMS runs at `http://localhost:3001/admin`. The website reads the published snapshot at `/api/site-content`; there is no CMS request or React state update inside a WebGL animation frame.

## Local setup

```sh
cd backend
npm ci --include=dev
cp .env.example .env
# Set PAYLOAD_SECRET to the output of: openssl rand -base64 32
npm run seed -- seed/site-content.json
npm run dev
```

The default `DATABASE_URI=file:./cms-dev.db` uses SQLite, so local setup needs no Docker or Postgres. Open `/admin` and create the first administrator. Seeding never creates an account, and a second seed preserves all existing records. The database, uploads and `.env` are ignored by Git and Docker.

## Authoring

The sidebar groups the studio by task; [CMS.md](../CMS.md) has the full editor guide.

- **Content:** pillars, programmes & projects (figures, tile symbol, menu name, hover photos and Core Values card photo), events, partners (with their logo and branding) and awards.
- **Website text & images:** every text slot, filterable by page and searchable by its current words; design images with thumbnails; galleries (pillar photos and page galleries); the media library (alt text, credit, licence, folders, tags; 150 MB per file).
- **Site setup:** site settings (identity, contact, main menu, footer columns, social links, search & sharing defaults), page titles & SEO, sections on/off, and 3D models.
- **Statistics:** the canonical figures used by the website. Changes published through the Programme/Pillar forms synchronise changed figures. External integrations can PATCH `/api/live-stats/:id` using an editor service user's API key (`Authorization: users API-Key YOUR_KEY`). Every published value change records its previous value and author in **Statistics history**.

Every image field pairs an upload with an optional file path and shows a live preview. Live preview opens the page where the edited record appears. GraphQL is disabled; the website uses the REST snapshot below.

Contributors save drafts; editors publish and manage media; administrators manage people and roles. API keys inherit the user's role. Preview uses the authenticated CMS session: `/api/site-content?preview=true` is never public or cached. Do not embed an API key into the website bundle.

## Runtime and caching

`GET /api/site-content` returns the versioned site snapshot. Asset upload URLs are absolute CMS URLs. `GET /api/live-stats-feed` is a compact statistics-only response. Both support `If-None-Match` / `304`. Concurrent published reads share one in-memory request; authoring changes invalidate it immediately in-process, and a 15-second expiry catches changes across processes. Configure the website's `VITE_CMS_URL` with the CMS origin. CORS permits only configured site origins and local development aliases.

`npm run export:content` writes the same published snapshot to `../public/cms-content.json` (override `EXPORT_OUT_FILE`). The website ships existing content as a fallback and uses live published edits when the CMS is available.

## Production

Use a persistent Postgres database and media volume, a random secret (32+ characters), `PAYLOAD_PUBLIC_SERVER_URL` and `PAYLOAD_PUBLIC_SITE_URL` for the actual HTTPS origins, and `CMS_ALLOWED_ORIGINS` only for intended preview origins. Run committed migrations before starting the server:

```sh
NODE_ENV=production npm run migrate
NODE_ENV=production npm run seed -- seed/site-content.json
npm run build
npm run start
```

The Docker `cli` target contains migrations and seed data; the `runner` target runs the standalone Next server. A seed is an initial/import operation, not a destructive content reset. Existing records are never overwritten. Back up the Postgres database and `/app/media` together. For local SQLite, stop the CMS before copying the database and media directory.

Email delivery is not configured automatically; configure an email adapter before relying on invitation or password-reset delivery in production. The local Payload development transport logs messages only.

## Verification

```sh
npm run lint
npm test
node --import tsx scripts/access-integration.ts
npm run build
# With the seeded server running:
node --import tsx scripts/smoke-api.ts
```

The database integration test creates and deletes its own temporary SQLite database and test accounts. It never uses the local authoring database. Backend CI also applies the Postgres migrations from an empty database, checks migration drift, verifies idempotent seeding, builds both Docker targets and checks the HTTP API. CMS deployment remains a deliberate operation; the backend workflow does not deploy a server.

### Contribution checkout integration status

The `/contribute` frontend collects the official form's contact, identity, amount and address fields on this site. It currently keeps the form in memory and does not submit identities or charge payments. The Razorpay server adapter in `src/payments/razorpay.ts` creates INR orders, verifies callback signatures against a stored order, and checks capture status and amount with Razorpay. It is not exposed as a public payment endpoint yet.

Before activation: configure server-only `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` with test keys; connect mobile/email OTP providers with expiry, attempt limits and verified sessions; add restricted, encrypted donor storage and a contribution ledger; expose authenticated/rate-limited order and verification endpoints; add signed webhook reconciliation and duplicate-event handling; then connect Razorpay Checkout and test success, cancellation, retries and delayed capture. Never send identity numbers in payment notes, URLs, browser storage or logs. A client callback alone must never mark a contribution paid.

Run adapter validation with `node --import tsx --test scripts/payments.test.ts`.
