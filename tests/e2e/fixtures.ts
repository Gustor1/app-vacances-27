import { test as base, expect } from '@playwright/test';
import { initialCities } from '../../src/data/trip';

/** Existing China journeys use an isolated legacy profile to exercise migration. */
export const test = base.extend<{ legacyProfile: void }>({
  legacyProfile: [async ({ context }, use) => {
    await context.addInitScript(cities => {
      if (!localStorage.getItem('a-l-est-v1') && !Object.keys(localStorage).some(key => key.startsWith('a-l-est-trip-v2:'))) {
        localStorage.setItem('a-l-est-v1', JSON.stringify({version:1,cities,favorites:[],done:[],bookings:[],notes:{},departureDate:''}));
      }
    }, initialCities);
    await use();
  }, { auto: true }],
});
export { expect };
export type { Page } from '@playwright/test';
