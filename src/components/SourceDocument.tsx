import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocale } from '../i18n';
import { safeExternalUrl } from '../lib';
import type { TravelDocument } from '../types';

export default function SourceDocument({ kind, document }: { kind?: 'planning' | 'bonus'; document?: TravelDocument }) {
  const { t } = useLocale();
  const [text, setText] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => { if (document) {setText(document.content);return;} setText(''); setFailed(false); const controller = new AbortController(); fetch(`/documents/${kind === 'planning' ? 'planning' : 'bonus'}-original.md`, { signal: controller.signal }).then(r => { if (!r.ok) throw new Error(); return r.text(); }).then(setText).catch(() => { if (!controller.signal.aborted) setFailed(true); }); return () => controller.abort(); }, [kind,document]);
  let structuredSource = false;
  if (document) { try { structuredSource = JSON.parse(document.content).format === 'detours-planning'; } catch { /* Ordinary text/Markdown document. */ } }
  return <div className="source-document"><div className="notice">{t(structuredSource ? "Fichier IA externe — original personnel non vérifié" : "Document d’origine conservé intégralement. Les horaires, adresses et distinctions cités restent à vérifier avant le départ.")}</div><>{structuredSource ? <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{text}</pre> : <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ img: ({ src, alt }) => document ? <a href={safeExternalUrl(typeof src === 'string' ? src : undefined)} target="_blank" rel="noreferrer">{alt || (typeof src === 'string' ? src : '')}</a> : <img src={src} alt={alt || ''}/>, a: ({ href, children }) => <a href={safeExternalUrl(href)} target="_blank" rel="noreferrer">{children}</a> }}>{text || t(failed ? 'Document indisponible. Réessaie avec une connexion Internet.' : 'Chargement…')}</ReactMarkdown>}</></div>;
}
