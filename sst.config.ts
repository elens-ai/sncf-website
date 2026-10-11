/// <reference path="./.sst/platform/config.d.ts" />
/**
 * THE CMS, SERVERLESS, AT https://sncfcms.elens.in
 *
 * The website itself stays as it is: a static build on S3 and CloudFront,
 * deployed by GitHub Actions (.github/workflows/frontend.yml). This file
 * deploys only the content studio (backend/, Payload on Next.js), the way the
 * rest of eLens's applications run: nothing is a server.
 *
 *   Router (CloudFront)  https://sncfcms.elens.in
 *     /media/*  ->  the media bucket, straight from S3 (photographs, films,
 *                   the anthem, 3D models; uploads go straight there too)
 *     /*        ->  the Next.js server function (the admin and its API)
 *   Aurora Serverless v2 PostgreSQL  pauses to 0 ACU when idle, wakes on use
 *   VPC  private subnets for the function and the database, an S3 gateway
 *        endpoint instead of a NAT gateway (the function needs nothing else)
 *
 * Every publication is also copied into the website's own bucket as
 * /api/site-content (backend/src/cms/publish.ts), which is where visitors read
 * it from; so the website never waits for a Lambda or a paused database.
 *
 * Deployed by GitHub Actions (.github/workflows/cms.yml) from the `dev`
 * environment, stage `dev`: sncf.elens.in and this CMS are the foundation's
 * development environment. By hand, with the elens AWS profile:
 *   npx sst secret set PayloadSecret "$(openssl rand -base64 48)" --stage dev
 *   npx sst deploy --stage dev
 * Any other stage gets its own hostname, <stage>-sncfcms.elens.in, and is
 * removed cleanly by `sst remove`.
 */
export default $config({
  app(input) {
    const main = input?.stage === 'dev'
    return {
      name: 'sncf-cms',
      /* the dev stage is the real one: kept, never removed by a mistaken `sst remove` */
      removal: main ? 'retain' : 'remove',
      protect: main,
      home: 'aws',
      providers: {
        aws: {
          region: 'ap-south-1',
          /* GitHub Actions brings its own credentials (OIDC); a person uses the elens profile */
          ...(process.env.CI ? {} : { profile: process.env.AWS_PROFILE ?? 'elens' }),
        },
      },
    }
  },
  async run() {
    const main = $app.stage === 'dev'
    const host = main ? 'sncfcms.elens.in' : `${$app.stage}-sncfcms.elens.in`
    const siteOrigin = 'https://sncf.elens.in'
    const cmsOrigin = `https://${host}`
    /* elens.in, in Route 53, and the account's *.elens.in certificate (us-east-1, as CloudFront requires) */
    const ZONE = 'Z04934213J0DEUMSWHR9W'
    const CERT = 'arn:aws:acm:us-east-1:025078772718:certificate/266a3561-801c-4b91-8b57-0e02cd6be12e'
    /* the website's bucket (infra/bootstrap.sh): the published snapshot is written there, from the main stage only */
    const SITE_BUCKET = 'sncf-elens-in-site'
    const SNAPSHOT_KEY = 'api/site-content'

    /* THE NETWORK. Two availability zones (Aurora needs two); no NAT gateway,
       which would be the costliest thing here: the function reaches S3 through
       a gateway endpoint on the private route tables, and needs nothing else
       outside the VPC. */
    const vpc = new sst.aws.Vpc('CmsVpc', { az: 2 })
    new aws.ec2.VpcEndpoint('CmsS3Endpoint', {
      vpcId: vpc.id,
      serviceName: 'com.amazonaws.ap-south-1.s3',
      vpcEndpointType: 'Gateway',
      routeTableIds: vpc.nodes.privateRouteTables.apply(tables => tables.map(table => table.id)),
    })

    /* THE DATABASE: PostgreSQL that pauses after an hour without a query (an
       editor's pause for thought should not cost a 15-second wake), and runs
       between half an ACU and two while in use. */
    const database = new sst.aws.Aurora('CmsDatabase', {
      engine: 'postgres',
      vpc,
      database: 'sncf_cms',
      scaling: { min: '0 ACU', max: '2 ACU', pauseAfter: '1 hour' },
    })

    /* THE MEDIA LIBRARY: public through the router at /media/*; the browser
       uploads straight into it (the function could not carry a 150 MB film). */
    const media = new sst.aws.Bucket('CmsMedia', {
      access: 'cloudfront',
      cors: {
        allowOrigins: [cmsOrigin],
        allowMethods: ['GET', 'HEAD', 'PUT'],
        allowHeaders: ['*'],
        exposeHeaders: ['ETag'],
        maxAge: '1 day',
      },
    })

    const secret = new sst.Secret('PayloadSecret')

    const router = new sst.aws.Router('CmsRouter', {
      domain: { name: host, cert: CERT, dns: sst.aws.dns({ zone: ZONE }) },
    })
    router.routeBucket('/media', media, { rewrite: { regex: '^/media/(.*)$', to: '/$1' } })

    const cms = new sst.aws.Nextjs('Cms', {
      path: 'backend',
      router: { instance: router },
      vpc,
      link: [database, media, secret],
      /* the one line of this configuration a newer Next.js depends on: SST's
         own default (OpenNext 3.9) predates Next.js 16; 4.1 carries its fixes */
      openNextVersion: '4.1.9',
      server: { architecture: 'arm64', memory: '2048 MB', timeout: '5 minutes' },
      /* one instance kept warm: an editor should not meet a cold start */
      warm: 1,
      environment: {
        NODE_ENV: 'production',
        PAYLOAD_PUBLIC_SERVER_URL: cmsOrigin,
        PAYLOAD_PUBLIC_SITE_URL: siteOrigin,
        CMS_ALLOWED_ORIGINS: siteOrigin,
        CMS_MEDIA_URL: `${cmsOrigin}/media`,
        SITE_SNAPSHOT_BUCKET: main ? SITE_BUCKET : '',
        SITE_SNAPSHOT_KEY: SNAPSHOT_KEY,
        SITE_SNAPSHOT_REGION: 'ap-south-1',
        /* pending migrations are applied, and an empty database seeded, as the server starts */
        CMS_RUN_MIGRATIONS: 'true',
        CMS_SEED_ON_INIT: 'true',
      },
      permissions: [
        { actions: ['s3:PutObject'], resources: [`arn:aws:s3:::${SITE_BUCKET}/${SNAPSHOT_KEY}`] },
      ],
    })

    return { cms: cmsOrigin, media: media.name, database: database.host, url: cms.url }
  },
})
