import { MAX_SOURCE_LENGTH } from './types.ts';

// Bound bytes before allocating a buffer; the text limit is checked after UTF-8 decoding.
export const MAX_PLANNING_FILE_BYTES = MAX_SOURCE_LENGTH * 4;
export const PLANNING_FILE_ACCEPT = '.txt,.md,.markdown,.pdf,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const planningFileErrors = {
  format: 'Choisis un fichier texte ou Markdown (.txt, .md, .markdown). Pour un PDF ou Word, copie le texte du planning ici.',
  size: 'Ce fichier dépasse 200 Ko. Choisis un fichier plus petit ; ton texte actuel est conservé.',
  encoding: 'Ce fichier n’est pas un texte UTF-8 lisible. Enregistre-le en UTF-8 puis réessaie ; ton texte actuel est conservé.',
  binary: 'Ce fichier contient des données binaires. Choisis un fichier texte ou Markdown ; ton texte actuel est conservé.',
  empty: 'Ce fichier ne contient pas de texte. Ton texte actuel est conservé.',
  length: 'Ce fichier dépasse 50 000 caractères. Réduis-le puis réessaie ; rien n’a été tronqué.',
  read: 'Lecture du fichier impossible. Ton texte actuel est conservé.',
} as const;

export class PlanningFileError extends Error {
  readonly code: keyof typeof planningFileErrors;
  constructor(code: keyof typeof planningFileErrors) {
    super(planningFileErrors[code]); this.name = 'PlanningFileError'; this.code = code;
  }
}

export async function readPlanningFile(file: Pick<File, 'name' | 'size' | 'arrayBuffer'>): Promise<string> {
  if (!/\.(?:txt|md|markdown)$/i.test(file.name)) throw new PlanningFileError('format');
  if (file.size > MAX_PLANNING_FILE_BYTES) throw new PlanningFileError('size');
  let buffer: ArrayBuffer;
  try { buffer = await file.arrayBuffer(); } catch { throw new PlanningFileError('read'); }
  if (buffer.byteLength > MAX_PLANNING_FILE_BYTES) throw new PlanningFileError('size');
  let source: string;
  try { source = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(buffer); }
  catch { throw new PlanningFileError('encoding'); }
  // Reject renamed PDF/Office/ZIP files and controls, rather than importing corrupt text.
  const hasBinaryControls = [...source].some(character => {
    const code = character.codePointAt(0)!;
    return (code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127;
  });
  if (source.startsWith('%PDF-') || hasBinaryControls) throw new PlanningFileError('binary');
  if (!source.trim()) throw new PlanningFileError('empty');
  if (source.length > MAX_SOURCE_LENGTH) throw new PlanningFileError('length');
  return source;
}

export async function readPlanningSource(file: Pick<File, 'name' | 'size' | 'arrayBuffer'>, signal?: AbortSignal): Promise<import('./document-contract.ts').DocumentResult> {
  if (/\.(?:pdf|docx|doc|docm)$/i.test(file.name)) {
    const { readPlanningDocument } = await import('./documents.ts');
    return readPlanningDocument(file, signal);
  }
  return { source: await readPlanningFile(file) };
}
