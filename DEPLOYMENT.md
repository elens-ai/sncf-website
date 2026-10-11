# Deployment and workflow checks

`vansh`, `dev` and `main` run frontend, backend and infrastructure checks when their affected files change. Pull requests run the same checks. A push to `vansh` deploys nothing; a push to `dev` deploys the development environment (the website, and the CMS when `backend/` changed).

## The `dev` environment

sncf.elens.in and the CMS at sncfcms.elens.in are the foundation's **development environment**. Every setting the workflows need lives in the GitHub environment `dev` (Settings → Environments → dev), not in repository variables:

| Kind | Name | Used by |
|---|---|---|
| variable | `AWS_REGION` | both |
| variable | `AWS_ROLE_ARN` | frontend: the site's deploy role (`infra/bootstrap.sh`) |
| variable | `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID` | frontend: the site's bucket and distribution |
| variable | `VITE_CMS_URL` | frontend build: the CMS origin, used only for editors' draft previews |
| variable | `CMS_DEPLOY_ROLE_ARN` | cms: the role `sst deploy` runs as (`infra/bootstrap-cms-deploy.sh`) |
| variable | `SST_STAGE` (`dev`), `CMS_URL` | cms: the SST stage and the address to verify |
| secret | `PAYLOAD_SECRET` | cms: signs CMS sessions; handed to SST as its `PayloadSecret` |

Both deploy roles are assumed through GitHub's OIDC provider (no long-lived keys); the CMS role is trusted only from this repository's `dev` environment and `dev` branch.

## Frontend

`.github/workflows/frontend.yml` installs the committed lockfile, typechecks, tests and builds. Every push to `dev` or `main`, and a manual run (unless dispatched with `deploy=false`), publishes the build to the existing private S3 bucket/CloudFront distribution.

`VITE_CMS_URL` is the CMS's public HTTPS **origin** (`https://sncfcms.elens.in`), with no API path, credentials, query or fragment; an invalid value fails validation, and an unset one builds the site without previews. Visitors never read from that address: the website takes its published content from `/api/site-content` **on its own origin**, a file the CMS writes into the site's bucket at every publication (see Backend). With no file there yet, the request answers with the site's HTML, which is not JSON, and the bundled content stands. Only an editor's draft preview (`?cms-preview=true`, with their CMS sign-in) reads from the CMS itself.

Only generated `/assets/` files receive immutable caching. Stable photo, video and model filenames revalidate. Old hashed chunks remain available for visitors with the previous page open. CloudFront invalidates all paths after the new HTML has uploaded; the snapshot file is cached for a minute at most.

GitHub OIDC permission exists only on the deployment job. See the official [GitHub AWS OIDC instructions](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws).

## Backend

`.github/workflows/backend.yml` checks types, publishing/permissions, database migrations on a fresh PostgreSQL service, seed idempotence, schema drift, production images and HTTP cache/access behaviour. It verifies that secrets are absent from the runnable image.

`.github/workflows/cms.yml` deploys the CMS, serverless, with SST (`sst.config.ts`): on every push to `dev` that touches `backend/`, and on a manual run. What it creates, all in `ap-south-1`:

- a CloudFront router at **https://sncfcms.elens.in** (`/media/*` served straight from the media bucket, everything else by the server function), on the account's `*.elens.in` certificate and a Route 53 record;
- the server function: Payload on Next.js packaged by OpenNext, arm64, 2 GB, one instance kept warm;
- **Aurora Serverless v2 PostgreSQL** that pauses to 0 ACU after an hour without a query and wakes in about 15 seconds (an editor's first page after a long pause waits that long once);
- a VPC with private subnets and an S3 gateway endpoint, and no NAT gateway;
- the media bucket, uploaded to straight from the browser (`clientUploads`), with public files at `https://sncfcms.elens.in/media/…`.

On start-up the server applies pending migrations (`backend/src/migrations/index.ts`, `CMS_RUN_MIGRATIONS`) and, on an empty database, seeds it from `backend/seed/site-content.json` (`CMS_SEED_ON_INIT`) exactly as `npm run seed` would. **After the first deployment, open https://sncfcms.elens.in/admin and create the administrator** before sharing the address; seeding never creates an account.

Every publication (and the first seed) writes the public snapshot to the website's bucket as `/api/site-content` (`backend/src/cms/publish.ts`, the only permission the function has outside its own resources), so the website reads published content from its own CDN and never waits for the CMS.

The Compose stack (`docker compose --profile cms`) remains for running the same CMS on a server of your own; it needs `PAYLOAD_PUBLIC_SERVER_URL`, `PAYLOAD_PUBLIC_SITE_URL`, `CMS_ALLOWED_ORIGINS`, a strong `PAYLOAD_SECRET` and a PostgreSQL `DATABASE_URI`, with HTTPS at its reverse proxy.

## Infrastructure

`.github/workflows/infra.yml` validates shell syntax, ShellCheck, AWS bootstrap requests using a mock CLI, all Compose profiles, the frontend production image and Nginx configuration. These checks never create cloud resources.

`infra/bootstrap.sh` remains an explicit operator command for AWS provisioning. It checks the authenticated certificate/account, keeps S3 private, uses CloudFront OAC, validates existing origins before changing the bucket policy, enables IPv6 on new distributions, creates a missing GitHub OIDC provider, and scopes role trust to this repository. `infra/bootstrap-cms-deploy.sh` creates the role the CMS deployment runs as, trusted from the `dev` environment and branch. Temporary policy documents are isolated and cleaned up.

The script targets the existing SNCF domain/account settings declared at its top. Review those settings before running it in another account. It stops if an existing distribution has a different origin/OAC; reconcile that configuration deliberately before retrying.

CloudFront's cache policy also affects origin headers: a positive minimum TTL can override `no-cache`/`no-store` for that interval. See [AWS cache-policy documentation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cache-key-understand-cache-policy.html). The current static-site policy has a one-second minimum; deployment invalidation refreshes changed files immediately at the edge after propagation.

## Local verification

```sh
npm ci
npm run lint
npm test
npm run build
node --test infra/*.test.cjs scripts/check-cms-url.test.cjs
bash -n infra/bootstrap.sh infra/bootstrap-cms-deploy.sh
# If installed:
actionlint .github/workflows/*.yml
shellcheck infra/bootstrap.sh infra/bootstrap-cms-deploy.sh
```

Docker/PostgreSQL jobs need those runtimes. Their GitHub results should be checked after pushing; passing local TypeScript or shell checks alone does not prove a production deployment succeeded.
