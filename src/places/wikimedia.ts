import { coordinates, safeUrl, validPhoto } from './model.ts';
import type { CommonsPhoto, PlaceAssociation, PlaceValues } from './model.ts';

type Row = Record<string, unknown>;
const object = (v: unknown): Row => v && typeof v === 'object' && !Array.isArray(v) ? v as Row : {};
const string = (v: unknown, max = 500): string => typeof v === 'string' ? v.slice(0, max) : '';
export type Candidate = { qid: string; label: string; description: string };
export type PlaceDetails = PlaceAssociation & { description: string };
const endpoint = { wikidata: 'https://www.wikidata.org/w/api.php', commons: 'https://commons.wikimedia.org/w/api.php' };
export const CLIENT = 'Detours/1.0 (https://github.com/Gustor1/app-vacances-27)';
export class WikimediaError extends Error {
  code: 'network' | 'rate' | 'invalid';
  constructor(code: WikimediaError['code']) { super(code); this.code = code; }
}

/** One outstanding request per client, bounded memory cache; nothing private persists. */
export class WikimediaClient {
  private cache = new Map<string, { expires: number; data: unknown }>();
  private active = false;
  private blockedUntil = 0;
  private fetcher: typeof fetch;
  private timeout: number;
  constructor(fetcher: typeof fetch = (...args) => fetch(...args), timeout = 10000) { this.fetcher = fetcher; this.timeout = timeout; }
  async get(wiki: keyof typeof endpoint, params: Record<string, string>, signal: AbortSignal): Promise<unknown> {
    signal.throwIfAborted();
    const url = `${endpoint[wiki]}?${new URLSearchParams({ format: 'json', origin: '*', maxlag: '5', ...params })}`;
    const cached = this.cache.get(url);
    if (cached && cached.expires > Date.now()) return cached.data;
    if (Date.now() < this.blockedUntil) throw new WikimediaError('rate');
    if (this.active) throw new WikimediaError('network');
    this.active = true;
    const deadline = AbortSignal.timeout(this.timeout);
    try {
      const response = await this.fetcher(url, { signal: AbortSignal.any([signal, deadline]), credentials: 'omit', referrerPolicy: 'no-referrer', headers: { 'Api-User-Agent': CLIENT } });
      if (response.status === 429 || response.status === 503) {
        const retry = response.headers.get('Retry-After');
        const seconds = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : retry ? Date.parse(retry) - Date.now() : 60000;
        this.blockedUntil = Date.now() + Math.max(1000, Number.isFinite(seconds) ? seconds : 60000);
        throw new WikimediaError('rate');
      }
      if (!response.ok) throw new WikimediaError('network');
      const raw = await response.text();
      if (raw.length > 2_000_000) throw new WikimediaError('invalid');
      let data: unknown; try { data = JSON.parse(raw); } catch { throw new WikimediaError('invalid'); }
      const error = object(object(data).error);
      if (error.code) {
        if (['maxlag', 'ratelimited'].includes(String(error.code))) { this.blockedUntil = Date.now() + 60000; throw new WikimediaError('rate'); }
        throw new WikimediaError('invalid');
      }
      signal.throwIfAborted();
      if (this.cache.size >= 40) this.cache.delete(this.cache.keys().next().value!);
      this.cache.set(url, { expires: Date.now() + 15 * 60000, data });
      return data;
    } catch (error) { if (signal.aborted) throw signal.reason; if (error instanceof WikimediaError) throw error; throw new WikimediaError('network'); }
    finally { this.active = false; }
  }
  async search(name: string, city: string, country: string, language: string, signal: AbortSignal): Promise<Candidate[]> {
    const search = [name, city, country].map(s => s.trim().slice(0, 100)).filter(Boolean).join(' ');
    if (!name.trim() || !['fr', 'en', 'zh', 'es'].includes(language)) throw new WikimediaError('invalid');
    const data = object(await this.get('wikidata', { action: 'wbsearchentities', search, language, uselang: language, type: 'item', limit: '6' }, signal));
    if (!Array.isArray(data.search)) throw new WikimediaError('invalid');
    // Wikibase matches labels, not arbitrary location descriptions. Widen only an empty query.
    if (!data.search.length && (city.trim() || country.trim())) return this.search(name, '', '', language, signal);
    return data.search.slice(0, 6).map(object).filter(r => /^Q[1-9]\d*$/.test(String(r.id)) && typeof r.label === 'string').map(r => ({ qid: String(r.id), label: string(r.label, 180), description: string(r.description) }));
  }
  async details(qid: string, language: string, signal: AbortSignal): Promise<PlaceDetails> {
    if (!/^Q[1-9]\d*$/.test(qid)) throw new WikimediaError('invalid');
    const data = object(await this.get('wikidata', { action: 'wbgetentities', ids: qid, props: 'labels|descriptions|claims', languages: `${language}|mul|en|zh|fr|es` }, signal));
    const entity = object(object(data.entities)[qid]);
    if (entity.id !== qid || entity.missing !== undefined || !entity.claims || !entity.labels) throw new WikimediaError('invalid');
    const labels = object(entity.labels), claims = object(entity.claims);
    const label = (lang: string) => string(object(labels[lang]).value, 180);
    const claim = (property: string): unknown => {
      const rows = claims[property]; if (!Array.isArray(rows)) return undefined;
      const valid = rows.map(object).filter(r => r.rank !== 'deprecated');
      const row = valid.find(r => r.rank === 'preferred') ?? valid[0];
      return object(object(object(row).mainsnak).datavalue).value;
    };
    const values: PlaceValues = {};
    const title = label(language) || label('mul') || label('en'); if (title) values.title = title;
    // Only explicitly labelled original-script names. No translation inferred from geography.
    if (label('zh')) values.chineseName = label('zh');
    const native = object(claim('P1705'));
    if (typeof native.text === 'string' && native.text.trim() && native.text.length <= 180 && typeof native.language === 'string') values.localName = native.text;
    const site = claim('P856'); if (safeUrl(site)) values.website = site;
    const coord = object(claim('P625'));
    if (coord.globe === 'http://www.wikidata.org/entity/Q2' && coordinates([coord.latitude, coord.longitude])) values.coordinates = [coord.latitude as number, coord.longitude as number];
    const image = claim('P18');
    if (typeof image === 'string' && image.length <= 240) {
      // A photo failure must not discard usable entity data.
      try { values.photo = await this.photo(image, signal); } catch (error) { if (signal.aborted) throw error; }
    }
    signal.throwIfAborted();
    return { qid, source: `https://www.wikidata.org/wiki/${qid}`, checkedAt: new Date().toISOString(), values, description: string(object(object(entity.descriptions)[language]).value) };
  }
  async photo(filename: string, signal: AbortSignal): Promise<CommonsPhoto | undefined> {
    const data = object(await this.get('commons', { action: 'query', titles: `File:${filename}`, prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '640', iiurlheight: '1280', iiextmetadatalanguage: 'en' }, signal));
    const page = object(Object.values(object(object(data.query).pages))[0]);
    const info = object(Array.isArray(page.imageinfo) ? page.imageinfo[0] : undefined), meta = object(info.extmetadata);
    const value = (key: string) => string(object(meta[key]).value, 2000);
    // Convert metadata markup to plain text. It is never inserted as HTML.
    const author = value('Artist').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
    const license = value('LicenseShortName');
    const licenseUrl = value('LicenseUrl').replace(/^http:/, 'https:').replace(/\/?$/, '/');
    const photo = { url: string(info.thumburl, 2048), source: string(info.descriptionurl, 2048), author, license, licenseUrl, width: info.thumbwidth, height: info.thumbheight, mime: string(info.mime) };
    return validPhoto(photo) && !value('Restrictions') ? photo : undefined;
  }
}
export const wikimedia = new WikimediaClient();
