// Svelte store for map state
import { writable } from 'svelte/store';
import type { MapBounds } from '$lib/types/project';

export const mapBounds = writable<MapBounds | null>(null);

export const mapZoom = writable<number>(5);

export const mapCenter = writable<[number, number]>([-118.842506, 47.58635]);
