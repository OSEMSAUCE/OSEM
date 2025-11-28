// Custom style switcher control with icons
import type mapboxgl from 'mapbox-gl';

// SVG icons for map styles
const ICONS = {
	streets: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/><circle cx="12" cy="12" r="1"/></svg>`,
	satellite: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`
};

interface StyleOption {
	id: string;
	label: string;
	styleUrl: string;
	icon: string;
}

export class CustomStyleControl {
	private map: mapboxgl.Map | undefined;
	private container: HTMLDivElement | undefined;
	private styles: StyleOption[];
	private currentStyleId: string;

	constructor(styles: StyleOption[], defaultStyleId?: string) {
		this.styles = styles;
		this.currentStyleId = defaultStyleId || styles[0]?.id || 'satellite';
	}

	onAdd(map: mapboxgl.Map): HTMLElement {
		this.map = map;
		this.container = document.createElement('div');
		this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
		this.container.style.background = 'white';
		this.container.style.borderRadius = '4px';
		this.container.style.padding = '4px';

		this.styles.forEach((style) => {
			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'style-btn';
			button.dataset.styleId = style.id;
			button.title = style.label;
			button.style.display = 'flex';
			button.style.alignItems = 'center';
			button.style.gap = '6px';
			button.style.padding = '6px 10px';
			button.style.border = 'none';
			button.style.background = this.currentStyleId === style.id ? '#e0e0e0' : 'transparent';
			button.style.cursor = 'pointer';
			button.style.width = '100%';
			button.style.fontSize = '12px';
			button.style.borderRadius = '3px';

			// Icon
			const iconSpan = document.createElement('span');
			iconSpan.innerHTML = style.icon;
			iconSpan.style.display = 'flex';
			iconSpan.style.alignItems = 'center';

			// Label
			const labelSpan = document.createElement('span');
			labelSpan.textContent = style.label;

			button.appendChild(iconSpan);
			button.appendChild(labelSpan);

			button.addEventListener('click', () => {
				this.currentStyleId = style.id;
				this.map?.setStyle(style.styleUrl);
				this.updateActiveState();
			});

			button.addEventListener('mouseenter', () => {
				if (this.currentStyleId !== style.id) {
					button.style.background = '#f0f0f0';
				}
			});

			button.addEventListener('mouseleave', () => {
				button.style.background = this.currentStyleId === style.id ? '#e0e0e0' : 'transparent';
			});

			this.container?.appendChild(button);
		});

		return this.container;
	}

	private updateActiveState(): void {
		const buttons = this.container?.querySelectorAll('.style-btn');
		buttons?.forEach((btn) => {
			const button = btn as HTMLButtonElement;
			const isActive = button.dataset.styleId === this.currentStyleId;
			button.style.background = isActive ? '#e0e0e0' : 'transparent';
		});
	}

	onRemove(): void {
		this.container?.parentNode?.removeChild(this.container);
		this.map = undefined;
	}
}

// Pre-configured style options
export const defaultStyleOptions: StyleOption[] = [
	{
		id: 'streets',
		label: 'Streets',
		styleUrl: 'mapbox://styles/mapbox/streets-v12',
		icon: ICONS.streets
	},
	{
		id: 'satellite',
		label: 'Satellite',
		styleUrl: 'mapbox://styles/mapbox/satellite-streets-v12',
		icon: ICONS.satellite
	}
];
