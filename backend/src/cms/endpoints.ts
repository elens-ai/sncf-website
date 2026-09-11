import type { Endpoint } from 'payload'
import { getSnapshot } from './snapshot'
const headers=(version:string,preview=false)=>({'ETag':`"${version}"`,'Cache-Control':preview?'private, no-store':'public, max-age=0, must-revalidate','Access-Control-Expose-Headers':'ETag','Vary':'Origin','X-Content-Type-Options':'nosniff'})
export const endpoints:Endpoint[]=[
  {path:'/site-content',method:'get',handler:async req=>{
    const preview=req.query?.preview==='true'
    if(preview&&!req.user)return Response.json({error:'Sign in to the CMS to preview drafts.'},{status:401,headers:{'Cache-Control':'no-store'}})
    const data=await getSnapshot(req.payload,{preview,req:preview?req:undefined})
    const responseHeaders=headers(data.version,preview)
    if(!preview&&req.headers.get('if-none-match')===`"${data.version}"`)return new Response(null,{status:304,headers:responseHeaders})
    return Response.json(data,{headers:responseHeaders})
  }},
  {path:'/live-stats-feed',method:'get',handler:async req=>{
    const {version,stats}=await getSnapshot(req.payload)
    if(req.headers.get('if-none-match')===`"${version}"`)return new Response(null,{status:304,headers:headers(version)})
    return Response.json({version,stats},{headers:headers(version)})
  }},
]
