import { useId, useState } from 'react';
import { useLocale } from '../i18n';
import { journeyExpenseSummary } from '../practical-utils';
import type { Expense } from '../types';

const categories: Record<Expense['category'], string> = { food: 'Repas', transport: 'Transport', hotel: 'Hébergement', visit: 'Visites', shopping: 'Achats', other: 'Autre' };
const colors = ['var(--action)', '#629abc', '#b68452', '#a684af', '#c46e79', '#83946f'];

export default function BudgetBreakdown({ expenses, currency, rates }: { expenses: Expense[]; currency: string; rates: Record<string, number> }) {
  const { t, dateLocale } = useLocale();
  const id = useId();
  const [selected, setSelected] = useState<string | null>(null);
  const rows = Object.entries(categories).map(([category, label], index) => ({ category, label, color: colors[index], ...journeyExpenseSummary(expenses.filter(expense => expense.category === category), currency, rates) })).filter(row => row.partial !== undefined && row.partial > 0);
  const total = rows.reduce((sum, row) => sum + row.partial!, 0);
  const hasAmounts = total > 0 && Number.isFinite(total);
  const missing = journeyExpenseSummary(expenses, currency, rates).missing.length > 0;
  const current = rows.find(row => row.category === selected);
  const money = (amount: number) => new Intl.NumberFormat(dateLocale, { style: 'currency', currency, currencyDisplay: 'code' }).format(amount);
  let offset = 0;
  return <section className="budget-breakdown" aria-labelledby={id}>
    <h4 id={id}>{t('Répartition des dépenses')}</h4>
    <div className="budget-breakdown-content"><div className="budget-donut">
      <svg viewBox="0 0 180 180" aria-hidden="true" focusable="false">{!hasAmounts && <circle className="budget-donut-empty" cx="90" cy="90" r="70" fill="none" stroke="var(--line)" strokeWidth="15"/>}{hasAmounts && rows.map(row => {
        const length = row.partial! / total * 100;
        const start = offset; offset += length;
        return <circle key={row.category} cx="90" cy="90" r="70" fill="none" stroke={row.color} strokeWidth={selected === row.category ? 21 : 15} pathLength="100" strokeDasharray={`${Math.max(0, length - .9)} ${100 - Math.max(0, length - .9)}`} strokeDashoffset={-start} className="budget-donut-segment" style={{ opacity: selected && selected !== row.category ? .35 : 1 }}/>;
      })}</svg><div className="budget-donut-value"><strong>{hasAmounts ? money(current?.partial ?? total) : expenses.length ? '—' : money(0)}</strong><span>{hasAmounts ? current ? t(current.label) : t('Total converti') : t(expenses.length ? 'En attente de conversion' : 'Aucune dépense')}</span></div>
    </div>{hasAmounts ? <ul className="budget-donut-legend">{rows.map(row => <li key={row.category}><button type="button" aria-pressed={selected === row.category} onClick={() => setSelected(selected === row.category ? null : row.category)}><span style={{ background: row.color }} aria-hidden="true"/><span>{t(row.label)}</span><strong>{money(row.partial!)}</strong></button></li>)}</ul> : <p className="budget-chart-empty-text">{t(expenses.length ? 'Les dépenses sont conservées. Ajoute les taux manquants pour dessiner leur répartition.' : 'Ajoute ta première dépense : sa répartition apparaîtra ici.')}</p>}</div>
    {missing && <p className="muted small">{t('Le graphique inclut uniquement les montants convertis. Les dépenses sans taux restent dans la liste.')}</p>}
  </section>;
}
