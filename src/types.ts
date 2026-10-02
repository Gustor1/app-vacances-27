export type Category = 'visit' | 'food' | 'transport' | 'hotel' | 'walk' | 'shopping';
export type Step = { id: string; title: string; chineseName?: string; description: string; category: Category; period?: string; optional?: boolean; booking?: boolean; coordinates?: [number, number]; amapUrl?: string };
export type Day = { id: string; title: string; steps: Step[] };
export type City = { id: string; name: string; chineseName: string; subtitle: string; color: string; coordinates: [number, number]; image: string; days: Day[]; notes: string[]; nights?: number };
export type Bonus = { id: string; cityId: string; title: string; chineseName?: string; category: 'food' | 'photo' | 'visit' | 'shopping'; description: string; address?: string; budget?: string; tip?: string; amapUrl?: string; sourceUrl?: string };
export type View = 'planning' | 'map' | 'bonus' | 'transport' | 'notebook';
export type StoredState = { version: 1; cities: City[]; favorites: string[]; done: string[]; bookings: string[]; notes: Record<string, string>; departureDate: string };
