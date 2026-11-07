import { mkdir, writeFile } from 'node:fs/promises';
import { importKit, kitPath } from '../src/planning-import/import-kit.ts';
import { PUBLIC_PLANNING_SCHEMA, readStructuredPlanning } from '../src/planning-import/public-contract.ts';
import { MINIMAL_PUBLIC_EXAMPLE, COMPLETE_PUBLIC_EXAMPLE } from '../src/planning-import/public-examples.ts';
for (const language of ['fr','en','zh-CN','es']) {
 const file='public'+kitPath(language);await mkdir(file.slice(0,file.lastIndexOf('/')),{recursive:true});await writeFile(file,importKit(language));
}
for (const [name,value] of [['exemple-minimal.detours.json',MINIMAL_PUBLIC_EXAMPLE],['exemple-complet.detours.json',COMPLETE_PUBLIC_EXAMPLE]]) {
 const text=JSON.stringify(value,null,2);readStructuredPlanning(text);await writeFile('public/import-kit/'+name,text+'\n');
}
await writeFile('public/import-kit/detours-planning-v1.schema.json',JSON.stringify(PUBLIC_PLANNING_SCHEMA,null,2)+'\n');
