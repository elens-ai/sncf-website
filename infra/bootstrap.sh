#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# SNCF Website — AWS bootstrap (S3 + CloudFront + Route53 + deploy role)
#
# Creates everything the GitHub Actions pipeline needs, idempotently:
#   - Private S3 bucket for the built site
#   - CloudFront distribution (OAC) on https://sncf.elens.in with SPA fallback
#   - Route53 alias records in the elens.in hosted zone
#   - IAM role assumable by GitHub Actions via OIDC (no long-lived keys)
#
# Usage:  ./infra/bootstrap.sh              (uses the "elens" AWS profile)
#         AWS_PROFILE=other ./infra/bootstrap.sh
# ---------------------------------------------------------------------------
set -euo pipefail

PROFILE="${AWS_PROFILE:-elens}"
REGION="ap-south-1"
DOMAIN="sncf.elens.in"
BUCKET="sncf-elens-in-site"
OAC_NAME="sncf-elens-in-oac"
ROLE_NAME="sncf-website-deploy"
GITHUB_REPO="elens-ai/sncf-website"
# GitHub's immutable OIDC subject for newer repos annotates owner/repo with
# numeric IDs; older repos emit the classic form. Trust must accept both.
GITHUB_REPO_IMMUTABLE="elens-ai@270894618/sncf-website@1343110707"
HOSTED_ZONE_ID="Z04934213J0DEUMSWHR9W" # elens.in public zone
# *.elens.in certificate in us-east-1 (CloudFront requires us-east-1), ISSUED
ACM_ARN="arn:aws:acm:us-east-1:025078772718:certificate/266a3561-801c-4b91-8b57-0e02cd6be12e"
CF_HOSTED_ZONE="Z2FDTNDATAQYW2" # CloudFront's fixed alias zone id

aws() { command aws --profile "$PROFILE" "$@"; }
info() { printf '\033[0;32m==>\033[0m %s\n' "$*"; }

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
info "Account: $ACCOUNT_ID  Profile: $PROFILE"

# ---------- 1. S3 bucket (private; CloudFront-only access) ----------
if aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  info "Bucket $BUCKET already exists"
else
  info "Creating bucket $BUCKET in $REGION"
  aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION"
fi
aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# ---------- 2. CloudFront Origin Access Control ----------
OAC_ID=$(aws cloudfront list-origin-access-controls \
  --query "OriginAccessControlList.Items[?Name=='$OAC_NAME'].Id | [0]" --output text)
if [ "$OAC_ID" = "None" ] || [ -z "$OAC_ID" ]; then
  info "Creating Origin Access Control"
  OAC_ID=$(aws cloudfront create-origin-access-control --origin-access-control-config \
    "Name=$OAC_NAME,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3" \
    --query OriginAccessControl.Id --output text)
fi
info "OAC: $OAC_ID"

# ---------- 3. CloudFront distribution ----------
DIST_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Aliases.Items && contains(Aliases.Items, '$DOMAIN')].Id | [0]" --output text)
if [ "$DIST_ID" = "None" ] || [ -z "$DIST_ID" ]; then
  info "Creating CloudFront distribution for $DOMAIN"
  cat > /tmp/sncf-dist.json <<JSON
{
  "CallerReference": "sncf-website-$(date +%s)",
  "Comment": "SNCF Website - $DOMAIN",
  "Enabled": true,
  "HttpVersion": "http2and3",
  "PriceClass": "PriceClass_200",
  "Aliases": { "Quantity": 1, "Items": ["$DOMAIN"] },
  "DefaultRootObject": "index.html",
  "Origins": { "Quantity": 1, "Items": [{
    "Id": "s3-$BUCKET",
    "DomainName": "$BUCKET.s3.$REGION.amazonaws.com",
    "OriginAccessControlId": "$OAC_ID",
    "S3OriginConfig": { "OriginAccessIdentity": "" }
  }]},
  "DefaultCacheBehavior": {
    "TargetOriginId": "s3-$BUCKET",
    "ViewerProtocolPolicy": "redirect-to-https",
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "Compress": true,
    "AllowedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"],
      "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] } }
  },
  "CustomErrorResponses": { "Quantity": 2, "Items": [
    { "ErrorCode": 403, "ResponseCode": "200", "ResponsePagePath": "/index.html", "ErrorCachingMinTTL": 10 },
    { "ErrorCode": 404, "ResponseCode": "200", "ResponsePagePath": "/index.html", "ErrorCachingMinTTL": 10 }
  ]},
  "ViewerCertificate": {
    "ACMCertificateArn": "$ACM_ARN",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  }
}
JSON
  DIST_ID=$(aws cloudfront create-distribution --distribution-config file:///tmp/sncf-dist.json \
    --query Distribution.Id --output text)
