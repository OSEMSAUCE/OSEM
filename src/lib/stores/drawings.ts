// Drawn features store
// TODO: Implement in Step 5

import { writable } from 'svelte/store';
import type { Feature, Geometry } from 'geojson';

export const drawnFeatures = writable<Feature<Geometry>[]>([]);
