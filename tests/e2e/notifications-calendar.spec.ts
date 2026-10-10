import { test, expect } from '@playwright/test';
import type { Download, Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { archive, blankTrip } from '../../src/journeys';
import { translate } from '../../src/locale-utils';
import type { Language } from '../../src/locale-utils';

const labels = {
  fr: { options: 'Options du calendrier', export: 'Exporter le calendrier', scope: 'Contenu à exporter', selection: 'Choisir les activités et transports', alarms: 'Inclure des alarmes (peut doubler les rappels Détours)', noZone: 'sans fuseau valide', noTime: 'sans horaire fiable', offset: '60 minutes avant', copy: 'Les changements dans Détours ne sont pas synchronisés automatiquement.' },
  en: { options: 'Calendar options', export: 'Export calendar', scope: 'Export content', selection: 'Choose activities and transfers', alarms: 'Include alarms (may duplicate Détours reminders)', noZone: 'without a valid timezone', noTime: 'without a reliable time', offset: '60 minutes before', copy: 'Changes in Détours are not automatically synchronized.' },
  'zh-CN': { options: '日历选项', export: '导出日历', scope: '导出内容', selection: '选择活动及交通', alarms: '包含提醒（可能与 Détours 提醒重复）', noZone: '缺少有效时区', noTime: '缺少可靠时间', offset: '60 分钟前', copy: 'Détours 中的更改不会自动同步。' },
  es: { options: 'Opciones del calendario', export: 'Exportar calendario', scope: 'Contenido para exportar', selection: 'Elegir actividades y transportes', alarms: 'Incluir alarmas (pueden duplicar los avisos de Détours)', noZone: 'sin zona horaria válida', noTime: 'sin horario fiable', offset: '60 minutos antes', copy: 'Los cambios en Détours no se sincronizan automáticamente.' },
} satisfies Record<Language, Record<string, string>>;

async function downloadCalendar(page: Page, buttonName: string): Promise<string> {
  const [download]: [Download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: buttonName, exact: true }).click(),
  ]).then(([download]) => [download]);
  expect(download.suggestedFilename()).toBe('a-l-est-voyage.ics');
  const path = await download.path();
  expect(path).not.toBeNull();
  return (await readFile(path!, 'utf8')).replace(/\r\n /g, '');
}

