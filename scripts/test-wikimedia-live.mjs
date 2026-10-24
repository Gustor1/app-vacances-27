import { writeFile, mkdir } from 'node:fs/promises';
import { WikimediaClient, CLIENT } from '../src/places/wikimedia.ts';
if (process.env.DETOURS_ALLOW_NETWORK !== '1') { console.log('NON EXÉCUTÉ : DETOURS_ALLOW_NETWORK=1 requis.'); process.exit(2); }
const requests = [];
const client = new WikimediaClient(async (url, options) => {
  const started = Date.now();
  try {
    const response = await fetch(url, { ...options, headers: { ...options.headers, 'User-Agent': CLIENT, Origin: 'http://localhost:5173' } });
    requests.push({ url: String(url), status: response.status, cors: response.headers.get('access-control-allow-origin'), milliseconds: Date.now() - started });
    return response;
  } catch (error) { requests.push({ url: String(url), error: String(error), milliseconds: Date.now() - started }); throw error; }
}, 20000);
const outcomes = [];
for (const [name, city, country, qid, language] of [['Tour Eiffel', 'Paris', 'France', 'Q243', 'fr'], ['故宫', '北京', '中国', 'Q80290', 'zh']]) {
  const signal = AbortSignal.timeout(60000);
  const result = { name, city, country, qid, language };
  try { result.candidates = await client.search(name, city, country, language, signal); } catch (error) { result.searchError = String(error); }
  try { result.details = await client.details(qid, language, signal); } catch (error) { result.detailsError = String(error); }
  outcomes.push(result);
}
const report = { date: new Date().toISOString(), kind: 'real-public-GETs-not-browser-CORS-proof', requests, outcomes };
await mkdir('docs/development/lot-04-lieux', { recursive: true });
await writeFile('docs/development/lot-04-lieux/network.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (outcomes.some(r => r.searchError || r.detailsError)) process.exitCode = 1;