fi
DIST_DOMAIN=$(aws cloudfront get-distribution --id "$DIST_ID" --query Distribution.DomainName --output text)
DIST_ARN="arn:aws:cloudfront::$ACCOUNT_ID:distribution/$DIST_ID"
info "Distribution: $DIST_ID ($DIST_DOMAIN)"

# ---------- 4. Bucket policy: CloudFront OAC read-only ----------
cat > /tmp/sncf-bucket-policy.json <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowCloudFrontOAC",
    "Effect": "Allow",
    "Principal": { "Service": "cloudfront.amazonaws.com" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::$BUCKET/*",
    "Condition": { "StringEquals": { "AWS:SourceArn": "$DIST_ARN" } }
  }]
}
JSON
aws s3api put-bucket-policy --bucket "$BUCKET" --policy file:///tmp/sncf-bucket-policy.json
info "Bucket policy applied"

# ---------- 5. Route53 alias records ----------
info "Upserting Route53 A/AAAA aliases for $DOMAIN"
for TYPE in A AAAA; do
  cat > /tmp/sncf-rrset.json <<JSON
{ "Changes": [{ "Action": "UPSERT", "ResourceRecordSet": {
  "Name": "$DOMAIN", "Type": "$TYPE",
  "AliasTarget": { "HostedZoneId": "$CF_HOSTED_ZONE", "DNSName": "$DIST_DOMAIN", "EvaluateTargetHealth": false }
}}]}
JSON
  aws route53 change-resource-record-sets --hosted-zone-id "$HOSTED_ZONE_ID" \
    --change-batch file:///tmp/sncf-rrset.json --query 'ChangeInfo.Status' --output text
done

# ---------- 6. IAM role for GitHub Actions (OIDC) ----------
cat > /tmp/sncf-trust.json <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::$ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
      "StringLike": { "token.actions.githubusercontent.com:sub": [
        "repo:$GITHUB_REPO:*",
        "repo:$GITHUB_REPO_IMMUTABLE:*"
      ]}
    }
  }]
}
JSON
if aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  info "Role $ROLE_NAME exists — refreshing trust policy"
  aws iam update-assume-role-policy --role-name "$ROLE_NAME" --policy-document file:///tmp/sncf-trust.json
else
  info "Creating role $ROLE_NAME"
  aws iam create-role --role-name "$ROLE_NAME" \
    --assume-role-policy-document file:///tmp/sncf-trust.json \
    --description "GitHub Actions deploy role for $GITHUB_REPO" >/dev/null
fi

cat > /tmp/sncf-deploy-policy.json <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::$BUCKET" },
    { "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::$BUCKET/*" },
    { "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation"],
      "Resource": "$DIST_ARN" }
  ]
}
JSON
aws iam put-role-policy --role-name "$ROLE_NAME" --policy-name deploy-site \
  --policy-document file:///tmp/sncf-deploy-policy.json
ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query Role.Arn --output text)
info "Deploy role: $ROLE_ARN"

# ---------- Summary ----------
echo
info "Bootstrap complete. GitHub repository variables to set:"
echo "  AWS_ROLE_ARN                = $ROLE_ARN"
echo "  AWS_REGION                  = $REGION"
echo "  S3_BUCKET                   = $BUCKET"
echo "  CLOUDFRONT_DISTRIBUTION_ID  = $DIST_ID"
echo
info "Site will serve at: https://$DOMAIN (after first deploy + CF propagation)"
