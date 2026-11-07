import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { prompt } from './lot06-core.mjs';

// Parent termination bounds native execution as well as JS generation.
const base = resolve(process.env.DETOURS_LOT06_TOOLS || '../detours-lot06-tools');
globalThis.fetch = () => { throw Error('Network forbidden during inference'); };
try {
  const { pipeline, env } = await import(pathToFileURL(resolve(base,'node_modules/@huggingface/transformers/src/transformers.js')).href);
  env.allowRemoteModels=false;
  env.allowLocalModels=true;
  env.useFSCache=false;
  const start=performance.now();
  const generator=await pipeline('text-generation',resolve(base,'model'),{device:'cpu',dtype:'q8',local_files_only:true,session_options:{intraOpNumThreads:4,interOpNumThreads:1}});
  process.send({ type:'ready', loadMs:performance.now()-start, memory:process.memoryUsage(), resource:process.resourceUsage() });
  process.on('message',async message=>{
    const start=performance.now();
    try {
      const output=await generator([{role:'system',content:prompt},{role:'user',content:JSON.stringify({source:message.source,uncertainPassages:message.passages || []})}],
        {max_new_tokens:768,do_sample:false,return_full_text:false,tokenizer_encode_kwargs:{enable_thinking:false}});
      process.send({type:'result',id:message.id,raw:output[0].generated_text,ms:performance.now()-start,memory:process.memoryUsage(),resource:process.resourceUsage()});
    } catch(error) { process.send({type:'result',id:message.id,error:String(error),ms:performance.now()-start}); }
  });
} catch(error) { process.send({type:'fatal',error:String(error)}); process.exitCode=1; }
