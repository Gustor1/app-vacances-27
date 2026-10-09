export function performanceCollection(size) {
  const count = size === 'small' ? 3 : 60;
  const cities = size === 'small' ? 1 : 4;
  const days = size === 'small' ? 3 : 8;
  const steps = size === 'small' ? 4 : 8;
  const records = Array.from({ length: count }, (_, trip) => {
    const id = `l8-${trip}`;
    const state = { version: 1, departureDate: '', favorites: [], done: [], bookings: [], notes: {}, bonusCatalog: [],
      journey: { id, title: `Carnet mesure ${trip + 1}`, destinations: 'France', countries: ['FR'], description: 'Données fictives de mesure.', cover: `/l8-cover/${trip}.svg`, currency: 'EUR', timezone: 'Europe/Paris', source: 'custom', followsCatalog: false },
      cities: Array.from({ length: cities }, (_, city) => ({ id: `${id}-c${city}`, name: `Ville ${city + 1}`, chineseName: '', subtitle: 'Étape fictive', color: '#547764', image: '/travel-landscape.svg', notes: [], coordinates: [48.85 + city * .1, 2.35 + city * .1],
        days: Array.from({ length: days }, (_, day) => ({ id: `${id}-c${city}-d${day}`, title: `Journée ${day + 1}`, steps: Array.from({ length: steps }, (_, step) => ({ id: `${id}-c${city}-d${day}-s${step}`, title: `Promenade ${step + 1}`, description: 'Lieu fictif pour mesurer recherche et saisie.', category: 'visit', coordinates: [48.85 + city * .1 + step * .001, 2.35 + city * .1 + step * .001] })) })) })) };
    return [`a-l-est-trip-v2:${id}`, JSON.stringify({ version: 2, scope: 'trip', id, state })];
  });
  const bytes = records.reduce((n, [key, raw]) => n + Buffer.byteLength(key + raw), 0);
  if (bytes > 5_000_000) throw new Error('Fixture exceeds the collection import limit');
  return { size, trips: count, cities: count * cities, days: count * cities * days, steps: count * cities * days * steps, bytes, records };
}
