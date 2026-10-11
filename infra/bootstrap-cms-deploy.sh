#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# SNCF CMS — the role GitHub Actions deploys the serverless CMS with
#
# Creates, idempotently, an IAM role that the cms workflow
# (.github/workflows/cms.yml) assumes through GitHub's OIDC provider, with no
# long-lived keys, and only from this repository's `dev` environment or its
# `dev` branch. `sst deploy` creates and changes a VPC, an Aurora cluster,
# Lambda functions, CloudFront, S3, IAM roles, Route 53 records and SSM
# parameters, so the role carries AdministratorAccess; narrowing it is a
# follow-up once the set of resources has settled.
#
# Usage:  ./infra/bootstrap-cms-deploy.sh              (uses the "elens" AWS profile)
#         AWS_PROFILE=other ./infra/bootstrap-cms-deploy.sh
# ---------------------------------------------------------------------------
set -euo pipefail

for required in aws jq; do
  command -v "$required" >/dev/null || { echo "Missing required tool: $required" >&2; exit 1; }
done

PROFILE="${AWS_PROFILE:-elens}"
ROLE_NAME="sncf-cms-deploy"
GITHUB_REPO="elens-ai/sncf-website"
GITHUB_REPO_IMMUTABLE="elens-ai@270894618/sncf-website@1343110707"
ENVIRONMENT="dev"
BRANCH="dev"

aws() { command aws --profile "$PROFILE" "$@"; }
info() { printf '\033[0;32m==>\033[0m %s\n' "$*"; }

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
PROVIDER="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$PROVIDER" >/dev/null \
  || { echo "GitHub's OIDC provider is missing; run infra/bootstrap.sh first." >&2; exit 1; }

TRUST=$(jq -n --arg provider "$PROVIDER" \
  --arg env1 "repo:${GITHUB_REPO}:environment:${ENVIRONMENT}" --arg env2 "repo:${GITHUB_REPO_IMMUTABLE}:environment:${ENVIRONMENT}" \
  --arg ref1 "repo:${GITHUB_REPO}:ref:refs/heads/${BRANCH}" --arg ref2 "repo:${GITHUB_REPO_IMMUTABLE}:ref:refs/heads/${BRANCH}" '{
  Version: "2012-10-17",
  Statement: [{
    Effect: "Allow",
    Principal: { Federated: $provider },
    Action: "sts:AssumeRoleWithWebIdentity",
    Condition: {
      StringEquals: { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
      StringLike: { "token.actions.githubusercontent.com:sub": [$env1, $env2, $ref1, $ref2] }
    }
  }]
}')

if aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  info "Role $ROLE_NAME exists; refreshing its trust policy"
  aws iam update-assume-role-policy --role-name "$ROLE_NAME" --policy-document "$TRUST"
else
  info "Creating role $ROLE_NAME"
  aws iam create-role --role-name "$ROLE_NAME" --assume-role-policy-document "$TRUST" \
    --description "GitHub Actions: sst deploy of the SNCF CMS (environment ${ENVIRONMENT})" \
    --max-session-duration 7200 >/dev/null
fi
aws iam attach-role-policy --role-name "$ROLE_NAME" --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
info "Role: arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
