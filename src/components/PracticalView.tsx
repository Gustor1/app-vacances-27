import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { Copy, MapPin, Plus, Trash2 } from 'lucide-react';
import { amapSearch } from '../lib';
import { expenseSummary, positiveAmount, realDate } from '../practical-utils';
import type { Expense, Stay, StoredState } from '../types';
import './PracticalView.css';

type Props = { state: StoredState; onChange: (updater: (prev: StoredState) => StoredState) => void; notify: (message: string) => void };
const tabs = ['Hébergements', 'Budget', 'Dans ma valise', 'Phrases utiles'];
const categories: Record<Expense['category'], string> = { food: 'Repas', transport: 'Transport', hotel: 'Hébergement', visit: 'Visites', shopping: 'Achats', other: 'Autre' };
const suggestions = ['Passeport et copies', 'Billets et réservations hors ligne', 'Assurance et contacts utiles', 'Téléphone et chargeur', 'Batterie externe conforme aux vols', 'Adaptateur de prise', 'Médicaments personnels', 'Chaussures de marche', 'Veste de pluie', 'Protection solaire', 'Moyens de paiement'];
const phrases = [
  { category: 'Restaurant', fr: 'Peu de piment, s’il vous plaît.', zh: '请少放辣椒。', pinyin: 'Qǐng shǎo fàng làjiāo.' },
  { category: 'Restaurant', fr: 'Sans poivre du Sichuan, s’il vous plaît.', zh: '请不要放花椒。', pinyin: 'Qǐng bú yào fàng huājiāo.' },
  { category: 'Restaurant', fr: 'Je ne mange pas de viande.', zh: '我不吃肉。', pinyin: 'Wǒ bù chī ròu.' },
  { category: 'Restaurant', fr: 'L’addition, s’il vous plaît.', zh: '请买单。', pinyin: 'Qǐng mǎidān.' },
  { category: 'Taxi', fr: 'Emmenez-moi à cette adresse, s’il vous plaît.', zh: '请带我去这个地址。', pinyin: 'Qǐng dài wǒ qù zhège dìzhǐ.' },
  { category: 'Taxi', fr: 'Arrêtez-vous ici, s’il vous plaît.', zh: '请在这里停车。', pinyin: 'Qǐng zài zhèlǐ tíngchē.' },
  { category: 'Aide', fr: 'Pouvez-vous m’aider ?', zh: '您能帮我吗？', pinyin: 'Nín néng bāng wǒ ma?' },
  { category: 'Aide', fr: 'J’ai besoin d’un médecin.', zh: '我需要医生。', pinyin: 'Wǒ xūyào yīshēng.' },
  { category: 'Aide', fr: 'Où sont les toilettes ?', zh: '洗手间在哪里？', pinyin: 'Xǐshǒujiān zài nǎlǐ?' },
  { category: 'Aide', fr: 'Merci !', zh: '谢谢！', pinyin: 'Xièxie!' },
];
const money = (value: number, currency: 'CNY' | 'EUR') => new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(value);
const emptyStay = (cityId: string): Stay => ({ cityId, name: '', chineseName: '', address: '', checkIn: '', checkOut: '', notes: '' });

