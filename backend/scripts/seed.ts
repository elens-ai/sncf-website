/** Seeds the CMS from a content file (src/cms/seed.ts explains what is and is not touched).
 *    npm run seed -- [seed/site-content.json] [--fill-missing-settings] [--refresh-labels] [--refresh-figures] [--refresh-photos] */
import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import {getPayload} from 'payload'
import config from '../src/payload.config'
import {runCMSCommand} from './run-cms-command'
import {seedContent} from '../src/cms/seed'
const fillMissingSettings=process.argv.includes('--fill-missing-settings')
const refreshLabels=process.argv.includes('--refresh-labels')
const refreshFigures=process.argv.includes('--refresh-figures')
const refreshPhotos=process.argv.includes('--refresh-photos')
const source=process.argv.slice(2).find(arg=>!arg.startsWith('--'))||process.env.CMS_SEED_FILE||path.resolve('seed/site-content.json')
const seed=JSON.parse(await fs.readFile(source,'utf8'))
const payload=await getPayload({config})
await runCMSCommand(async()=>{
  await seedContent(payload,seed,{fillMissingSettings,refreshLabels,refreshFigures,refreshPhotos})
},async()=>{await payload.destroy()})
