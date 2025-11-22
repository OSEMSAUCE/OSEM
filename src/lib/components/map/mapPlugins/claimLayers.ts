import mapboxgl from 'mapbox-gl';

export interface ClaimLayerConfig {
	id: string;
	path: string;
	name: string;
	fillColor: string;
	outlineColor: string;
	opacity: number;
	isDynamic?: boolean;
	minZoom?: number;
	maxZoom?: number;
	initiallyVisible?: boolean;
}

// Core business claim layers - all using static GeoJSON files
const claimLayers: ClaimLayerConfig[] = [
	{
		id: 'restorPoly',
		path: '/claims/restorPoly2.geojson',
		name: 'Restoration',
		fillColor: '#088',
		outlineColor: '#000',
		opacity: 0.3,
		isDynamic: false,
		initiallyVisible: true
	}
	// Note: stagingPolygons removed - was using direct database access
	// Add back as static GeoJSON file if needed
];

// Helper function to add a static claim layer
async function addStaticClaimLayer(map: mapboxgl.Map, config: ClaimLayerConfig): Promise<void> {
	const response = await fetch(config.path);
	const geojson = await response.json();

	map.addSource(config.id, { type: 'geojson', data: geojson });

	map.addLayer({
		id: `${config.id}-fill`,
		type: 'fill',
		source: config.id,
		layout: {
			visibility: config.initiallyVisible !== false ? 'visible' : 'none'
		},
		paint: {
			'fill-color': config.fillColor,
			'fill-opacity': config.opacity
		}
	});

	map.addLayer({
		id: `${config.id}-outline`,
		type: 'line',
		source: config.id,
		layout: {
			visibility: config.initiallyVisible !== false ? 'visible' : 'none'
		},
		paint: {
			'line-color': config.outlineColor,
			'line-width': 1.5,
			'line-opacity': 1
		}
	});

	console.log(`🏞️ Static claim layer loaded: ${config.name}`);
}

// Dynamic layer functionality removed - all layers now use static GeoJSON files

// Helper function to update URL with current viewport
function updateViewportURL(map: mapboxgl.Map): void {
	const zoom = map.getZoom();
	const bounds = map.getBounds();

	if (!bounds) return;

	const sw = bounds.getSouthWest();
	const ne = bounds.getNorthEast();

	const params = new URLSearchParams({
		zoom: zoom.toFixed(1),
		minLat: sw.lat.toFixed(6),
		maxLat: ne.lat.toFixed(6),
		minLng: sw.lng.toFixed(6),
		maxLng: ne.lng.toFixed(6)
	});

	const newUrl = `${window.location.pathname}?${params.toString()}`;
	window.history.replaceState({}, '', newUrl);
}

// Viewport-based fetching removed - all data loaded from static GeoJSON files

/**
 * Adds core business claim layers to the map
 * All layers use static GeoJSON files
 */
export async function addClaimLayers(map: mapboxgl.Map): Promise<ClaimLayerConfig[]> {
	console.log('🏞️ Loading claim layers...');

	// Load all claim layers (all static now)
	await Promise.all(claimLayers.map((layer) => addStaticClaimLayer(map, layer)));

	// Initial URL update
	updateViewportURL(map);

	// Add click tooltips for all claim layers
	addClaimTooltips(map, claimLayers);

	console.log('✅ All claim layers loaded');
	return claimLayers;
}

/**
 * Adds click tooltips to claim polygon layers
 * Shows popup with claim information when clicking on a polygon
 */
