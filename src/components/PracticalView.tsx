import { EditInput, EditTextarea, EditButton } from './EditControls';
import { useLocale } from '../i18n';
import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Copy, MapPin, Plus, Trash2 } from 'lucide-react';
import { mergeChanges } from '../persistence';
import { amapLink } from '../lib';
import { realDate } from '../practical-utils';
import TripBudget from './TripBudget';
import type { Stay, StoredState } from '../types';
import './PracticalView.css';
import { useMapPreferences } from '../MapPreferences';
import { preferredMapCity } from '../map-preferences';


type Props = { state: StoredState; onChange: (updater: (prev: StoredState) => StoredState) => void; notify: (message: string) => void };
const tabs = ['Hébergements', 'Budget', 'Dans ma valise', 'Phrases utiles'];
const suggestions = ['Passeport et copies', 'Billets et réservations hors ligne', 'Assurance et contacts utiles', 'Téléphone et chargeur', 'Batterie externe conforme aux vols', 'Adaptateur de prise', 'Médicaments personnels', 'Chaussures de marche', 'Veste de pluie', 'Protection solaire', 'Moyens de paiement'];

const emptyStay = (cityId: string): Stay => ({ cityId, name: '', chineseName: '', address: '', checkIn: '', checkOut: '', notes: '' });

