import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
const executable=process.env.DETOURS_DENO_PATH;
if(!executable)throw Error('Set DETOURS_DENO_PATH to a Deno executable installed outside the repository.');
const child=spawn(executable,['test','--allow-env','--node-modules-dir=none','--no-config','--lock',resolve('supabase/functions/notifications/deno.lock'),'--frozen-lockfile',resolve('supabase/functions/notifications/handler_test.ts')],{stdio:'inherit'});
child.once('error',error=>{console.error(error.message);process.exitCode=1;});
child.once('exit',code=>{process.exitCode=code??1;});
