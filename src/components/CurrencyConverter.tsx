import { ArrowLeftRight, RefreshCw } from 'lucide-react';
import { useMemo } from 'react';
import { useLocale } from '../i18n';
import { countries, countryName } from '../countries';
import { roundMoney } from '../money';
import type { useMoneyPreferences } from '../hooks/useMoneyPreferences';
import type { LiveQuote } from '../live-rates';

type Props = {
  preferences:ReturnType<typeof useMoneyPreferences>;
  from:string;to:string;amount:string;quote?:LiveQuote;loading:boolean;unavailable:boolean;
  onFrom:(currency:string)=>void;onTo:(currency:string)=>void;onAmount:(amount:string)=>void;onSwap:()=>void;onRefresh:()=>void;
};
export default function CurrencyConverter({preferences,from,to,amount,quote,loading,unavailable,onFrom,onTo,onAmount,onSwap,onRefresh}:Props) {
  const {t,dateLocale,language}=useLocale();
  const choices=useMemo(()=>{const names=new Intl.DisplayNames([dateLocale],{type:'currency'});return Intl.supportedValuesOf('currency').map(code=>({code,label:`${code} · ${names.of(code)||code}`}));},[dateLocale]);
  const countryOptions=useMemo(()=>countries.map(country=>({code:country.code,name:countryName(country.code,language)})).sort((a,b)=>a.name.localeCompare(b.name,language)),[language]);
  const parsed = /^\d+(?:[.,]\d+)?$/.test(amount.trim()) ? Number(amount.replace(',','.')) : NaN;
  const rate=from===to?1:quote?.rate;
  const result=rate===undefined?undefined:roundMoney(parsed*rate,to);
  const money=(value:number,currency:string)=>new Intl.NumberFormat(dateLocale,{style:'currency',currency,currencyDisplay:'code'}).format(value);
  const stamp=quote?new Intl.DateTimeFormat(dateLocale,{dateStyle:'medium',timeZone:'UTC'}).format(new Date(quote.date+'T12:00:00Z')):'';
  return <section className="panel practical-card currency-converter" aria-labelledby="converter-title">
    <div className="currency-heading"><div><p className="eyebrow">{t('Sur place et chez moi')}</p><h3 id="converter-title">{t('Convertisseur de devises')}</h3></div><button type="button" className="icon-btn" aria-label={t('Actualiser les taux')} disabled={loading||!navigator.onLine} onClick={onRefresh}><RefreshCw size={17} className={loading?'currency-refreshing':''}/></button></div>
    <div className="currency-personal"><label className="field">{t('Mon pays')}<select value={preferences.country} onChange={event=>preferences.setCountry(event.target.value)}><option value="">{t('Choisir mon pays')}</option>{countryOptions.map(country=><option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
      <label className="field">{t('Ma devise')}<select value={preferences.currency} onChange={event=>preferences.setCurrency(event.target.value)}><option value="">{t('Choisir ma devise')}</option>{choices.map(({code,label})=><option key={code} value={code}>{label}</option>)}</select></label></div>
    <p className="practical-muted">{t('Ta devise est personnelle. Elle ne change pas la devise du voyage ni celle des autres participants.')}</p>
    {preferences.error&&<p role="status">{t('La devise reste active ici, mais sa sauvegarde est indisponible.')}</p>}
    <label className="field">{t('Montant à convertir')}<input inputMode="decimal" value={amount} onChange={event=>onAmount(event.target.value)}/></label>
    <div className="currency-pair"><label className="field">{t('De')}<select value={from} onChange={event=>onFrom(event.target.value)}>{choices.map(({code,label})=><option key={code} value={code}>{label}</option>)}</select></label><button type="button" className="btn btn-secondary currency-swap" aria-label={t('Inverser les devises')} onClick={onSwap}><ArrowLeftRight size={18}/></button><label className="field">{t('Vers')}<select value={to} onChange={event=>onTo(event.target.value)}>{choices.map(({code,label})=><option key={code} value={code}>{label}</option>)}</select></label></div>
    <output className="currency-result" aria-label={t('Résultat de la conversion')} aria-live="polite">{result!==undefined&&Number.isFinite(result)?money(result,to):'—'}<small>{rate!==undefined?`1 ${from} = ${new Intl.NumberFormat(dateLocale,{maximumFractionDigits:8}).format(rate)} ${to}`:t(loading?'Recherche du taux…':'Conversion indisponible')}</small></output>
    {from!==to&&quote&&<p className="currency-rate-date">{t('Taux du {date}',{date:stamp})} · <a href="https://frankfurter.dev/" target="_blank" rel="noreferrer">Frankfurter</a></p>}
    <p className="practical-muted" role="status">{t(!navigator.onLine?'Hors ligne · derniers taux conservés':unavailable?'Actualisation indisponible · vérifie la date des taux conservés':loading?'Actualisation des taux…':'Taux récupérés automatiquement, actualisés chaque jour par la source.')}</p>
    {amount&&(!Number.isFinite(parsed)||parsed<0)&&<p className="practical-error" role="alert">{t('Saisis un montant positif ou nul.')}</p>}
  </section>;
}