function addClaimTooltips(map: mapboxgl.Map, layers: ClaimLayerConfig[]): void {
	layers.forEach((config) => {
		const layerId = `${config.id}-fill`;

		// Add click handler for this layer
		map.on('click', layerId, (e) => {
			if (e.features && e.features.length > 0) {
				const feature = e.features[0];
				const properties = feature.properties;

				if (!properties) return;

				// Build HTML content for tooltip
				// Truncate text helper (max 3 lines ~150 chars)
				const truncate = (text: string | number | null | undefined, maxLength = 150): string => {
					if (text === null || text === undefined) return '';
					const str = String(text);
					return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
				};

				// Format date helper (YYYY-MM format)
				const formatDate = (dateStr: string | null | undefined): string => {
					if (!dateStr) return '';
					try {
						const date = new Date(dateStr);
						if (isNaN(date.getTime())) return dateStr; // Return original if invalid
						const year = date.getFullYear();
						const month = String(date.getMonth() + 1).padStart(2, '0');
						return `${year}-${month}`;
					} catch {
						return dateStr;
					}
				};

				// Format value helper
				const formatValue = (key: string, value: any): string => {
					if (value === null || value === undefined || value === '') return '';
					// Format date fields
					if (key === 'projectDateEnd' || key === 'projectDateStart') {
						return formatDate(value);
					}
					if (typeof value === 'number') return value.toLocaleString();
					return truncate(value);
				};

				// Organize properties by section
				const projectProps = {
					projectName: properties.projectName,
					url: properties.url,
					platform: properties.platform,
					projectNotes: properties.projectNotes,
					carbonRegistryType: properties.carbonRegistryType,
					carbonRegistry: properties.carbonRegistry,
					employmentClaim: properties.employmentClaim,
					employmentClaimDescription: properties.employmentClaimDescription,
					projectDateEnd: properties.projectDateEnd,
					projectDateStart: properties.projectDateStart,
					registryId: properties.registryId,
					treesPlantedProject: properties.treesPlantedProject
				};

				const landProps = {
					landName: properties.landName, // Always show
					hectares: properties.hectares,
					gpsLat: properties.gpsLat,
					gpsLon: properties.gpsLon,
					landNotes: properties.landNotes,
					treatmentType: properties.treatmentType,
					preparation: properties.preparation,
					'planted (Land)': properties.treesPlantedLand // Always show
				};

				const polygonProps = {
					polygonNotes: properties.polygonNotes
				};

				const stakeholderProps = {
					stakeholders: properties.stakeholders
				};

				// Build project section
				const projectRows = Object.entries(projectProps)
					.filter(([, value]) => value !== null && value !== undefined && value !== '')
					.map(([key, value]) => {
						return `<tr><td class="tooltip-label">${key}:</td><td class="tooltip-value">${formatValue(key, value)}</td></tr>`;
					})
					.join('');

				// Build land section (always show landName and planted even if empty)
				const landRows = Object.entries(landProps)
					.filter(([key, value]) => {
						// Always show landName and planted (Land), even if empty
						if (key === 'landName' || key === 'planted (Land)') return true;
						// For others, only show if has value
						return value !== null && value !== undefined && value !== '';
					})
					.map(([key, value]) => {
						const displayValue =
							value === null || value === undefined || value === ''
								? 'No data'
								: formatValue(key, value);
						return `<tr><td class="tooltip-label">${key}:</td><td class="tooltip-value">${displayValue}</td></tr>`;
					})
					.join('');

				// Build polygon section
				const polygonRows = Object.entries(polygonProps)
					.filter(([, value]) => value !== null && value !== undefined && value !== '')
					.map(([key, value]) => {
						return `<tr><td class="tooltip-label">${key}:</td><td class="tooltip-value">${formatValue(key, value)}</td></tr>`;
					})
					.join('');

				// Build stakeholder section
				const stakeholderRows = Object.entries(stakeholderProps)
					.filter(([, value]) => value !== null && value !== undefined && value !== '')
					.map(([key, value]) => {
						return `<tr><td class="tooltip-label">${key}:</td><td class="tooltip-value">${formatValue(key, value)}</td></tr>`;
					})
					.join('');

				const html = `
					<div class="tooltip-container">
						<h3 class="tooltip-title">${config.name}</h3>
						${projectRows ? `<div class="tooltip-section"><strong>PROJECT</strong></div><table class="tooltip-table">${projectRows}</table>` : ''}
						${landRows ? `<div class="tooltip-section"><strong>LAND</strong></div><table class="tooltip-table">${landRows}</table>` : ''}
						${polygonRows ? `<div class="tooltip-section"><strong>POLYGON</strong></div><table class="tooltip-table">${polygonRows}</table>` : ''}
						${stakeholderRows ? `<div class="tooltip-section"><strong>STAKEHOLDERS</strong></div><table class="tooltip-table">${stakeholderRows}</table>` : ''}
					</div>
				`;

				// Create and show popup at click location
				new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(html).addTo(map);
			}
		});

		// Change cursor to pointer on hover
		map.on('mouseenter', layerId, () => {
			map.getCanvas().style.cursor = 'pointer';
		});

		map.on('mouseleave', layerId, () => {
			map.getCanvas().style.cursor = '';
		});
	});

	console.log('✅ Click tooltips added to claim layers');
}
ops = {
					projectName: properties.projectName,
					url: properties.url,
					platform: properties.platform,
					projectNotes: properties.projectNotes,
					carbonRegistryType: properties.carbonRegistryType,
					carbonRegistry: properties.carbonRegistry,
					employmentClaim: properties.employmentClaim,
					employmentClaimDescription: properties.employmentClaimDescription,
					projectDateEnd: properties.projectDateEnd,
					projectDateStart: properties.projectDateStart,
					registryId: properties.registryId,
					treesPlantedProject: properties.treesPlantedProject
				};

				const landProps = {
					landName: properties.landName, // Always show
					hectares: properties.hectares,
					gpsLat: properties.gpsLat,
					gpsLon: properties.gpsLon,
					landNotes: properties.landNotes,
					treatmentType: properties.treatmentType,
					preparation: properties.preparation,
					'planted (Land)': properties.treesPlantedLand // Always show
				};

				const polygonProps = {
					polygonNotes: properties.polygonNotes
				};

				const stakeholderProps = {
					stakeholders: properties.stakeholders
				};

				// Build project section
				const projectRows = Object.entries(projectProps)
					.filter(([, value]) => value !== null && value !== undefined && value !== '')
					.map(([key, value]) => {
						return `<tr><td class="tooltip-label">${key}:</td><td class="tooltip-value">${formatValue(key, value)}</td></tr>`;
					})
					.join('');

				// Build land section (always show landName and planted even if empty)
				const landRows = Object.entries(landProps)
					.filter(([key, value]) => {
						// Always show landName and planted (Land), even if empty
						if (key === 'landName' || key === 'planted (Land)') return true;
						// For others, only show if has value
						return value !== null && value !== undefined && value !== '';
					})
					.map(([key, value]) => {
						const displayValue =
							value === null || value === undefined || value === ''
								? 'No data'
								: formatValue(key, value);
						return `<tr><td class="tooltip-label">${key}:</td><td class="tooltip-value">${displayValue}</td></tr>`;
					})
					.join('');

				// Build polygon section
				const polygonRows = Object.entries(polygonProps)
					.filter(([, value]) => value !== null && value !== undefined && value !== '')
					.map(([key, value]) => {
						return `<tr><td class="tooltip-label">${key}:</td><td class="tooltip-value">${formatValue(key, value)}</td></tr>`;
					})
					.join('');

				// Build stakeholder section
				const stakeholderRows = Object.entries(stakeholderProps)
					.filter(([, value]) => value !== null && value !== undefined && value !== '')
					.map(([key, value]) => {
						return `<tr><td class="tooltip-label">${key}:</td><td class="tooltip-value">${formatValue(key, value)}</td></tr>`;
					})
					.join('');

				const html = `
					<div class="tooltip-container">
						<h3 class="tooltip-title">${config.name}</h3>
						${projectRows ? `<div class="tooltip-section"><strong>PROJECT</strong></div><table class="tooltip-table">${projectRows}</table>` : ''}
						${landRows ? `<div class="tooltip-section"><strong>LAND</strong></div><table class="tooltip-table">${landRows}</table>` : ''}
						${polygonRows ? `<div class="tooltip-section"><strong>POLYGON</strong></div><table class="tooltip-table">${polygonRows}</table>` : ''}
						${stakeholderRows ? `<div class="tooltip-section"><strong>STAKEHOLDERS</strong></div><table class="tooltip-table">${stakeholderRows}</table>` : ''}
					</div>
				`;

				// Create and show popup at click location
				new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(html).addTo(map);
			}
		});

		// Change cursor to pointer on hover
		map.on('mouseenter', layerId, () => {
			map.getCanvas().style.cursor = 'pointer';
		});

		map.on('mouseleave', layerId, () => {
			map.getCanvas().style.cursor = '';
		});
	});

	console.log('✅ Click tooltips added to claim layers');
}
