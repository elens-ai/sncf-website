import 'dotenv/config'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {postgresAdapter} from '@payloadcms/db-postgres'
import {sqliteAdapter} from '@payloadcms/db-sqlite'
import {lexicalEditor} from '@payloadcms/richtext-lexical'
import {buildConfig} from 'payload'
import sharp from 'sharp'
import {Users} from './collections/Users'
import {Media} from './collections/Media'
import {contentCollections} from './collections/Content'
import {LiveStats,StatAudit} from './collections/LiveStats'
import {SiteSettings,PavilionSettings} from './globals/Settings'
import {endpoints} from './cms/endpoints'
const dirname=path.dirname(fileURLToPath(import.meta.url))
const databaseURI=process.env.DATABASE_URI||'file:./cms-dev.db'
const sqlite=databaseURI.startsWith('file:')||databaseURI.startsWith('libsql:')
const origins=[process.env.PAYLOAD_PUBLIC_SITE_URL||'http://localhost:3000',process.env.PAYLOAD_PUBLIC_SERVER_URL||'http://localhost:3001',...(process.env.CMS_ALLOWED_ORIGINS||'http://127.0.0.1:3000,http://127.0.0.1:3001').split(',')].filter(Boolean)
export default buildConfig({
  serverURL:process.env.PAYLOAD_PUBLIC_SERVER_URL||'http://localhost:3001',
  admin:{user:Users.slug,components:{beforeDashboard:['./components/CMSWelcome#CMSWelcome']},importMap:{baseDir:dirname},meta:{titleSuffix:'— SNCF Content Studio'},
    livePreview:{url:`${process.env.PAYLOAD_PUBLIC_SITE_URL||'http://localhost:3000'}?cms-preview=true`,collections:contentCollections.map(c=>c.slug)}},
  collections:[Users,Media,...contentCollections,LiveStats,StatAudit],globals:[SiteSettings,PavilionSettings],endpoints,
  editor:lexicalEditor(),secret:process.env.PAYLOAD_SECRET||'',
  onInit:async()=>{if(process.env.NODE_ENV==='production'&&(!process.env.PAYLOAD_SECRET||process.env.PAYLOAD_SECRET.length<32||!process.env.DATABASE_URI))throw new Error('Production requires DATABASE_URI and a random PAYLOAD_SECRET of at least 32 characters.')},
  typescript:{outputFile:path.resolve(dirname,'payload-types.ts')},
  db:sqlite?sqliteAdapter({client:{url:databaseURI},push:process.env.NODE_ENV!=='production',migrationDir:path.resolve(dirname,'migrations-sqlite')}):postgresAdapter({pool:{connectionString:databaseURI},push:process.env.NODE_ENV!=='production',migrationDir:path.resolve(dirname,'migrations')}),
  sharp,cors:{origins,headers:['If-None-Match']},csrf:origins,
  upload:{limits:{fileSize:150*1024*1024}},
})
