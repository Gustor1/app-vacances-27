import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { extractDocx, wordXmlToText } from '../src/planning-import/document-docx.ts';
import { DOCUMENT_LIMITS, checkExtractedText } from '../src/planning-import/document-contract.ts';
import { createSession, saveSession, loadSession } from '../src/planning-import/persistence.ts';
import { externalPlanningPrompt } from '../src/planning-import/external-prompt.ts';
import { translate } from '../src/locale-utils.ts';
import { documentErrors } from '../src/planning-import/document-contract.ts';
import { parsePlanning } from '../src/planning-import/parser.ts';
const fixture = async name => new Uint8Array(await readFile(new URL('./fixtures/planning/documents/'+name,import.meta.url)));
test('real DOCX preserves headings, list items, table cells, Unicode and link text without following links',async()=>{
 const source=extractDocx(await fixture('lists-table.docx'));
 assert.match(source,/# Escale fictive/);assert.match(source,/- 09:00 : Musée rouge/);assert.match(source,/\| 14:00 \| Jardin bleu \|/);assert.match(source,/备注/);
 assert.ok(!source.includes('https://'));assert.ok(!source.includes('<w:'));
 const draft=parsePlanning(source);assert.equal(draft.cities[0].name,'Albi');assert.deepEqual(draft.cities[0].days[0].items.map(item=>item.title),['Musée rouge','Jardin bleu','Texte du lien']);
});
test('real excessive, forged, active, fake and entity packages reject without truncation',async()=>{
 for(const [name,code] of [['long.docx','length'],['zip-bomb.docx','zip'],['entries.docx','zip'],['active.docx','format'],['entity.docx','corrupt'],['forged-size.docx','zip']]) { const bytes=await fixture(name);assert.throws(()=>extractDocx(bytes),{code}); }
});
test('XML cannot expand entities; depth is bounded; text limit is UTF-16 without truncation',()=>{
 assert.throws(()=>wordXmlToText('<!DOCTYPE a><a/>'),{code:'corrupt'});
 assert.throws(()=>wordXmlToText('<a>'.repeat(101)+'x'+'</a>'.repeat(101)),{code:'zip'});
 assert.equal(checkExtractedText('x'.repeat(DOCUMENT_LIMITS.text)).length,50_000);assert.throws(()=>checkExtractedText('😀'.repeat(25_001)),{code:'length'});
});
test('old and corrected document drafts round-trip in scope, preserving exact original extraction and no binary',()=>{
 const map=new Map(),storage={getItem:key=>map.get(key)||null,setItem:(key,val)=>map.set(key,val)};
 const old=createSession('local','typed source');saveSession(storage,old);assert.deepEqual(loadSession(storage,'local'),old);
 const session={...old,source:'edited source',sourceOrigin:{kind:'pdf',name:'fictional.pdf',originalText:'original extraction',pages:2}};
 saveSession(storage,session);assert.deepEqual(loadSession(storage,'local'),session);assert.throws(()=>loadSession(storage,'other'));
 assert.throws(()=>saveSession(storage,{...session,sourceOrigin:{...session.sourceOrigin,binary:'unwanted'}}));
 assert.throws(()=>saveSession(storage,{...session,sourceOrigin:{...session.sourceOrigin,pages:51}}));
});
test('external templates are static, localized, and document errors have four interface languages',()=>{
 for(const language of ['fr','en','zh-CN','es']) {
  const prompt=externalPlanningPrompt(language);assert.ok(prompt.includes('# '));assert.ok(prompt.includes('1'));assert.ok(!prompt.includes('localStorage'));
  for(const message of Object.values(documentErrors)) { assert.ok(translate(message,language));if(language!=='fr') assert.notEqual(translate(message,language),message); }
 }
});
