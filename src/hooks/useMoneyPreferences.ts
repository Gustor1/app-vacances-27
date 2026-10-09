import { useEffect, useState } from 'react';
import { useCloud } from '../cloud/CloudProvider';
import { suggestedCurrency } from '../money';
import { validCurrency } from '../lib';
import { MONEY_PREFERENCES_KEY, parseMoneyPreferences, type MoneyPreferences } from '../money-preferences';
export function useMoneyPreferences() {
  const {storage}=useCloud();
  const [value,setValue]=useState<MoneyPreferences>(()=>{try{return parseMoneyPreferences(storage.getItem(MONEY_PREFERENCES_KEY));}catch{return {country:'',currency:''};}});
  const [error,setError]=useState(false);
  useEffect(()=>{
    const read=()=>{try{setValue(parseMoneyPreferences(storage.getItem(MONEY_PREFERENCES_KEY)));setError(false);}catch{setError(true);}};
    read();const received=(event:StorageEvent)=>{if(!event.key||event.key===storage.physicalKey(MONEY_PREFERENCES_KEY))read();};
    window.addEventListener('storage',received);window.addEventListener('detours-money-preferences',read);
    return()=>{window.removeEventListener('storage',received);window.removeEventListener('detours-money-preferences',read);};
  },[storage]);
  function save(next:MoneyPreferences){setValue(next);try{storage.setItem(MONEY_PREFERENCES_KEY,JSON.stringify(next));setError(false);window.dispatchEvent(new Event('detours-money-preferences'));}catch{setError(true);}}
  return { ...value,error,
    setCountry:(country:string)=>save({country,currency:country?suggestedCurrency([country])||'':''}),
    setCurrency:(currency:string)=>save({...value,currency:validCurrency(currency)?currency:''}),
  };
}
