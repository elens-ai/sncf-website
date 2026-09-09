# Deployment and workflow checks

`vansh`, `dev` and `main` run frontend, backend and infrastructure checks when their affected files change. Pull requests run the same checks. A push to `vansh` does not deploy production.

## Frontend

`.github/workflows/frontend.yml` installs the committed lockfile, typechecks, tests and builds. Main pushes and manually approved deployment runs publish the build to the existing private S3 bucket/CloudFront distribution.

Repository variables:

- `AWS_ROLE_ARN`, `AWS_REGION`, `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID` identify the existing hosting resources.
- `VITE_CMS_URL` must be the public HTTPS **origin** of the deployed CMS, with no API path or credentials. Production deployment refuses to proceed without it. Set this as a repository variable so the build job can read it; environment-only variables are not available to that job.

Only generated `/assets/` files receive immutable caching. Stable photo, video and model filenames revalidate. Old hashed chunks remain available for visitors with the previous page open. CloudFront invalidates all paths after the new HTML has uploaded.

GitHub OIDC permission exists only on the deployment job. Protect the `production` environment with the intended deployment branches and reviewers. See the official [GitHub AWS OIDC instructions](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws).

## Backend

`.github/workflows/backend.yml` checks types, publishing/permissions, database migrations on a fresh PostgreSQL service, seed idempotence, schema drift, production images and HTTP cache/access behaviour. It verifies that secrets are absent from the runnable image.

The CMS is a persistent service with a database and uploaded media. It is deployed on its host, not to the frontend's S3 bucket. Follow [backend/README.md](backend/README.md) for migrations, seeding, persistent storage and local first-user setup. Configure HTTPS at the host reverse proxy; the Compose CMS/database ports bind to loopback by default.

The CMS needs `PAYLOAD_PUBLIC_SERVER_URL`, `PAYLOAD_PUBLIC_SITE_URL`, `CMS_ALLOWED_ORIGINS`, a strong `PAYLOAD_SECRET`, and a production PostgreSQL `DATABASE_URI`. The frontend origin must be allowed by the CMS. Back up the database and media volume before migration. Do not expose the first-user setup publicly before creating the administrator account.

## Infrastructure

`.github/workflows/infra.yml` validates shell syntax, ShellCheck, AWS bootstrap requests using a mock CLI, all Compose profiles, the frontend production image and Nginx configuration. These checks never create cloud resources.

`infra/bootstrap.sh` remains an explicit operator command for AWS provisioning. It checks the authenticated certificate/account, keeps S3 private, uses CloudFront OAC, validates existing origins before changing the bucket policy, enables IPv6 on new distributions, creates a missing GitHub OIDC provider, and scopes role trust to the GitHub `production` environment. Temporary policy documents are isolated and cleaned up.

The script targets the existing SNCF domain/account settings declared at its top. Review those settings before running it in another account. It stops if an existing distribution has a different origin/OAC; reconcile that configuration deliberately before retrying.

CloudFront's cache policy also affects origin headers: a positive minimum TTL can override `no-cache`/`no-store` for that interval. See [AWS cache-policy documentation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cache-key-understand-cache-policy.html). The current static-site policy has a one-second minimum; deployment invalidation refreshes changed files immediately at the edge after propagation.

## Local verification

```sh
npm ci
npm run lint
npm test
npm run build
node --test infra/*.test.cjs scripts/check-cms-url.test.cjs
bash -n infra/bootstrap.sh
# If installed:
actionlint .github/workflows/*.yml
shellcheck infra/bootstrap.sh
```

Docker/PostgreSQL jobs need those runtimes. Their GitHub results should be checked after pushing; passing local TypeScript or shell checks alone does not prove a production deployment succeeded.