export default function PracticalView({ state, onChange, notify }: Props) {
  const { t, dateLocale } = useLocale();
  const { provider } = useMapPreferences();
  const displayDate = (value: string) => realDate(value) ? new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`)) : value;
  const [tab, setTab] = useState(0);
  const [stayDraft, setStayDraft] = useState<Stay | null>(null);
  const [stayBase,setStayBase]=useState<Stay|null>(null);
  const [stayError, setStayError] = useState('');
  const [deletePacking, setDeletePacking] = useState<string | null>(null);
  const [packingLabel, setPackingLabel] = useState('');
  const [shownPhrase, setShownPhrase] = useState<number | null>(null);
  const phrases = state.phrases || [];
  const [phraseError,setPhraseError] = useState('');
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); notify(t("Texte copié.")); }
    catch { notify(t("Copie indisponible : sélectionnez le texte affiché pour le copier.")); }
  }
  function keyTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : undefined;
    if (next !== undefined) { event.preventDefault(); setTab(next); document.getElementById(`practical-tab-${next}`)?.focus(); }
  }
  function saveStay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stayDraft) return;
    if (!stayDraft.name.trim()) { setStayError("Renseignez le nom de l’hébergement."); return; }
    if ((stayDraft.checkIn && !realDate(stayDraft.checkIn)) || (stayDraft.checkOut && !realDate(stayDraft.checkOut))) { setStayError("Vérifiez les dates du séjour."); return; }
    if (stayDraft.checkIn && stayDraft.checkOut && stayDraft.checkOut < stayDraft.checkIn) { setStayError("La date de départ doit suivre ou correspondre à la date d’arrivée."); return; }
    const saved = { ...stayDraft, name: stayDraft.name.trim(), chineseName: stayDraft.chineseName.trim(), address: stayDraft.address.trim(), notes: stayDraft.notes.trim() };
    onChange(prev => ({ ...prev, stays: [...(prev.stays ?? []).filter(stay => stay.cityId !== saved.cityId), stayBase ? mergeChanges(stayBase,saved,(prev.stays || []).find(stay=>stay.cityId===saved.cityId) || saved) : saved] }));
    setStayDraft(null); setStayError(''); notify(t("Hébergement enregistré."));
  }
  function addPhrase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();const form=event.currentTarget,data=new FormData(form);
    const meaning=String(data.get('meaning') || '').trim(), local=String(data.get('local') || '').trim();
    if (!meaning || !local) {setPhraseError(t('Renseigne les deux textes.'));return;}
    onChange(prev => ({...prev,phrases:[...(prev.phrases || []),{id:crypto.randomUUID(),category:'Personnel',meaning,local,pronunciation:String(data.get('pronunciation') || '').trim()}]}));
    form.reset();setPhraseError('');notify(t('Phrase ajoutée.'));
  }
  return <section className="practical-view">
    <div className="section-header"><div><div className="eyebrow">{t("Votre compagnon de voyage")}</div><h2>{t("Pratique")}</h2><p className="practical-muted">{t("Adresses, dépenses et essentiels à garder sous la main.")}</p></div></div>
    <div className="practical-tabs" role="tablist" aria-label={t("Outils pratiques")}>{tabs.map((label, index) => <button key={label} id={`practical-tab-${index}`} role="tab" aria-selected={tab === index} aria-controls={`practical-panel-${index}`} tabIndex={tab === index ? 0 : -1} onClick={() => setTab(index)} onKeyDown={event => keyTab(event, index)}>{t(label)}</button>)}</div>
    <div id={`practical-panel-${tab}`} role="tabpanel" aria-labelledby={`practical-tab-${tab}`} tabIndex={0}>
      {tab === 0 && <div className="practical-grid">{state.cities.length === 0 && <p>{t("Ajoutez une ville dans le planning pour renseigner votre hébergement.")}</p>}{state.cities.map(city => {
        const stay = state.stays?.find(item => item.cityId === city.id);
        return <article className="panel practical-card" key={city.id}><h3>{city.name} <span>{city.chineseName}</span></h3>{stayDraft?.cityId === city.id ? <form onSubmit={saveStay}>
          <label className="field">{t("Nom de l’hébergement")}<EditInput required maxLength={200} value={stayDraft.name} onChange={e => setStayDraft({ ...stayDraft, name: e.target.value })} /></label>
          <label className="field">{t("Nom local (facultatif)")}<EditInput maxLength={200} value={stayDraft.chineseName} onChange={e => setStayDraft({ ...stayDraft, chineseName: e.target.value })} /></label>
          <label className="field">{t("Adresse")}<EditInput maxLength={500} value={stayDraft.address} onChange={e => setStayDraft({ ...stayDraft, address: e.target.value })} /></label>
          <div className="practical-form-row"><label className="field">{t("Arrivée")}<EditInput type="date" value={stayDraft.checkIn} onChange={e => setStayDraft({ ...stayDraft, checkIn: e.target.value })} /></label><label className="field">{t("Départ")}<EditInput type="date" min={stayDraft.checkIn || undefined} value={stayDraft.checkOut} onChange={e => setStayDraft({ ...stayDraft, checkOut: e.target.value })} /></label></div>
          <label className="field">{t("Notes et référence de réservation")}<EditTextarea category="notes" rows={3} maxLength={4000} value={stayDraft.notes} onChange={e => setStayDraft({ ...stayDraft, notes: e.target.value })} /></label>
          {stayError && <p className="practical-error" role="alert">{t(stayError)}</p>}<div className="practical-actions"><EditButton className="btn btn-primary" type="submit">{t("Enregistrer")}</EditButton><button className="btn btn-secondary" type="button" onClick={() => { setStayDraft(null); setStayError(''); }}>{t("Annuler")}</button></div>
        </form> : <>{stay ? <><h4>{stay.name}</h4>{stay.chineseName && <p className="practical-chinese">{stay.chineseName}</p>}{stay.address && <p className="practical-address">{stay.address}</p>}{(stay.checkIn || stay.checkOut) && <p>{t("Arrivée :")} {stay.checkIn ? displayDate(stay.checkIn) : t("à préciser")} · {t("Départ :")} {stay.checkOut ? displayDate(stay.checkOut) : t("à préciser")}</p>}{stay.notes && <p className="practical-notes">{stay.notes}</p>}<div className="practical-actions"><a className="btn btn-secondary" target="_blank" rel="noopener noreferrer" href={amapLink(preferredMapCity(city,provider),{title:stay.name,chineseName:stay.chineseName,address:stay.address})}><MapPin size={16} aria-hidden="true" />{provider === "google" ? "Google Maps" : "Amap"}<span className="sr-only">{t(" — nouvel onglet")}</span></a><button className="btn btn-secondary" onClick={() => void copy([city.chineseName || city.name, stay.chineseName || stay.name, stay.address].filter(Boolean).join('\n'))}><Copy size={16} aria-hidden="true" />{t("Copier l’adresse")}</button></div></> : <p className="practical-muted">{t("Votre adresse pour cette étape reste à compléter.")}</p>}<EditButton className="btn btn-secondary" onClick={() => { setStayBase(stay ? {...stay} : null);setStayDraft(stay ? { ...stay } : emptyStay(city.id)); setStayError(''); }}>{stay ? t("Modifier") : t("Ajouter un hébergement")}</EditButton></>}
        </article>;
      })}</div>}
      {tab === 1 && <TripBudget state={state} onChange={onChange} notify={notify}/>}
      {tab === 2 && <div className="panel practical-card"><h3>{t("Dans ma valise")}</h3><p className="practical-muted">{t("{ready} / {total} essentiels prêts.", { ready: (state.packing ?? []).filter(item => item.packed).length, total: state.packing?.length ?? 0 })}</p>{state.packing === undefined && <EditButton category="preparation" className="btn btn-secondary" onClick={() => onChange(prev => prev.packing === undefined ? { ...prev, packing: suggestions.map(label => ({ id: crypto.randomUUID(), label: t(label), packed: false })) } : prev)}>{t("Commencer avec les essentiels suggérés")}</EditButton>}<form className="practical-packing-add" onSubmit={event => { event.preventDefault(); const label = packingLabel.trim(); if (!label) return; onChange(prev => ({ ...prev, packing: [...(prev.packing ?? []), { id: crypto.randomUUID(), label, packed: false }] })); setPackingLabel(''); }}><label className="field">{t("Ajouter un essentiel")}<EditInput category="preparation" value={packingLabel} maxLength={200} required onChange={e => setPackingLabel(e.target.value)} placeholder={t("Ex. lunettes de soleil")} /></label><EditButton category="preparation" className="btn btn-primary"><Plus size={16} aria-hidden="true" />{t("Ajouter")}</EditButton></form><ul className="practical-list">{(state.packing ?? []).map(item => <li key={item.id}><label className={`practical-packing-check${item.packed ? ' is-packed' : ''}`}><EditInput category="preparation" type="checkbox" checked={item.packed} onChange={() => onChange(prev => ({ ...prev, packing: (prev.packing ?? []).map(current => current.id === item.id ? { ...current, packed: !current.packed } : current) }))} /><span>{item.label}</span></label>{deletePacking === item.id ? <div className="practical-actions practical-confirm"><p>{t("Retirer cet essentiel ?")}</p><EditButton category="preparation" className="btn btn-secondary" onClick={() => { onChange(prev => ({ ...prev, packing: (prev.packing ?? []).filter(current => current.id !== item.id) })); setDeletePacking(null); }}>{t("Retirer")}</EditButton><button className="btn btn-secondary" onClick={() => setDeletePacking(null)}>{t("Annuler")}</button></div> : <EditButton category="preparation" className="btn btn-secondary" aria-label={t("Retirer {label}", { label: item.label })} onClick={() => setDeletePacking(item.id)}><Trash2 size={16} aria-hidden="true" /></EditButton>}</li>)}</ul>{state.packing?.length === 0 && <p className="practical-muted">{t("Votre liste est vide. Ajoutez vos propres essentiels.")}</p>}</div>}
      {tab === 3 && <><p className="practical-muted practical-phrase-intro">{t("Ces phrases restent disponibles hors ligne une fois l’application chargée. Montrez les caractères à votre interlocuteur.")}</p>{!phrases.length && <p className="muted">{t('Ajoute les mots utiles pour ce voyage.')}</p>}<div className="practical-grid">{phrases.map((phrase, index) => <article className={`panel practical-card practical-phrase${shownPhrase === index ? ' is-large' : ''}`} key={phrase.id}><span className="eyebrow">{t(phrase.category)}</span><h3>{phrase.id.startsWith('china-phrase-') ? t(phrase.meaning) : phrase.meaning}</h3><p className="practical-chinese">{phrase.local}</p><p>{phrase.pronunciation}</p><div className="practical-actions"><button className="btn btn-secondary" aria-expanded={shownPhrase === index} onClick={() => setShownPhrase(shownPhrase === index ? null : index)}>{shownPhrase === index ? t("Réduire") : t("Afficher en grand")}</button><button className="btn btn-secondary" onClick={() => void copy(phrase.local)}><Copy size={16} aria-hidden="true" />{t("Copier")}</button></div></article>)}</div><form className="panel practical-card practical-phrase-add" onSubmit={addPhrase}><h3>{t('Ajouter une phrase')}</h3><label className="field">{t('Signification')}<EditInput category="preparation" name="meaning" required maxLength={500}/></label><label className="field">{t('Phrase locale')}<EditInput category="preparation" name="local" required maxLength={500}/></label><label className="field">{t('Prononciation (facultative)')}<EditInput category="preparation" name="pronunciation" maxLength={500}/></label>{phraseError && <p role="alert">{phraseError}</p>}<EditButton category="preparation" className="btn btn-primary"><Plus size={16}/>{t('Ajouter')}</EditButton></form></>}
    </div>
  </section>;
}
