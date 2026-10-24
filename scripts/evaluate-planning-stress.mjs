import { createHash } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { parsePlanning } from '../src/planning-import/parser.ts';
import { unstructuredNotes, validateDraft } from '../src/planning-import/draft.ts';
import { readPlanningFile } from '../src/planning-import/files.ts';
import { stressCorpus } from '../tests/fixtures/planning/stress-corpus.mjs';

const normalize = value => value.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const escaped = value => String(value).replace(/\|/g,'\\|').replace(/\r?\n/g,' ');

export function assessPlanning(entry, draft) {
  const expected = entry.expected.flatMap((city,ci) => city.days.flatMap((day,di) => day.items.map(item => ({ ...item,ci,di,city:city.name }))));
  const actual = draft.cities.flatMap((city,ci) => city.days.flatMap((day,di) => day.items.map((item,ii) => ({ ...item,ci,di,ii,city:city.name,key:`${ci}:${di}:${ii}` }))));
  const expectedShape = entry.expected.map(city => [normalize(city.name), city.days.map(day => day.date)]);
  const actualShape = draft.cities.map(city => [normalize(city.name), city.days.map(day => day.date)]);
  const shapeCorrect = same(expectedShape, actualShape);
  const used = new Set();
  const details = expected.map(wanted => {
    const candidates = actual.filter(item => normalize(item.title).includes(normalize(wanted.anchor)));
    // Two expected activities in one title are a merge, never two successful extractions.
    const separate = candidates.filter(item => !used.has(item.key) && new Set(expected.filter(other => normalize(item.title).includes(normalize(other.anchor))).map(other => normalize(other.anchor))).size === 1);
    const matched = separate.find(item => item.ci === wanted.ci && item.di === wanted.di) || separate[0];
    if (matched) used.add(matched.key);
    const assigned = !!matched && matched.ci === wanted.ci && matched.di === wanted.di && normalize(matched.city) === normalize(wanted.city);
    const fieldErrors = [];
    if (matched) {
      for (const field of ['time','period','kind','booked']) {
        const required = field === 'booked' ? wanted.booked ?? false : wanted[field];
        if (required !== undefined && matched[field] !== required) fieldErrors.push({ field, expected:required, actual:matched[field] });
      }
    }
    return { anchor:wanted.anchor, expectedCity:wanted.city, expectedGroup:[wanted.ci,wanted.di], mentioned:candidates.length > 0,
      separate:!!matched, assigned, fieldErrors,
      actual:matched ? { title:matched.title, city:matched.city, group:[matched.ci,matched.di], time:matched.time, period:matched.period, kind:matched.kind, booked:matched.booked } : null,
      mergedInto:!matched && candidates.length ? candidates.map(item => item.title) : [] };
  });
  const unexpected = actual.filter(item => !used.has(item.key)).map(item => ({ title:item.title,city:item.city,group:[item.ci,item.di] }));
  return { expectedDays:entry.expected.reduce((n,c)=>n+c.days.length,0), actualDays:draft.cities.reduce((n,c)=>n+c.days.length,0),
    expectedItems:expected.length, actualItems:actual.length, mentions:details.filter(item=>item.mentioned).length,
    separateItems:details.filter(item=>item.separate).length, assignedItems:details.filter(item=>item.assigned).length,
    fieldErrors:details.reduce((n,item)=>n+item.fieldErrors.length,0), shapeCorrect,
    passed:shapeCorrect && actual.length === expected.length && details.every(item=>item.assigned && !item.fieldErrors.length),
    expectedShape,actualShape,details,unexpected };
}

