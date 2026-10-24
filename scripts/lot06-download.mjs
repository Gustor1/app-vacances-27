import { mkdir, readFile, writeFile, rename, stat } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname, sep } from 'node:path';

const destination = resolve(process.argv[2] || '../detours-lot06-tools/model');
if (destination === process.cwd() || destination.startsWith(process.cwd() + sep)) throw Error('Model must stay outside repository');
const revision = '58ca03a5e7b354b480b1a82b34bde8dc7b854cc0';
const metadata = await fetch(`https://huggingface.co/api/models/onnx-community/Qwen3-0.6B-ONNX/revision/${revision}?blobs=true`, { signal: AbortSignal.timeout(30000) }).then(r => { if (!r.ok) throw Error(`Metadata ${r.status}`); return r.json(); });
const names = ['config.json', 'generation_config.json', 'tokenizer.json', 'tokenizer_config.json', 'special_tokens_map.json', 'added_tokens.json', 'chat_template.jinja', 'merges.txt', 'vocab.json', 'onnx/model_quantized.onnx'];
const files = names.map(name => { const row = metadata.siblings.find(f => f.rfilename === name); if (!row) throw Error(name); return row; });
console.log(JSON.stringify({ revision, destination, totalBytes: files.reduce((n,f) => n+f.size,0), files: names }));
await mkdir(destination, { recursive: true });
const started = performance.now(), rows = [];
for (const file of files) {
  const target = resolve(destination, file.rfilename);
  await mkdir(dirname(target), { recursive: true });
  let cached = false;
  try { cached = (await stat(target)).size === file.size; } catch { /* absent */ }
  if (!cached) {
    const response = await fetch(`https://huggingface.co/onnx-community/Qwen3-0.6B-ONNX/resolve/${revision}/${file.rfilename}`, { signal: AbortSignal.timeout(300000) });
    if (!response.ok) throw Error(`${file.rfilename}: HTTP ${response.status}`);
    await pipeline(Readable.fromWeb(response.body), createWriteStream(target + '.partial'));
    await rename(target + '.partial', target);
  }
  const bytes = await readFile(target), sha256 = createHash('sha256').update(bytes).digest('hex');
  if (bytes.length !== file.size || (file.lfs && sha256 !== file.lfs.sha256)) throw Error(`Integrity: ${file.rfilename}`);
  // Non-LFS files use Git blob object hashes, not raw SHA-1.
  if (!file.lfs && createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex') !== file.blobId) throw Error(`Blob integrity: ${file.rfilename}`);
  rows.push({ name:file.rfilename, bytes:bytes.length, sha256, cached });
  console.log(file.rfilename + ' verified');
}
await writeFile(resolve(destination, '../download.json'), JSON.stringify({ revision, seconds:(performance.now()-started)/1000, totalBytes:rows.reduce((n,f)=>n+f.bytes,0), files:rows }, null, 2)+'\n');
