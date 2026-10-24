import type { Category } from '../types';

export const MAX_SOURCE_LENGTH = 50_000;
export type Evidence = { origin: 'source' | 'missing' | 'conflict' | 'suggestion' | 'user' | 'external'; quote: string; path?: string };
export type Provenance = Record<string, Evidence>;
export type DraftItem = {
  title: string; category: Category; description: string; address: string;
  period: string; time: string; optional: boolean; booked: boolean;
  kind: 'activity' | 'stay' | 'transfer' | 'suggestion' | 'alternative';
  coordinates: [number, number] | null;
  checkIn: string; checkOut: string;
  departure: string; arrival: string; toCity: string;
  mode: 'train' | 'plane' | 'bus' | 'car' | 'other';
  reference: string; excluded: boolean; evidence: Provenance;
};
export type DraftDay = { title: string; date: string; items: DraftItem[]; evidence: Provenance };
export type DraftCity = { name: string; days: DraftDay[]; evidence: Provenance };
export type PlanningDraft = {
  version: 1; title: string; cities: DraftCity[]; notes: string[]; evidence: Provenance;
};
export type ImportSession = {
  version: 1; id: string; scope: string; source: string; draft: PlanningDraft | null;
  keepSource: boolean; departureDate: string; currency: string; timezone: string;
  committedId: string | null;
  reviewedQuotes?: string[];
  sourceOrigin?: import('./document-contract.ts').DocumentOrigin;
  structuredSource?: import('./structured.ts').StructuredSource;
  preparedTrip?: import('../types').StoredState;
};
