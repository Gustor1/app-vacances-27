import { useContext, useEffect, useRef, useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useLocale } from '../i18n';
import { validCurrency } from '../lib';
import { journeyExpenseSummary, positiveAmount, realDate } from '../practical-utils';
import { applyMissingConversions, conversionFor, currencyDigits, fetchExchangeRate, freezeLegacyConversions, roundMoney } from '../money';
import type { ExchangeRate, Expense, StoredState } from '../types';
import { EditButton, EditInput, EditSelect, ReadOnlyContext, SharedFieldsContext } from './EditControls';
import CurrencyConverter from './CurrencyConverter';
import { useMoneyPreferences } from '../hooks/useMoneyPreferences';
import { useExchangeRates } from '../hooks/useExchangeRates';
import { liveExpenseSummary, pairKey, RATE_MAX_AGE } from '../live-rates';

const categories: Record<Expense['category'], string> = { food: 'Repas', transport: 'Transport', hotel: 'Hébergement', visit: 'Visites', shopping: 'Achats', other: 'Autre' };
export default function TripBudget({ state, onChange, notify }: { state: StoredState; onChange: (updater: (prev: StoredState) => StoredState) => void; notify: (message: string) => void }) {
  const { t, dateLocale } = useLocale();
  const reference = state.journey?.currency || 'CNY';
  const rates = state.exchangeRates || (state.cnyPerEuro ? { EUR: state.cnyPerEuro } : {});
  const summary = journeyExpenseSummary(state.expenses || [], reference, rates);
  const budgetCurrency = state.budgetCurrency || reference;
  const budgetQuote = conversionFor({ currency: budgetCurrency, conversions: state.budgetConversions }, reference, rates);
  const budget = state.budget === undefined ? undefined : budgetCurrency === reference ? state.budget : budgetQuote ? roundMoney(state.budget * budgetQuote.rate, reference) : undefined;
  const personal = useMoneyPreferences();
  const [converterFrom,setConverterFrom] = useState(reference);
  const [converterTo,setConverterTo] = useState(personal.currency || (reference==='EUR'?'USD':'EUR'));
  const [converterAmount,setConverterAmount] = useState('100');
  const [expenseCurrency,setExpenseCurrency] = useState(reference);
  const readOnly=useContext(ReadOnlyContext), fields=useContext(SharedFieldsContext);
  const writable=!readOnly&&(!fields||fields.includes('budget'));
  useEffect(()=>{if(personal.currency)setConverterTo(personal.currency);},[personal.currency]);
  const pairs: [string,string][] = [[converterFrom,converterTo],[expenseCurrency,reference]];
  for (const expense of state.expenses||[]) {
    if (!conversionFor(expense,reference,rates)) pairs.push([expense.currency,reference]);
    if (personal.currency) pairs.push([expense.currency,personal.currency]);
  }
  const live=useExchangeRates(pairs);
  const personalSummary=personal.currency?liveExpenseSummary(state.expenses||[],personal.currency,live.quotes):undefined;
  useEffect(()=>{
    if(!writable)return;
    const missing=(state.expenses||[]).filter(expense=>expense.currency!==reference&&!conversionFor(expense,reference,rates));
    const available=[...new Set(missing.map(expense=>expense.currency))].filter(currency=>{
      const quote=live.quotes[pairKey(currency,reference)];return quote&&Date.now()-quote.fetchedAt<RATE_MAX_AGE;
    });
    if(!available.length)return;
    onChange(previous=>{
      if(previous.journey?.currency!==reference)return previous;
      let next=previous;
      for(const currency of available){const {rate,date,source}=live.quotes[pairKey(currency,reference)];next=applyMissingConversions(next,currency,{rate,date,source});}
      return next;
    });
  },[live.quotes,state.expenses,reference,writable,onChange]);
  const [rateCurrency, setRateCurrency] = useState(reference === 'EUR' ? 'USD' : 'EUR');
  const [rateText, setRateText] = useState(''), [rateDate, setRateDate] = useState('');
  const [rateSource, setRateSource] = useState<ExchangeRate['source']>('manual');
  const [settingsError, setSettingsError] = useState(''), [expenseError, setExpenseError] = useState('');
  const [busy, setBusy] = useState(false), [removeId, setRemoveId] = useState<string | null>(null);
  const request = useRef(0);
  useEffect(() => {
    request.current++; setBusy(false); setSettingsError('');
    const quote = state.rateQuotes?.[rateCurrency];
    setRateText(String(quote?.rate || rates[rateCurrency] || ''));
    setRateDate(quote?.date || new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: state.journey?.timezone || 'UTC' }).format(new Date()));
    setRateSource(quote?.source || 'manual');
    return () => { request.current++; };
  }, [reference, rateCurrency]);
  const money = (amount: number, currency: string) => new Intl.NumberFormat(dateLocale, { style: 'currency', currency, currencyDisplay: 'code' }).format(amount);
  const date = (value: string) => realDate(value) ? new Intl.DateTimeFormat(dateLocale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value + 'T12:00:00Z')) : t('Date inconnue (ancien taux)');
  const sourceLabel = (source: ExchangeRate['source']) => t(source === 'frankfurter' ? 'Frankfurter · taux de référence' : source === 'legacy' ? 'Ancien taux' : 'Taux manuel');
  const quoteLabel = (currency: string, quote: ExchangeRate) => `1 ${currency} = ${quote.rate} ${reference} · ${date(quote.date)} · ${sourceLabel(quote.source)}`;
  async function retrieveRate() {
    if (!validCurrency(rateCurrency) || rateCurrency === reference) { setSettingsError(t('Choisis une devise à convertir différente de la devise de référence.')); return; }
    const generation = ++request.current;
    setBusy(true); setSettingsError('');
    try {
      const quote = await fetchExchangeRate(rateCurrency, reference);
      if (generation !== request.current) return;
      setRateText(String(quote.rate)); setRateDate(quote.date); setRateSource(quote.source);
    } catch {
      if (generation === request.current) setSettingsError(t('Taux indisponible. Saisis un taux manuel daté ou réessaie avec Internet. Le total reste partiel.'));
    } finally { if (generation === request.current) setBusy(false); }
  }
  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget), budgetText = String(data.get('budget') || '').trim();
    const amount = budgetText ? positiveAmount(budgetText) : undefined;
    const rate = rateText.trim() ? positiveAmount(rateText) : undefined;
    if ((budgetText && !amount) || (rateText.trim() && !rate)) { setSettingsError(t('Le taux et le budget doivent être des nombres supérieurs à zéro, ou laissés vides.')); return; }
    if (amount !== undefined && Math.abs(roundMoney(amount, reference) - amount) > Number.EPSILON * amount * 4) { setSettingsError(t('Respecte le nombre de décimales de la devise : {digits}.', { digits: currencyDigits(reference) })); return; }
    if (!validCurrency(rateCurrency) || rateCurrency === reference || (rate && !realDate(rateDate))) { setSettingsError(t('Vérifie la devise à convertir et la date du taux.')); return; }
    const quote: ExchangeRate | undefined = rate ? { rate, date: rateDate, source: rateSource } : undefined;
    onChange(previous => {
      if (previous.journey?.currency !== reference) return previous;
      let next = freezeLegacyConversions(previous);
      const exchangeRates = { ...next.exchangeRates }, rateQuotes = { ...next.rateQuotes };
      if (quote) { exchangeRates[rateCurrency] = quote.rate; rateQuotes[rateCurrency] = quote; }
      else { delete exchangeRates[rateCurrency]; delete rateQuotes[rateCurrency]; }
      // A blank field must not erase an objective kept in a previous reference currency.
      const keepPrevious = !budgetText && (previous.budgetCurrency || reference) !== reference;
      next = { ...next, exchangeRates, rateQuotes, ...(keepPrevious ? {} : { budget: amount, budgetCurrency: reference, budgetConversions: {} }) };
      return quote ? applyMissingConversions(next, rateCurrency, quote) : next;
    });
    setSettingsError(''); notify(t('Réglages du budget enregistrés.'));
  }
  function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget, data = new FormData(form);
    const amount = positiveAmount(String(data.get('amount') || '')), label = String(data.get('label') || '').trim();
    const currency = String(data.get('currency') || '').trim().toUpperCase(), expenseDate = String(data.get('date') || '');
    if (!amount || !label || !validCurrency(currency) || (expenseDate && !realDate(expenseDate))) { setExpenseError(t('Renseignez un libellé, un montant supérieur à zéro et une date valide si précisée.')); return; }
    if (Math.abs(roundMoney(amount, currency) - amount) > Number.EPSILON * amount * 4 || !Number.isFinite(roundMoney(amount, currency))) { setExpenseError(t('Respecte le nombre de décimales de la devise : {digits}.', { digits: currencyDigits(currency) })); return; }
    const expense: Expense = { id: crypto.randomUUID(), cityId: String(data.get('cityId') || ''), label, amount, currency, category: data.get('category') as Expense['category'], ...(expenseDate ? { date: expenseDate } : {}) };
    onChange(previous => {
      if (previous.journey?.currency !== reference) return previous;
      const savedQuote = previous.rateQuotes?.[currency];
      const currentQuote = live.quotes[pairKey(currency,reference)];
      const quote = savedQuote?.source==='manual' ? savedQuote : currentQuote || savedQuote;
      return { ...previous, expenses: [...previous.expenses || [], { ...expense, conversions: currency !== reference && quote?.date ? { [reference]: { rate:quote.rate,date:quote.date,source:quote.source } } : {} }] };
    });
    form.reset(); setExpenseCurrency(reference); setExpenseError(''); notify(t('Dépense ajoutée.'));
  }
  return <div className="practical-budget">
    <div className="panel practical-card"><h3>{t('Mes dépenses')}</h3>
      <div className="practical-totals">{Object.entries(summary.totals).map(([currency, amount]) => <strong key={currency}>{Number.isFinite(amount) ? money(amount, currency) : t('Total trop élevé')}</strong>)}</div>
      <p>{t(summary.total === undefined ? 'Total partiel en {currency} :' : 'Total en {currency} :', { currency: reference })} <strong>{summary.partial === undefined || !Number.isFinite(summary.partial) ? t('Total trop élevé') : money(summary.partial, reference)}</strong></p>
      {!!summary.missing.length && <p role="status">{t('Taux manquants : {currencies}. Les montants restent séparés.', { currencies: summary.missing.join(', ') })}</p>}
      <div className="personal-expense-total"><p className="eyebrow">{t('Dans ma devise')}</p>{personalSummary&&personal.currency?<><strong className="personal-total-value">{personalSummary.partial!==undefined?money(personalSummary.partial,personal.currency):'—'}</strong><p>{t(personalSummary.total===undefined?'Estimation partielle au taux actuel':'Équivalent au taux actuel')}</p>{!!personalSummary.missing.length&&<p role="status">{t('Taux manquants : {currencies}. Les montants restent séparés.',{currencies:personalSummary.missing.join(', ')})}</p>}{personalSummary.dates.length>0&&<small>{t('Taux du {date}',{date:personalSummary.dates.map(date).join(' · ')})}</small>}<p className="practical-muted">{t('Cet équivalent suit tes dépenses et les derniers taux. Les montants enregistrés restent inchangés.')}</p></>:<p>{t('Choisis ton pays ou ta devise dans le convertisseur pour voir le total chez toi.')}</p>}</div>
      {state.budget !== undefined && <p>{t('Objectif :')} {budget !== undefined && Number.isFinite(budget) ? money(budget, reference) : money(state.budget, budgetCurrency)}{budgetCurrency !== reference && <> · {t('Montant d’origine :')} {money(state.budget, budgetCurrency)}{budgetQuote && <small className="budget-conversion">{quoteLabel(budgetCurrency, budgetQuote)}</small>}{budget === undefined && <small className="budget-conversion">{t('Conversion du budget indisponible. Renseigne le taux de {currency}.', { currency: budgetCurrency })}</small>}</>}{budget !== undefined && Number.isFinite(budget) && summary.total !== undefined && <> · <strong>{t(summary.total > budget ? 'Dépassement' : 'Restant')} : {money(Math.abs(budget - summary.total), reference)}</strong></>}</p>}
    </div>
    <CurrencyConverter preferences={personal} from={converterFrom} to={converterTo} amount={converterAmount} quote={live.quotes[pairKey(converterFrom,converterTo)]} loading={live.loading} unavailable={live.unavailable} onFrom={setConverterFrom} onTo={setConverterTo} onAmount={setConverterAmount} onSwap={()=>{setConverterFrom(converterTo);setConverterTo(converterFrom);}} onRefresh={()=>void live.refresh()}/>
    <form className="panel practical-card" onSubmit={saveSettings} key={`${reference}-${state.budgetCurrency}-${state.budget}`}>
      <h3>{t('Mon budget et mon taux')}</h3>
      <label className="field">{t('Objectif de budget ({currency})', { currency: reference })}<EditInput category="budget" name="budget" inputMode="decimal" placeholder={t('Facultatif')} defaultValue={budgetCurrency === reference ? state.budget ?? '' : ''}/></label>
      {budgetCurrency !== reference && state.budget !== undefined && <p>{t('Ton ancien objectif reste en {currency}. Renseigne un nouvel objectif pour le remplacer.', { currency: budgetCurrency })}</p>}
      <label className="field">{t('Devise à convertir')}<EditInput category="budget" list="expense-currencies" value={rateCurrency} onChange={event => setRateCurrency(event.target.value.toUpperCase())} maxLength={3} required/></label>
      <label className="field">{t('1 unité de cette devise = combien de {currency} ?', { currency: reference })}<EditInput category="budget" name="rate" inputMode="decimal" value={rateText} onChange={event => { request.current++; setBusy(false); setRateText(event.target.value); setRateSource('manual'); }}/></label>
      <label className="field">{t('Date du taux')}<EditInput category="budget" type="date" value={rateDate} required={!!rateText} onChange={event => {request.current++;setBusy(false);setRateDate(event.target.value);setRateSource('manual');}}/></label>
      <p className="practical-muted">{sourceLabel(rateSource)}</p>
      <EditButton category="budget" className="btn btn-secondary" type="button" disabled={busy || !navigator.onLine} onClick={()=>void retrieveRate()}>{t(busy ? 'Recherche du taux…' : 'Proposer le taux du jour')}</EditButton>
      <p className="practical-muted">{t('Le taux est figé pour chaque dépense. Enregistrer convertit uniquement les dépenses sans taux ; les anciennes conversions restent intactes.')}</p>
      {Object.entries(state.rateQuotes || {}).map(([currency, quote])=><p key={currency}>{quoteLabel(currency, quote)}</p>)}
      {settingsError && <p role="alert" className="practical-error">{settingsError}</p>}
      <EditButton category="budget" className="btn btn-primary" disabled={busy}>{t('Enregistrer les réglages')}</EditButton>
    </form>
    <form className="panel practical-card" onSubmit={addExpense}><h3>{t('Ajouter une dépense')}</h3>
      <label className="field">{t('Libellé')}<EditInput category="budget" name="label" required maxLength={200} placeholder={t('Ex. déjeuner')}/></label>
      <div className="practical-form-row"><label className="field">{t('Montant')}<EditInput category="budget" name="amount" inputMode="decimal" required placeholder={t('Ex. 45,50')}/></label><label className="field">{t('Devise')}<EditInput category="budget" name="currency" required maxLength={3} list="expense-currencies" value={expenseCurrency} onChange={event=>setExpenseCurrency(event.target.value.toUpperCase())}/></label></div>
      {expenseCurrency!==reference&&<p className="practical-muted">{t(live.quotes[pairKey(expenseCurrency,reference)]?'La conversion sera enregistrée automatiquement avec le taux affiché et sa date.':'Le taux est recherché automatiquement. Sans taux disponible, la dépense reste conservée et le total est partiel.')}</p>}
      <datalist id="expense-currencies">{Intl.supportedValuesOf('currency').map(code=><option key={code} value={code}/>)}</datalist>
      <div className="practical-form-row"><label className="field">{t('Ville')}<EditSelect category="budget" name="cityId"><option value="">{t('Tout le voyage')}</option>{state.cities.map(city=><option key={city.id} value={city.id}>{city.name}</option>)}</EditSelect></label><label className="field">{t('Catégorie')}<EditSelect category="budget" name="category">{Object.entries(categories).map(([key,label])=><option key={key} value={key}>{t(label)}</option>)}</EditSelect></label></div>
      <label className="field">{t('Date (facultative)')}<EditInput category="budget" name="date" type="date"/></label>
      {expenseError&&<p role="alert" className="practical-error">{expenseError}</p>}
      <EditButton category="budget" className="btn btn-primary"><Plus size={16}/>{t('Ajouter la dépense')}</EditButton>
    </form>
    <div className="panel practical-card"><h3>{t('Les dépenses du voyage')}</h3>{!state.expenses?.length&&<p className="muted">{t('Aucune dépense pour le moment.')}</p>}
      {(state.expenses || []).map(expense=>{
        const quote = conversionFor(expense, reference, rates);
        const converted = quote ? roundMoney(expense.amount * quote.rate, reference) : undefined;
        const personalQuote=live.quotes[pairKey(expense.currency,personal.currency)];
        const personalAmount=personal.currency?(expense.currency===personal.currency?expense.amount:personalQuote?roundMoney(expense.amount*personalQuote.rate,personal.currency):undefined):undefined;
        return <div className="practical-expense" key={expense.id}><div><strong>{expense.label}</strong><p>{expense.cityId ? state.cities.find(city=>city.id===expense.cityId)?.name : t('Tout le voyage')} · {t(categories[expense.category])}{expense.date ? ` · ${date(expense.date)}` : ''}</p><small className="budget-conversion">{expense.currency !== reference && (quote ? `${Number.isFinite(converted) ? money(converted!,reference) : t('Total trop élevé')} · ${quoteLabel(expense.currency,quote)}` : t('Conversion en {currency} indisponible', {currency:reference}))}</small>{personal.currency&&<small className="budget-conversion personal-expense-conversion">{personalAmount!==undefined&&Number.isFinite(personalAmount)?t('Dans ma devise : {amount}',{amount:money(personalAmount,personal.currency)}):t('Conversion en {currency} indisponible',{currency:personal.currency})}{personalQuote&&<> · {t('Taux du {date}',{date:date(personalQuote.date)})}</>}</small>}</div><strong>{money(expense.amount,expense.currency)}</strong>
          {removeId===expense.id ? <div><EditButton category="budget" className="btn btn-secondary" onClick={()=>{onChange(previous=>({...previous,expenses:previous.expenses?.filter(item=>item.id!==expense.id)}));setRemoveId(null);}}>{t('Supprimer')}</EditButton><button className="text-btn" onClick={()=>setRemoveId(null)}>{t('Annuler')}</button></div> : <EditButton category="budget" className="icon-btn" aria-label={t('Supprimer {name}',{name:expense.label})} onClick={()=>setRemoveId(expense.id)}><Trash2 size={16}/></EditButton>}
        </div>;
      })}
    </div>
  </div>;
}
