export type Character = 'pico' | 'mochi' | 'bivouac';
export type Sprite = { setCharacter(character: Character): void; setAccent(accent: string): void; play(state: 'idle' | 'greet' | 'map' | 'sleep'): void; setAnimated(animated: boolean): void; destroy(): void };
export function createSprite(element: HTMLElement, options?: { character?: Character; accent?: string; animated?: boolean }): Sprite;
