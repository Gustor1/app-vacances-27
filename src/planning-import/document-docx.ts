import { Inflate } from 'fflate';
import { SaxesParser } from 'saxes';
import { DOCUMENT_LIMITS as limits, DocumentError, checkExtractedText } from './document-contract.ts';

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Central directory checked before inflation. Stream output is bounded independently
 * of declared ZIP sizes (including forged sizes). Nothing is written to a filesystem. */
export function extractDocx(bytes: Uint8Array): string {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u16 = (at: number) => view.getUint16(at, true), u32 = (at: number) => view.getUint32(at, true);
  let end = bytes.length - 22;
  while (end >= Math.max(0, bytes.length - 65557) && u32(end) !== 0x06054b50) end--;
  if (end < 0 || end < bytes.length - 65557 || end + 22 + u16(end + 20) !== bytes.length) throw new DocumentError('corrupt');
  const count = u16(end + 10);
  if (u16(end + 4) || u16(end + 6) || count !== u16(end + 8) || count > limits.zipEntries || !count) throw new DocumentError('zip');
  let pos = u32(end + 16), total = 0;
  const centralEnd = pos + u32(end + 12);
  if (centralEnd !== end) throw new DocumentError('zip'); // Includes ZIP64 and multi-disk archives.
  const names = new Set<string>(), xml: Record<string, string> = {};
  for (let i = 0; i < count; i++) {
    if (pos + 46 > end || u32(pos) !== 0x02014b50) throw new DocumentError('corrupt');
    const method = u16(pos + 10), compressed = u32(pos + 20), expanded = u32(pos + 24);
    const nameLength = u16(pos + 28), offset = u32(pos + 42);
    const next = pos + 46 + nameLength + u16(pos + 30) + u16(pos + 32);
    if (next > end || offset + 30 > u32(end + 16) || u32(offset) !== 0x04034b50) throw new DocumentError('corrupt');
    const name = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(pos + 46, pos + 46 + nameLength));
    if (names.has(name) || name.includes('..') || name.startsWith('/') || name.includes('\\') || (u16(pos + 8) & 1) || ![0, 8].includes(method) || u16(pos + 34)) throw new DocumentError('zip');
    names.add(name);
    total += expanded;
    if (total > limits.expandedBytes || expanded === 0xffffffff || compressed === 0xffffffff || (name.endsWith('.xml') && expanded > limits.xmlBytes)) throw new DocumentError('zip');
    if (/vbaProject|\.bin$/i.test(name)) throw new DocumentError('format');
    const start = offset + 30 + u16(offset + 26) + u16(offset + 28);
    if (start + compressed > u32(end + 16) || u16(offset + 8) !== method) throw new DocumentError('corrupt');
    if (name === '[Content_Types].xml' || name === 'word/document.xml') {
      const parts: Uint8Array[] = []; let actual = 0;
      const receive = (part: Uint8Array) => {
        actual += part.length;
        if (actual > limits.xmlBytes || actual > expanded) throw new DocumentError('zip');
        parts.push(part.slice());
      };
      if (method === 0) receive(bytes.subarray(start, start + compressed));
      else {
        const inflate = new Inflate(receive);
        for (let at = start; at < start + compressed; at += 1024) inflate.push(bytes.subarray(at, Math.min(at + 1024, start + compressed)), at + 1024 >= start + compressed);
      }
      if (actual !== expanded) throw new DocumentError('corrupt');
      const all = new Uint8Array(actual); let at = 0;
      for (const part of parts) { all.set(part, at); at += part.length; }
      if (crc32(all) !== u32(pos + 16)) throw new DocumentError('corrupt');
      xml[name] = new TextDecoder('utf-8', { fatal: true }).decode(all);
    }
    pos = next;
  }
  if (pos !== centralEnd || !xml['word/document.xml'] || !xml['[Content_Types].xml']?.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml')) throw new DocumentError('format');
  if (/macroEnabled|vbaProject/i.test(xml['[Content_Types].xml'])) throw new DocumentError('format');
  return wordXmlToText(xml['word/document.xml']);
}

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
/** SAX emits text only, never HTML, links, images, fields or external entities. */
export function wordXmlToText(xml: string): string {
  const parser = new SaxesParser({ xmlns: true });
  let output = '', paragraph = '', heading = '', list = false, text = false, depth = 0, nodes = 0, ignored = 0, root = false;
  let cell: string | null = null, cells: string[] = [], firstRow = false;
  const append = (value: string) => { output += value; if (output.length > limits.text) throw new DocumentError('length'); };
  parser.on('doctype', () => { throw new DocumentError('corrupt'); });
  parser.on('opentag', tag => {
    if (++depth > 100 || ++nodes > 100_000) throw new DocumentError('zip');
    if (depth === 1) root = tag.uri === W && tag.local === 'document';
    if (tag.uri !== W) return;
    if (['del', 'instrText'].includes(tag.local)) ignored++;
    if (ignored) return;
    if (tag.local === 'tbl') firstRow = true;
    if (tag.local === 'tr') cells = [];
    if (tag.local === 'tc') cell = '';
    if (tag.local === 'p') { paragraph = ''; heading = ''; list = false; }
    if (tag.local === 'pStyle') { const style = Object.values(tag.attributes).find(a => a.local === 'val')?.value || ''; heading = /^(?:Heading|Titre)([1-6])$/i.exec(style)?.[1] || ''; }
    if (tag.local === 'numPr') list = true;
    if (tag.local === 't') text = true;
    if (tag.local === 'tab') paragraph += '\t';
    if (tag.local === 'br' || tag.local === 'cr') paragraph += '\n';
  });
  parser.on('text', value => { if (text && !ignored) { paragraph += value; if (paragraph.length > limits.text) throw new DocumentError('length'); } });
  parser.on('closetag', tag => {
    if (tag.uri === W) {
      if (['del', 'instrText'].includes(tag.local)) ignored--;
      else if (!ignored) {
        if (tag.local === 't') text = false;
        if (tag.local === 'p' && paragraph) {
          if (cell !== null) cell += (cell ? ' / ' : '') + paragraph;
          else append(`${heading ? '#'.repeat(Number(heading)) + ' ' : list ? '- ' : ''}${paragraph}\n`);
        }
        if (tag.local === 'tc') { cells.push((cell || '').replaceAll('|', '\\|').replaceAll('\n', ' ')); cell = null; }
        if (tag.local === 'tr') {
          append(`| ${cells.join(' | ')} |\n`);
          if (firstRow) { append(`| ${cells.map(() => '---').join(' | ')} |\n`); firstRow = false; }
        }
        if (tag.local === 'tbl') append('\n');
      }
    }
    depth--;
  });
  parser.on('error', () => { throw new DocumentError('corrupt'); });
  parser.write(xml).close();
  if (!root) throw new DocumentError('format');
  return checkExtractedText(output.trim());
}
