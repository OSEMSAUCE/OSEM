// Map instance store
// TODO: Implement in Step 2

import { writable } from 'svelte/store';
import type { Map } from 'mapbox-gl';

export const mapInstance = writable<Map | null>(null);
