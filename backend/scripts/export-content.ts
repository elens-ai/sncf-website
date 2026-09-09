/** Export the same published snapshot used by the runtime; useful as a static deployment fallback. */
import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import {getPayload} from 'payload'
import config from '../src/payload.config'
import {getSnapshot} from '../src/cms/snapshot'
const payload=await getPayload({config})
try{
  const snapshot=await getSnapshot(payload)
  const target=path.resolve(process.env.EXPORT_OUT_FILE||'../public/cms-content.json')
  await fs.mkdir(path.dirname(target),{recursive:true})
  await fs.writeFile(target,JSON.stringify(snapshot))
  console.log(`Exported published content ${snapshot.version} to ${target}`)
}finally{await payload.destroy()}