export default function PracticalView({ state, onChange, notify }: Props) {
  const [tab, setTab] = useState(0);
  const [stayDraft, setStayDraft] = useState<Stay | null>(null);
  const [stayError, setStayError] = useState('');
  const [expenseError, setExpenseError] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [deleteExpense, setDeleteExpense] = useState<string | null>(null);
  const [deletePacking, setDeletePacking] = useState<string | null>(null);
  const [packingLabel, setPackingLabel] = useState('');
  const [shownPhrase, setShownPhrase] = useState<number | null>(null);
  const summary = expenseSummary(state.expenses ?? [], state.cnyPerEuro);
  const cityName = (id: string) => state.cities.find(city => city.id === id)?.name ?? 'Ville retirée';
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); notify('Texte copié.'); }
    catch { notify('Copie indisponible : sélectionnez le texte affiché pour le copier.'); }
  }
  function keyTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : undefined;
    if (next !== undefined) { event.preventDefault(); setTab(next); document.getElementById(`practical-tab-${next}`)?.focus(); }
  }
  function saveStay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stayDraft) return;
    if (!stayDraft.name.trim()) { setStayError('Renseignez le nom de l’hébergement.'); return; }
    if ((stayDraft.checkIn && !realDate(stayDraft.checkIn)) || (stayDraft.checkOut && !realDate(stayDraft.checkOut))) { setStayError('Vérifiez les dates du séjour.'); return; }
    if (stayDraft.checkIn && stayDraft.checkOut && stayDraft.checkOut < stayDraft.checkIn) { setStayError('La date de départ doit suivre ou correspondre à la date d’arrivée.'); return; }
    const saved = { ...stayDraft, name: stayDraft.name.trim(), chineseName: stayDraft.chineseName.trim(), address: stayDraft.address.trim(), notes: stayDraft.notes.trim() };
    onChange(prev => ({ ...prev, stays: [...(prev.stays ?? []).filter(stay => stay.cityId !== saved.cityId), saved] }));
    setStayDraft(null); setStayError(''); notify('Hébergement enregistré.');
  }
  function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    const amount = positiveAmount(String(data.get('amount') ?? '')); const label = String(data.get('label') ?? '').trim(); const date = String(data.get('date') ?? '');
    if (!amount || !label || (date && !realDate(date))) { setExpenseError('Renseignez un libellé, un montant supérieur à zéro et une date valide si précisée.'); return; }
    const expense: Expense = { id: crypto.randomUUID(), label, amount, currency: data.get('currency') as Expense['currency'], category: data.get('category') as Expense['category'], cityId: String(data.get('cityId') ?? ''), ...(date ? { date } : {}) };
    onChange(prev => ({ ...prev, expenses: [...(prev.expenses ?? []), expense] })); form.reset(); setExpenseError(''); notify('Dépense ajoutée.');
  }
  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); const rateText = String(data.get('rate') ?? '').trim(); const budgetText = String(data.get('budget') ?? '').trim();
    const rate = rateText ? positiveAmount(rateText) : undefined; const budget = budgetText ? positiveAmount(budgetText) : undefined;
    if ((rateText && rate === undefined) || (budgetText && budget === undefined)) { setSettingsError('Le taux et le budget doivent être des nombres supérieurs à zéro, ou laissés vides.'); return; }
    onChange(prev => ({ ...prev, cnyPerEuro: rate, budgetCny: budget })); setSettingsError(''); notify('Réglages du budget enregistrés.');
  }
  return <section className="practical-view">
    <div className="section-header"><div><div className="eyebrow">Votre compagnon de voyage</div><h2>Pratique</h2><p className="practical-muted">Adresses, dépenses et essentiels à garder sous la main.</p></div></div>
    <div className="practical-tabs" role="tablist" aria-label="Outils pratiques">{tabs.map((label, index) => <button key={label} id={`practical-tab-${index}`} role="tab" aria-selected={tab === index} aria-controls={`practical-panel-${index}`} tabIndex={tab === index ? 0 : -1} onClick={() => setTab(index)} onKeyDown={event => keyTab(event, index)}>{label}</button>)}</div>
    <div id={`practical-panel-${tab}`} role="tabpanel" aria-labelledby={`practical-tab-${tab}`} tabIndex={0}>
      {tab === 0 && <div className="practical-grid">{state.cities.length === 0 && <p>Ajoutez une ville dans le planning pour renseigner votre hébergement.</p>}{state.cities.map(city => {
        const stay = state.stays?.find(item => item.cityId === city.id);
        return <article className="panel practical-card" key={city.id}><h3>{city.name} <span lang="zh">{city.chineseName}</span></h3>{stayDraft?.cityId === city.id ? <form onSubmit={saveStay}>
          <label className="field">Nom de l’hébergement<input required maxLength={200} value={stayDraft.name} onChange={e => setStayDraft({ ...stayDraft, name: e.target.value })} /></label>
          <label className="field">Nom chinois<input lang="zh" maxLength={200} value={stayDraft.chineseName} onChange={e => setStayDraft({ ...stayDraft, chineseName: e.target.value })} /></label>
          <label className="field">Adresse<input maxLength={500} value={stayDraft.address} onChange={e => setStayDraft({ ...stayDraft, address: e.target.value })} /></label>
          <div className="practical-form-row"><label className="field">Arrivée<input type="date" value={stayDraft.checkIn} onChange={e => setStayDraft({ ...stayDraft, checkIn: e.target.value })} /></label><label className="field">Départ<input type="date" min={stayDraft.checkIn || undefined} value={stayDraft.checkOut} onChange={e => setStayDraft({ ...stayDraft, checkOut: e.target.value })} /></label></div>
          <label className="field">Notes et référence de réservation<textarea rows={3} maxLength={4000} value={stayDraft.notes} onChange={e => setStayDraft({ ...stayDraft, notes: e.target.value })} /></label>
          {stayError && <p className="practical-error" role="alert">{stayError}</p>}<div className="practical-actions"><button className="btn btn-primary" type="submit">Enregistrer</button><button className="btn btn-secondary" type="button" onClick={() => { setStayDraft(null); setStayError(''); }}>Annuler</button></div>
        </form> : <>{stay ? <><h4>{stay.name}</h4>{stay.chineseName && <p className="practical-chinese" lang="zh">{stay.chineseName}</p>}{stay.address && <p className="practical-address">{stay.address}</p>}{(stay.checkIn || stay.checkOut) && <p>Arrivée : {stay.checkIn || 'à préciser'} · Départ : {stay.checkOut || 'à préciser'}</p>}{stay.notes && <p className="practical-notes">{stay.notes}</p>}<div className="practical-actions"><a className="btn btn-secondary" target="_blank" rel="noopener noreferrer" href={amapSearch(city.chineseName || city.name, stay.chineseName || stay.name, stay.address)}><MapPin size={16} aria-hidden="true" />Amap<span className="sr-only"> — nouvel onglet</span></a><button className="btn btn-secondary" onClick={() => void copy([city.chineseName || city.name, stay.chineseName || stay.name, stay.address].filter(Boolean).join('\n'))}><Copy size={16} aria-hidden="true" />Copier l’adresse</button></div></> : <p className="practical-muted">Votre adresse pour cette étape reste à compléter.</p>}<button className="btn btn-secondary" onClick={() => { setStayDraft(stay ? { ...stay } : emptyStay(city.id)); setStayError(''); }}>{stay ? 'Modifier' : 'Ajouter un hébergement'}</button></>}
        </article>;
      })}</div>}
      {tab === 1 && <div className="practical-budget">
        <div className="panel practical-card"><h3>Mes dépenses</h3><div className="practical-totals"><strong>{money(summary.totals.CNY, 'CNY')}</strong><strong>{money(summary.totals.EUR, 'EUR')}</strong></div>{summary.totals.EUR > 0 && summary.totalCny === undefined && <p>Renseignez votre taux pour obtenir un total en yuans.</p>}{summary.totalCny !== undefined && <p>Total en yuans : <strong>{money(summary.totalCny, 'CNY')}</strong>{state.cnyPerEuro && summary.totals.EUR > 0 ? ' (conversion au taux renseigné)' : ''}</p>}{state.budgetCny !== undefined && <p>Objectif : {money(state.budgetCny, 'CNY')} · {summary.totalCny !== undefined ? <strong>{summary.totalCny > state.budgetCny ? 'Dépassement' : 'Restant'} : {money(Math.abs(state.budgetCny - summary.totalCny), 'CNY')}</strong> : 'Solde disponible après conversion des euros.'}</p>}</div>
        <form className="panel practical-card" onSubmit={saveSettings} key={`${state.cnyPerEuro}-${state.budgetCny}`}><h3>Mon budget et mon taux</h3><label className="field">Objectif de budget (CNY)<input name="budget" inputMode="decimal" placeholder="Facultatif" defaultValue={state.budgetCny ?? ''} /></label><label className="field">1 euro = combien de yuans ?<input name="rate" inputMode="decimal" placeholder="Votre taux, facultatif" defaultValue={state.cnyPerEuro ?? ''} /></label><p className="practical-muted">Taux manuel : utilisez celui de votre banque ou de votre change. Videz le champ pour retirer le taux.</p>{settingsError && <p role="alert" className="practical-error">{settingsError}</p>}<button className="btn btn-primary">Enregistrer les réglages</button></form>
        <form className="panel practical-card" onSubmit={addExpense}><h3>Ajouter une dépense</h3><label className="field">Libellé<input name="label" required maxLength={200} placeholder="Ex. déjeuner" /></label><div className="practical-form-row"><label className="field">Montant<input name="amount" required inputMode="decimal" placeholder="Ex. 45,50" /></label><label className="field">Devise<select name="currency"><option value="CNY">CNY · yuan</option><option value="EUR">EUR · euro</option></select></label></div><div className="practical-form-row"><label className="field">Ville<select name="cityId"><option value="">Voyage en général</option>{state.cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}</select></label><label className="field">Catégorie<select name="category">{Object.entries(categories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><label className="field">Date (facultative)<input name="date" type="date" /></label>{expenseError && <p className="practical-error" role="alert">{expenseError}</p>}<button className="btn btn-primary"><Plus size={16} aria-hidden="true" />Ajouter la dépense</button></form>
        <div className="panel practical-card"><h3>Historique</h3>{!state.expenses?.length ? <p className="practical-muted">Aucune dépense enregistrée.</p> : <ul className="practical-list">{[...(state.expenses ?? [])].reverse().map(expense => <li key={expense.id}><div><strong>{expense.label}</strong><p className="practical-muted">{expense.cityId ? cityName(expense.cityId) : 'Voyage'} · {categories[expense.category]}{expense.date ? ` · ${expense.date}` : ''}</p><span>{money(expense.amount, expense.currency)}</span></div>{deleteExpense === expense.id ? <div className="practical-actions practical-confirm"><p>Supprimer cette dépense ?</p><button className="btn btn-secondary" onClick={() => { onChange(prev => ({ ...prev, expenses: (prev.expenses ?? []).filter(item => item.id !== expense.id) })); setDeleteExpense(null); notify('Dépense supprimée.'); }}>Supprimer</button><button className="btn btn-secondary" onClick={() => setDeleteExpense(null)}>Annuler</button></div> : <button className="btn btn-secondary" aria-label={`Supprimer la dépense ${expense.label}`} onClick={() => setDeleteExpense(expense.id)}><Trash2 size={16} aria-hidden="true" /></button>}</li>)}</ul>}</div>
      </div>}
      {tab === 2 && <div className="panel practical-card"><h3>Dans ma valise</h3><p className="practical-muted">{(state.packing ?? []).filter(item => item.packed).length} / {state.packing?.length ?? 0} essentiels prêts.</p>{state.packing === undefined && <button className="btn btn-secondary" onClick={() => onChange(prev => prev.packing === undefined ? { ...prev, packing: suggestions.map(label => ({ id: crypto.randomUUID(), label, packed: false })) } : prev)}>Commencer avec les essentiels suggérés</button>}<form className="practical-packing-add" onSubmit={event => { event.preventDefault(); const label = packingLabel.trim(); if (!label) return; onChange(prev => ({ ...prev, packing: [...(prev.packing ?? []), { id: crypto.randomUUID(), label, packed: false }] })); setPackingLabel(''); }}><label className="field">Ajouter un essentiel<input value={packingLabel} maxLength={200} required onChange={e => setPackingLabel(e.target.value)} placeholder="Ex. lunettes de soleil" /></label><button className="btn btn-primary"><Plus size={16} aria-hidden="true" />Ajouter</button></form><ul className="practical-list">{(state.packing ?? []).map(item => <li key={item.id}><label className={`practical-packing-check${item.packed ? ' is-packed' : ''}`}><input type="checkbox" checked={item.packed} onChange={() => onChange(prev => ({ ...prev, packing: (prev.packing ?? []).map(current => current.id === item.id ? { ...current, packed: !current.packed } : current) }))} /><span>{item.label}</span></label>{deletePacking === item.id ? <div className="practical-actions practical-confirm"><p>Retirer cet essentiel ?</p><button className="btn btn-secondary" onClick={() => { onChange(prev => ({ ...prev, packing: (prev.packing ?? []).filter(current => current.id !== item.id) })); setDeletePacking(null); }}>Retirer</button><button className="btn btn-secondary" onClick={() => setDeletePacking(null)}>Annuler</button></div> : <button className="btn btn-secondary" aria-label={`Retirer ${item.label}`} onClick={() => setDeletePacking(item.id)}><Trash2 size={16} aria-hidden="true" /></button>}</li>)}</ul>{state.packing?.length === 0 && <p className="practical-muted">Votre liste est vide. Ajoutez vos propres essentiels.</p>}</div>}
      {tab === 3 && <><p className="practical-muted practical-phrase-intro">Ces phrases restent disponibles hors ligne une fois l’application chargée. Montrez les caractères à votre interlocuteur.</p><div className="practical-grid">{phrases.map((phrase, index) => <article className={`panel practical-card practical-phrase${shownPhrase === index ? ' is-large' : ''}`} key={phrase.zh}><span className="eyebrow">{phrase.category}</span><h3>{phrase.fr}</h3><p className="practical-chinese" lang="zh">{phrase.zh}</p><p>{phrase.pinyin}</p><div className="practical-actions"><button className="btn btn-secondary" aria-expanded={shownPhrase === index} onClick={() => setShownPhrase(shownPhrase === index ? null : index)}>{shownPhrase === index ? 'Réduire' : 'Afficher en grand'}</button><button className="btn btn-secondary" onClick={() => void copy(phrase.zh)}><Copy size={16} aria-hidden="true" />Copier</button></div></article>)}</div></>}
    </div>
  </section>;
}