for (const language of ['fr', 'en', 'zh-CN', 'es'] as Language[]) test(`Calendrier ${language} : téléchargement, horaires, alarmes, limites et 320 px`, async ({ page }) => {
  const copy = labels[language];
  await page.goto('/');
  const state = blankTrip({ id: 'calendar-e2e', title: 'Test calendrier', timezone: 'Asia/Shanghai' });
  state.cities = [
    { id: 'city', name: 'Shanghai', chineseName: '上海', subtitle: '', color: '#547764', image: '', notes: [], timezone: 'Asia/Shanghai', days: [
      { id: 'day', title: 'Jour calendrier', date: '2027-05-12', steps: [
        { id: 'visit', title: 'Visite horaire', category: 'visit', address: '测试路 20 号', description: '' },
        { id: 'free', title: 'Activité libre', category: 'walk', period: 'matin', description: '' },
      ], preparation: { timings: { visit: { startTime: '09:30', durationMinutes: 45 } } } },
    ] },
    { id: 'unknown', name: 'Sans fuseau', chineseName: '', subtitle: '', color: '#547764', image: '', notes: [], days: [
      { id: 'unknown-day', title: 'Jour sans horaire', date: '2027-05-12', steps: [{ id: 'unknown-visit', title: 'Visite sans horaire', category: 'visit', description: '' }] },
    ] },
  ];
  state.transfers = [{ id: 'transfer', label: 'Trajet horaire', mode: 'train', fromCityId: 'city', toCityId: 'city', departure: '2027-05-12T14:00', arrival: '2027-05-12T15:00', departureTimezone: 'Asia/Shanghai', arrivalTimezone: 'Asia/Shanghai', fromStation: 'Gare départ', toStation: 'Gare arrivée', booked: false, reference: '', notes: '' }];
  await page.evaluate(({ raw, language }) => {
    localStorage.setItem('a-l-est-trip-v2:calendar-e2e', raw);
    localStorage.setItem('a-l-est-preferences-v1', JSON.stringify({ language, theme: 'light' }));
  }, { raw: JSON.stringify(archive(state)), language });
  await page.reload();
  await page.getByRole('button', { name: translate('Ouvrir {title}', language, { title: 'Test calendrier' }), exact: true }).click();
  await page.getByRole('navigation', { name: translate('Navigation principale', language), exact: true }).getByRole('button', { name: translate('Vue d’ensemble', language), exact: true }).click();
  const savedBefore = await page.evaluate(() => localStorage.getItem('a-l-est-trip-v2:calendar-e2e'));
  await expect(page.locator('.overview-calendar-copy')).toContainText(copy.copy);
  const historic = await downloadCalendar(page, `${copy.export} (2)`);
  expect((historic.match(/BEGIN:VEVENT/g) || []).length).toBe(2);
  expect(historic).toContain('DTSTART;VALUE=DATE:20270512');
  expect(historic).not.toContain('BEGIN:VALARM');

  await page.getByText(copy.options, { exact: true }).click();
  await page.getByLabel(copy.scope, { exact: true }).selectOption('timed');
  const alarms = page.getByRole('checkbox', { name: copy.alarms, exact: true });
  await expect(alarms).not.toBeChecked();
  await expect(page.locator('.overview-calendar-options [role="status"]')).toContainText(`2 ${copy.noTime}`);
  await expect(page.locator('.overview-calendar-options [role="status"]')).toContainText(`0 ${copy.noZone}`);
  const timed = await downloadCalendar(page, `${copy.export} (2)`);
  expect(timed).not.toContain('VALUE=DATE'); expect(timed).not.toContain('BEGIN:VALARM');
  expect(timed).toContain('DTSTART:20270512T013000Z'); expect(timed).toContain('DTEND:20270512T021500Z');
  expect(timed).toContain('DTSTART:20270512T060000Z'); expect(timed).toContain('DTEND:20270512T070000Z');
  expect(timed).toContain('kind=step&object=visit'); expect(timed).toContain('kind=transfer&object=transfer');
  expect(timed).not.toContain('SUMMARY:Visite sans horaire'); expect(timed).not.toContain('SUMMARY:Activité libre');
  const originalUids = [...timed.matchAll(/UID:(.*)\r\n/g)].map(match => match[1]);

  await alarms.check();
  await page.getByRole('checkbox', { name: copy.offset, exact: true }).check();
  const withAlarms = await downloadCalendar(page, `${copy.export} (2)`);
  expect((withAlarms.match(/BEGIN:VALARM/g) || []).length).toBe(4);
  expect(withAlarms).toContain('TRIGGER:-PT30M'); expect(withAlarms).toContain('TRIGGER:-PT60M');
  expect([...withAlarms.matchAll(/UID:(.*)\r\n/g)].map(match => match[1])).toEqual(originalUids);

  await page.getByText(copy.selection, { exact: true }).click();
  await page.locator('.overview-calendar-selection').getByRole('checkbox', { name: /Trajet horaire/ }).uncheck();
  const selected = await downloadCalendar(page, `${copy.export} (1)`);
  expect((selected.match(/BEGIN:VEVENT/g) || []).length).toBe(1); expect(selected).not.toContain('SUMMARY:Trajet horaire');
  await page.setViewportSize({ width: 320, height: 1000 });
  const layout = await page.evaluate(() => ({ fits: document.documentElement.scrollWidth <= innerWidth, offenders: Array.from(document.querySelectorAll('.trip-overview input,.trip-overview select,.trip-overview label')).filter(element => element.getBoundingClientRect().right > innerWidth).map(element => element.textContent) }));
  expect(layout.fits, JSON.stringify(layout.offenders)).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('a-l-est-trip-v2:calendar-e2e'))).toBe(savedBefore);
});
