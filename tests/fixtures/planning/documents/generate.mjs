import { zipSync, strToU8 } from 'fflate';
import { writeFile } from 'node:fs/promises';
const root = new URL('./', import.meta.url);
const contentTypes = '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>';
const p = (text, props = '') => `<w:p>${props}<w:r><w:t>${text}</w:t></w:r></w:p>`;
const body = p('Escale fictive', '<w:pPr><w:pStyle w:val="Heading1"/></w:pPr>') + p('Ville: Albi') + p('Jour 1 - 2027-05-03') + p('09:00 : Musée rouge', '<w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>') +
  '<w:tbl><w:tr><w:tc>'+p('Heure')+'</w:tc><w:tc>'+p('Activité')+'</w:tc></w:tr><w:tr><w:tc>'+p('14:00')+'</w:tc><w:tc>'+p('Jardin bleu')+'</w:tc></w:tr></w:tbl>'+p('备注：未知信息保留。') + '<w:hyperlink r:id="external">'+p('Texte du lien')+'</w:hyperlink>';
const doc = text => strToU8(`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${text}</w:body></w:document>`);
const base = { '[Content_Types].xml':strToU8(contentTypes), 'word/document.xml':doc(body), 'word/_rels/document.xml.rels':strToU8('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="external" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://document-resource.invalid/private" TargetMode="External"/></Relationships>') };
const write = (name, entries) => writeFile(new URL(name, root), zipSync(entries));
await write('lists-table.docx', base);
await write('long.docx', { ...base, 'word/document.xml':doc(p('x'.repeat(50_001))) });
await write('zip-bomb.docx', { ...base, 'word/document.xml':doc(p('x'.repeat(3 * 1024 * 1024))) });
await write('entries.docx', { ...base, ...Object.fromEntries(Array.from({length:1001}, (_,i)=>[`extra/${i}`,strToU8('x')])) });
await write('active.docx', { ...base, 'word/vbaProject.bin':strToU8('fictional macro') });
await write('entity.docx', { ...base, 'word/document.xml':strToU8('<!DOCTYPE x [<!ENTITY e SYSTEM "https://document-resource.invalid/entity">]><x>&e;</x>') });
await writeFile(new URL('fake.docx',root), '%PDF-1.7\nnot a Word document');
const forged = zipSync({ ...base, 'word/document.xml':doc(p('x'.repeat(300_000))) });
// Lie about the expanded size: output guard must stop inflation independently.
for(let at=0;at<forged.length-46;at++) if(new DataView(forged.buffer).getUint32(at,true)===0x02014b50 && new TextDecoder().decode(forged.subarray(at+46,at+46+17))==='word/document.xml') new DataView(forged.buffer).setUint32(at+24,100,true);
await writeFile(new URL('forged-size.docx',root), forged);
