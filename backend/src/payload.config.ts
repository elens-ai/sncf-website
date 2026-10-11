import 'dotenv/config'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {postgresAdapter} from '@payloadcms/db-postgres'
import {s3Storage} from '@payloadcms/storage-s3'
import {lexicalEditor} from '@payloadcms/richtext-lexical'
import {buildConfig} from 'payload'
import sharp from 'sharp'
import {Users} from './collections/Users'
import {Media} from './collections/Media'
import {contentCollections} from './collections/Content'
import {LiveStats,StatAudit} from './collections/LiveStats'
import {SiteSettings,PavilionSettings} from './globals/Settings'
import {endpoints} from './cms/endpoints'
import {previewURL} from './cms/preview'
import {databaseURI,mediaBucket,payloadSecret} from './cms/linked'
import {migrations} from './migrations'
import {seedOnInit} from './cms/bootstrap'
const dirname=path.dirname(fileURLToPath(import.meta.url))
const database=databaseURI()
const sqlite=database.startsWith('file:')||database.startsWith('libsql:')
const origins=[process.env.PAYLOAD_PUBLIC_SITE_URL||'http://localhost:3000',process.env.PAYLOAD_PUBLIC_SERVER_URL||'http://localhost:3001',...(process.env.CMS_ALLOWED_ORIGINS||'http://127.0.0.1:3000,http://127.0.0.1:3001').split(',')].filter(Boolean)
/* THE DATABASE. Local work and CI's checks use SQLite; everything deployed is
   PostgreSQL (the serverless CMS's Aurora, sst.config.ts, or the Compose stack).
   The SQLite adapter is loaded only when it is wanted: its driver is a native
   module built for the machine it was installed on, and the deployed function
   runs on another. On the serverless CMS nothing can run `payload migrate`
   before the server starts (the database is reachable from the function
   alone), so there Payload applies pending migrations as it initialises
   (CMS_RUN_MIGRATIONS, src/migrations/index.ts). */
const db=sqlite
  ?(await import('@payloadcms/db-sqlite')).sqliteAdapter({client:{url:database},push:process.env.NODE_ENV!=='production',migrationDir:path.resolve(dirname,'migrations-sqlite')})
  :postgresAdapter({pool:{connectionString:database,max:4},push:process.env.NODE_ENV!=='production',migrationDir:path.resolve(dirname,'migrations'),prodMigrations:process.env.CMS_RUN_MIGRATIONS==='true'?migrations:undefined})
/* THE MEDIA LIBRARY ON S3 (the serverless CMS). Files are public at
   CMS_MEDIA_URL (the router serves the bucket at /media/*), so their addresses
   point straight there rather than through the function; and the browser
   uploads straight into the bucket, which the function could not carry a
   150 MB film through. Locally, with no bucket, uploads stay in backend/media. */
const bucket=mediaBucket()
const mediaURL=(process.env.CMS_MEDIA_URL||'').replace(/\/$/,'')
const plugins=bucket?[s3Storage({
  collections:{media:{disablePayloadAccessControl:true,generateFileURL:({filename,prefix})=>`${mediaURL}/${prefix?`${prefix.replace(/\/$/,'')}/`:''}${filename}`}},
  bucket,config:{region:process.env.AWS_REGION||'ap-south-1'},clientUploads:true,
})]:[]
export default buildConfig({
  serverURL:process.env.PAYLOAD_PUBLIC_SERVER_URL||'http://localhost:3001',
  admin:{user:Users.slug,components:{beforeDashboard:['./components/CMSWelcome#CMSWelcome']},importMap:{baseDir:dirname},meta:{titleSuffix:'— SNCF Content Studio'},
    livePreview:{
      url:({data,collectionConfig,globalConfig})=>previewURL(collectionConfig?.slug??globalConfig?.slug,data),
      collections:[...contentCollections.map(c=>c.slug),LiveStats.slug],globals:[SiteSettings.slug,PavilionSettings.slug],
      breakpoints:[{label:'Phone',name:'phone',width:390,height:844},{label:'Tablet',name:'tablet',width:820,height:1180},{label:'Desktop',name:'desktop',width:1440,height:900}],
    }},
  // Collection order sets the studio's sidebar: content, then text & images, setup, statistics, administration.
  collections:[...contentCollections,Media,LiveStats,StatAudit,Users],
  // The website reads one REST snapshot; nothing uses GraphQL.
  graphQL:{disable:true},globals:[SiteSettings,PavilionSettings],endpoints,plugins,
  editor:lexicalEditor(),secret:payloadSecret(),
  onInit:async(payload)=>{
    if(process.env.NODE_ENV==='production'&&(payloadSecret().length<32||sqlite))throw new Error('Production requires a PostgreSQL DATABASE_URI (or the linked database) and a random PAYLOAD_SECRET of at least 32 characters.')
    // the serverless CMS seeds an empty database on its first start (cms/bootstrap.ts)
    if(process.env.CMS_SEED_ON_INIT==='true'&&!sqlite)await seedOnInit(payload)
  },
  typescript:{outputFile:path.resolve(dirname,'payload-types.ts')},
  db,
  sharp,cors:{origins,headers:['If-None-Match']},csrf:origins,
  upload:{limits:{fileSize:150*1024*1024}},
})
