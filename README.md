# Sant Nirankari Charitable Foundation

The SNCF website combines a responsive React frontend, an interactive Three.js pavilion, and a Payload CMS for content, media, statistics and exhibition settings.

## Features

- A scroll-driven journey from the hero's ghost petals through the curtain entrance into the pavilion.
- Four galleries for Heal, Enrich, Empower and Projects, with framed photography, soft lighting, video windows and a mosaic finale featuring the 3D SNCF emblem.
- Phone, tablet and landscape layouts, including responsive camera framing, accessible navigation and mobile search.
- Pages for core values, projects, the foundation and its guiding force, alongside events, partners and awards.
- CMS controls for text, photos, videos, audio, models, statistics, navigation, component visibility/order and pavilion materials, lighting and camera settings.
- Drafts, authenticated previews, editor publishing and an audit trail for statistics. Published changes update open tabs; cached and bundled content keep the site usable when the CMS is unavailable.

## Run the website

Use **Node.js 22** and npm.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. The website includes bundled content and can run without the CMS. No AI API key is needed to run the site.

## Run the CMS

1. In `backend`, run `npm ci`.
2. Copy `backend/.env.example` to `backend/.env` if it does not already exist. Generate a private `PAYLOAD_SECRET` with `openssl rand -base64 32`.
3. From the repository root, run `npm run cms:seed` to generate the import file.
4. In `backend`, run `npm run seed`, followed by `npm run dev`.
5. Open `http://localhost:3001/admin` and create the first administrator account.

Local development uses SQLite by default. Production uses PostgreSQL migrations and persistent media storage. No default administrator credentials are committed. Use the same hostname for the website and CMS when previewing drafts.

The Vite server proxies `/api` to the local CMS. Production builds use the public HTTPS CMS origin configured through `VITE_CMS_URL`. Never put private credentials in `VITE_` variables.

See [CMS setup and authoring](CMS.md) for editing, media replacement, previews, publishing and the exposed design controls. See [backend/README.md](backend/README.md) for roles, API access, migrations and backups.

## Validate changes

From the repository root:

```sh
npm run lint
npm test
npm run build
node --test infra/*.test.cjs scripts/check-cms-url.test.cjs
```

In `backend`:

```sh
npm run lint
npm test
node --import tsx scripts/access-integration.ts
npm run build
```

The checks cover CMS validation and fallback, live statistics, permissions, camera framing, animation scheduling, gallery assets and infrastructure configuration. Browser checks should also cover phone, tablet, landscape and desktop layouts.

## Deployment

| Workflow | Purpose |
| --- | --- |
| [Frontend CI/CD](.github/workflows/frontend.yml) | Lockfile install, typecheck, tests and build; S3/CloudFront deployment for main pushes or explicit manual deployments. |
| [Backend CI](.github/workflows/backend.yml) | Publishing and access tests, fresh PostgreSQL migrations, seed idempotence, schema drift, container builds and HTTP checks. |
| [Infrastructure validation](.github/workflows/infra.yml) | Shell/Bootstrap checks, mocked AWS requests, Compose profiles, frontend image and Nginx configuration. |

Checks include `vansh`, `dev` and `main` when their affected files change. Pushing `vansh` does not deploy production. The CMS is a separate persistent service; deploying the static website does not deploy its database or admin.

See [deployment configuration](DEPLOYMENT.md) for required GitHub variables, CMS hosting, OIDC, caching and infrastructure provisioning.

## Repository layout

- `src/`: frontend components, routes, styles, content adapters and rendering utilities.
- `src/cms/`: publication store, validation, defaults and registered content/asset slots.
- `public/`: bundled images, models, videos and other static assets.
- `backend/`: Payload/Next.js CMS, collections, migrations, seed and API checks.
- `scripts/`: content registration, seed generation and deployment validation.
- `infra/`, `docker/`, `docker-compose.yml`: hosting/bootstrap and container configuration.

Keep local secrets, database files, generated builds and uploaded media out of Git. Back up the CMS database and media together before production migrations.
