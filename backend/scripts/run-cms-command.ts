/**
 * Payload 3.88 retains a checked-out Postgres client even after destroy().
 * Like Payload's own CLI, one-shot commands explicitly exit after all writes
 * and cleanup complete. Flush output first so piped CI/export logs are intact.
 * This helper is deliberately not used by the long-lived CMS server.
 */
export async function runCMSCommand(action:()=>Promise<void>,cleanup:()=>Promise<void>):Promise<never>{
  let code=0
  try{await action()}catch(error){console.error(error);code=1}
  try{await cleanup()}catch(error){console.error('CMS command cleanup failed:',error);code=1}
  await Promise.all([
    new Promise<void>(resolve=>process.stdout.write('',()=>resolve())),
    new Promise<void>(resolve=>process.stderr.write('',()=>resolve())),
  ])
  process.exit(code)
}
