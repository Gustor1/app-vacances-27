import { MAX_SOURCE_LENGTH } from './types.ts';

// All binary extraction limits live here. Text/Markdown retain their existing contract.
export const DOCUMENT_LIMITS = Object.freeze({ bytes: 10 * 1024 * 1024, pages: 50, text: MAX_SOURCE_LENGTH,
  zipEntries: 1000, expandedBytes: 20 * 1024 * 1024, xmlBytes: 2 * 1024 * 1024, timeoutMs: 20_000 });
export const documentErrors = {
  format: 'Format non supporté ou extension incorrecte. Choisis un PDF texte ou un DOCX, sans macros.',
  size: 'Le document dépasse 10 Mo. Le texte précédent est conservé.',
  pages: 'Le PDF dépasse 50 pages. Rien n’a été tronqué.',
  length: 'Le texte extrait dépasse 50 000 caractères. Rien n’a été tronqué.',
  empty: 'Aucun texte extractible : ce document peut être un scan. L’OCR n’est pas disponible.',
  protected: 'Ce PDF est protégé par un mot de passe. Fournis une copie texte non protégée.',
  corrupt: 'Document corrompu ou structure non supportée. Le texte précédent est conservé.',
  zip: 'Archive Word excessive ou non supportée : 1 000 entrées, 20 Mo décompressés, 2 Mo par XML maximum.',
  timeout: 'Extraction trop longue (20 secondes maximum). Le texte précédent est conservé.',
  cancelled: 'Extraction annulée. Le texte précédent est conservé.',
  unavailable: 'Module de lecture indisponible. Ouvre Détours en ligne et attends sa préparation hors ligne, puis réessaie.',
} as const;
export type DocumentErrorCode = keyof typeof documentErrors;
export class DocumentError extends Error {
  readonly code: DocumentErrorCode;
  constructor(code: DocumentErrorCode) { super(documentErrors[code]); this.name = 'DocumentError'; this.code = code; }
}
export type DocumentOrigin = { kind: 'pdf' | 'docx'; name: string; originalText: string; pages?: number };
export type DocumentResult = { source: string; origin?: DocumentOrigin };
export function checkExtractedText(text: string): string {
  if (text.length > DOCUMENT_LIMITS.text) throw new DocumentError('length');
  if (!text.trim()) throw new DocumentError('empty');
  return text;
}
