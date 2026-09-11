/** Single-flight cache; explicit invalidation on publication and a short cross-process TTL. */
let generation = 0
const entries = new Map<string,{expires:number,generation:number,value:unknown}>()
const pending = new Map<string,Promise<unknown>>()
export const invalidateContent = () => { generation++; entries.clear(); pending.clear() }
export async function cached<T>(key:string,loader:()=>Promise<T>,ttl=15000):Promise<T> {
  const entry=entries.get(key)
  if(entry && entry.expires>Date.now() && entry.generation===generation) return entry.value as T
  const running=pending.get(key); if(running) return running as Promise<T>
  const started=generation
  const promise=loader().then(value=>{if(started===generation)entries.set(key,{expires:Date.now()+ttl,generation:started,value});return value}).finally(()=>{if(pending.get(key)===promise)pending.delete(key)})
  pending.set(key,promise); return promise
}
