import { useState } from 'react';
import { countries, countryName } from '../countries';
import { normalizeSearch } from '../lib';
import { useLocale } from '../i18n';

export default function CountryPicker({ selected, onChange }: { selected: string[]; onChange: (codes: string[]) => void }) {
  const { t, language } = useLocale();
  const [search, setSearch] = useState('');
  const options = countries.map(c => ({ ...c, name: countryName(c.code, language) })).sort((a, b) => a.name.localeCompare(b.name, language));
  const matches = options.filter(c => normalizeSearch(c.name + ' ' + c.code).includes(normalizeSearch(search)));
  return <fieldset className="country-picker"><legend>{t('Pays du voyage')}</legend><p className="muted small">{t('Les pays prévus ne sont pas des visites confirmées.')}</p>
    <input aria-label={t('Rechercher un pays')} placeholder={t('Rechercher un pays')} value={search} onChange={e => setSearch(e.target.value)} />
    <div className="country-selected">{selected.map(code => <button type="button" key={code} onClick={() => onChange(selected.filter(c => c !== code))} aria-label={t('Retirer {country}', { country: countryName(code, language) })}>{countryName(code, language)} ×</button>)}</div>
    <div className="country-options">{matches.map(c => <label key={c.code}><input type="checkbox" checked={selected.includes(c.code)} onChange={e => onChange(e.target.checked ? [...selected, c.code] : selected.filter(code => code !== c.code))} />{c.name}</label>)}</div>
    {!matches.length && <p role="status">{t('Aucun pays trouvé.')}</p>}
  </fieldset>;
}