async function main() {
  const destination = process.argv[2] ? resolve(process.argv[2]) : fileURLToPath(new URL('../docs/development/planning-stress-2026-10-16/',import.meta.url));
  await mkdir(join(destination,'plannings'),{recursive:true});
  const results=[];
  for(const entry of stressCorpus) {
    const filename=`${entry.id}.txt`;
    await writeFile(join(destination,'plannings',filename),entry.source,'utf8');
    // Read the generated document back so the measured source equals the file delivered.
    const bytes=await readFile(join(destination,'plannings',filename));
    const source=await readPlanningFile(new File([bytes],filename));
    const started=performance.now();
    try {
      const draft=parsePlanning(source);validateDraft(draft,source,false,true);
      results.push({id:entry.id,name:entry.name,family:entry.family,note:entry.note,file:`plannings/${filename}`,
        milliseconds:+(performance.now()-started).toFixed(3),...assessPlanning(entry,draft),
        preservedNotes:unstructuredNotes(draft,source),draft,expected:entry.expected});
    } catch(error) {
      results.push({id:entry.id,name:entry.name,family:entry.family,note:entry.note,file:`plannings/${filename}`,passed:false,error:error.message,
        expectedDays:entry.expected.reduce((n,c)=>n+c.days.length,0),expectedItems:entry.expected.reduce((n,c)=>n+c.days.reduce((s,d)=>s+d.items.length,0),0),
        actualDays:0,actualItems:0,mentions:0,separateItems:0,assignedItems:0,fieldErrors:0,expected:entry.expected});
    }
  }
  const summarize=rows=>({cases:rows.length,passed:rows.filter(row=>row.passed).length,errors:rows.filter(row=>row.error).length,
    expectedItems:rows.reduce((n,row)=>n+row.expectedItems,0),separateItems:rows.reduce((n,row)=>n+row.separateItems,0),
    assignedItems:rows.reduce((n,row)=>n+row.assignedItems,0),fieldErrors:rows.reduce((n,row)=>n+row.fieldErrors,0)});
  const byFamily=Object.fromEntries([...new Set(stressCorpus.map(entry=>entry.family))].map(family=>[family,summarize(results.filter(row=>row.family===family))]));
  const report={generatedAt:new Date().toISOString(),revision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
    hashes: { parser:createHash('sha256').update(await readFile(new URL('../src/planning-import/parser.ts',import.meta.url))).digest('hex'), corpus:createHash('sha256').update(JSON.stringify(stressCorpus)).digest('hex') },
    method:'36 fixed synthetic sources with unchanged historical expectations; real local parser execution; no model or mocked extraction.',
    limits:['Purposive stress set, not a representative accuracy estimate.', 'No binary PDF/DOCX/image parsing; case 17 is text after hypothetical PDF extraction.', 'Title-anchor matching tolerates decoration; full semantic fidelity is not measured.', 'Expected dates and source order are checked; ambiguous sources require review.'],
    summary:summarize(results),byFamily,results};
  await writeFile(join(destination,'results.json'),JSON.stringify(report,null,2)+'\n');
  const text=[
    '# Banc d’essai : plannings propres et brouillons',
    '',`Exécution : ${report.generatedAt}. Révision de base : \`${report.revision}\`. Empreinte du parseur : \`${report.hashes.parser}\`. Les 36 sources sont fictives et nouvelles par rapport au corpus de régression précédent.`,
    '',`**${report.summary.passed}/${results.length} plannings conformes à toutes les attentes. ${report.summary.separateItems}/${report.summary.expectedItems} activités retrouvées séparément ; ${report.summary.assignedItems}/${report.summary.expectedItems} au bon emplacement ville/journée. ${report.summary.errors} erreur(s) de parsing.**`,
    '', 'Ces nombres décrivent ce jeu volontairement difficile, pas un taux de précision général. Les sources et attentes ont été écrites avant le premier passage. Les attentes historiques sont conservées. Les modifications éventuelles du parseur sont décrites dans le rapport de contribution associé.',
    '', '## Pistes issues du corpus historique',
    '', 'La reconnaissance actuelle est bonne sur les conventions explicites testées, mais insuffisante pour promettre un import fiable de plannings écrits librement. Le précédent corpus de régression réussi ne démontrait pas cette robustesse.',
    '', '1. Normaliser la présentation : émojis avant les titres (08), citations de courriel (15), séparateurs ASCII (12), noms de ville en minuscules (07).',
    '2. Protéger la structure : répétition du même jour avec date laissée vide dans un tableau (23), jours de semaine (19), mois abrégés (20).',
    '3. Écarter les faux éléments : numéros de page et mots coupés (17), estimation d’hôtel non choisi (33).',
    '4. Traiter explicitement la compréhension difficile : messages compacts (10–14, 28), corrections de dernière minute (16) et alternatives conditionnelles (32). Un modèle éventuel devra être comparé sur ces mêmes attentes et sur un nouveau lot inédit ; sa supériorité n’est pas mesurée ici.',
    '', 'Aucune exception de parsing sur ces 36 sources ne signifie pas absence d’erreur : certains cas produisent un aperçu presque vide ou des activités mal affectées. Les notes conservées permettent de retrouver du texte, mais ne remplacent pas la reconnaissance.',
    '', '## Résultats par famille', '', '| Famille | Plannings conformes | Activités séparées | Bon rattachement |', '| --- | ---: | ---: | ---: |',
    ...Object.entries(byFamily).map(([family,s])=>`| ${family} | ${s.passed}/${s.cases} | ${s.separateItems}/${s.expectedItems} | ${s.assignedItems}/${s.expectedItems} |`),
    '', '## Les fichiers à essayer', '', 'Ouvrir **Créer depuis un planning**, choisir le fichier `.txt`, puis **Reconnaître mon programme**. Tous les fichiers sont UTF-8. Un document contenant du Markdown reste lisible depuis `.txt`. Le JSON détaillé conserve chaque attente, chaque brouillon réel et les écarts.',
    '', '[Résultats détaillés JSON](results.json) · [Archive des 36 plannings](plannings-fictifs.zip)',
    '', '| Cas | Famille | Format | Journées obtenues/attendues | Activités séparées/attendues | Bon rattachement | Conforme |', '| --- | --- | --- | ---: | ---: | ---: | --- |',
    ...results.map(row=>`| [${row.id}](${row.file}) | ${row.family} | ${escaped(row.name)} | ${row.actualDays}/${row.expectedDays} | ${row.separateItems}/${row.expectedItems} | ${row.assignedItems}/${row.expectedItems} | ${row.passed?'Oui':row.error?'Erreur':'Non'} |`),
    '', '## Comment lire le score', '',
    '- Une activité doit être présente dans un titre propre. Un nom seulement conservé dans les notes ne compte pas comme activité reconnue.',
    '- Deux activités fusionnées dans un seul titre ne comptent pas comme deux extractions réussies. Une répétition voulue sur deux jours exige deux éléments distincts.',
    '- Le rattachement vérifie le bloc de ville, le jour et leur ordre. La conformité complète vérifie aussi les dates, les informations explicitement annotées et l’absence d’éléments supplémentaires.',
    '- Une ville ou une année absente doit rester absente. Une approximation horaire ne doit pas devenir une heure exacte. Les notes sauvegardées ne prouvent pas que leur sens a été compris.',
    '- Les cas narratifs, les corrections tardives et les alternatives conditionnelles mesurent un résultat souhaitable. Une demande explicite de clarification serait également sûre, mais le parseur actuel ne produit pas ce dialogue.',
    '', '## Reproduire et limites',
    '', '```powershell', 'node scripts/evaluate-planning-stress.mjs', 'node --test tests/planning-stress-evaluator.test.mjs tests/planning-parser.test.mjs tests/planning-files.test.mjs', '```',
    '', 'La lecture utilise le vrai décodeur de fichiers puis le vrai parseur et son validateur. Les attentes ne proviennent pas de réponses IA simulées. Les cinq tests du score vérifient notamment que les fusions et les mauvais rattachements échouent ; les 58 tests ciblés du score, du parseur historique et des fichiers ont été exécutés avec succès lors de cet audit. Ces 58 tests ne signifient pas que les 36 plannings sont réussis.',
    '', 'Le produit, le serveur et les dépendances sont inchangés. Le gate applicatif complet du tour précédent n’a pas été relancé pour ce seul audit. Pas de nouvel essai navigateur, de modèle, d’OCR, de PDF/DOCX binaire ou de document personnel. Les cas sont courts : ils ne couvrent pas les performances de très longs voyages, tous les dialectes, ni tous les formats possibles.',
    '', '## Écarts observés',
  ];
  for(const row of results.filter(row=>!row.passed)) {
    text.push('',`### ${row.id} — ${row.name}`,'',`[Source fictive](${row.file})`);
    if(row.note) text.push('',row.note);
    if(row.error) {text.push('',`Erreur : ${row.error}`);continue;}
    if(!row.shapeCorrect) text.push('',`Structure attendue : \`${JSON.stringify(row.expectedShape)}\`. Structure obtenue : \`${JSON.stringify(row.actualShape)}\`.`);
    for(const item of row.details.filter(item=>!item.assigned||item.fieldErrors.length)) {
      const reason=!item.separate ? item.mergedInto.length ? `fusionnée dans « ${item.mergedInto.join(' / ')} »` : 'pas retrouvée comme activité séparée' : !item.assigned ? `rattachée à ${item.actual.city || '(ville vide)'}, bloc ${item.actual.group[0]+1}, journée ${item.actual.group[1]+1}` : 'champs incorrects';
      text.push('',`- **${escaped(item.anchor)}** : ${escaped(reason)}${item.fieldErrors.length ? ` ; ${item.fieldErrors.map(e=>`${e.field} attendu ${JSON.stringify(e.expected)}, obtenu ${JSON.stringify(e.actual)}`).join('; ')}`:''}.`);
    }
    if(row.unexpected.length) text.push('',`Éléments supplémentaires ou fusionnés : ${row.unexpected.map(item=>`« ${escaped(item.title)} »`).join(', ')}.`);
  }
  await writeFile(join(destination,'RAPPORT.md'),text.join('\n')+'\n');
  console.log(JSON.stringify({destination,...report.summary,byFamily},null,2));
}

if(process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) await main();
