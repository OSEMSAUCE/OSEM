// Compact style switcher control - single button with dropdown
import type mapboxgl from 'mapbox-gl';

// Folded map icon (matches Mapbox control style)
const MAP_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
	<path d="M15 3l6 3v15l-6-3-6 3-6-3V3l6 3 6-3zm-1 2.13l-4 2V19.1l4-2V5.13zm2 0v12l4 2V5.1l-4 2.03zM4 6.87v12l4-2V4.87l-4 2z"/>
</svg>`;

interface StyleOption {
	id: string;
	label: string;
	styleUrl: string;
}

export class StyleToggleControl {
	private map: mapboxgl.Map | undefined;
	private container: HTMLDivElement | undefined;
	private dropdown: HTMLDivElement | undefined;
	private isOpen = false;
	private styles: StyleOption[];
	private currentStyleId: string;

	constructor(styles: StyleOption[], defaultStyleId?: string) {
		this.styles = styles;
		this.currentStyleId = defaultStyleId || styles[0]?.id || 'satellite';
	}

	onAdd(map: mapboxgl.Map): HTMLElement {
		this.map = map;

		// Main container
		this.container = document.createElement('div');
		this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
		this.container.style.position = 'relative';

		// Main button (matches Mapbox nav control style)
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'mapboxgl-ctrl-icon';
		button.title = 'Map Style';
		button.setAttribute('aria-label', 'Map Style');
		button.style.width = '29px';
		button.style.height = '29px';
		button.style.display = 'flex';
		button.style.alignItems = 'center';
		button.style.justifyContent = 'center';
		button.style.border = 'none';
		button.style.background = 'transparent';
		button.style.cursor = 'pointer';
		button.style.padding = '0';
		button.innerHTML = MAP_ICON;

		button.addEventListener('click', (e) => {
			e.stopPropagation();
			this.toggleDropdown();
		});

		this.container.appendChild(button);

		// Dropdown menu
		this.dropdown = document.createElement('div');
		this.dropdown.style.position = 'absolute';
		this.dropdown.style.top = '100%';
		this.dropdown.style.left = '0';
		this.dropdown.style.marginTop = '4px';
		this.dropdown.style.background = 'white';
		this.dropdown.style.borderRadius = '4px';
		this.dropdown.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
		this.dropdown.style.display = 'none';
		this.dropdown.style.minWidth = '120px';
		this.dropdown.style.overflow = 'hidden';
		this.dropdown.style.zIndex = '1000';

		this.styles.forEach((style) => {
			const item = document.createElement('div');
			item.dataset.styleId = style.id;
			item.textContent = style.label;
			item.style.padding = '8px 12px';
			item.style.cursor = 'pointer';
			item.style.fontSize = '13px';
			item.style.fontFamily = 'system-ui, sans-serif';
			item.style.background =
				this.currentStyleId === style.id ? 'var(--color-accent, #2a5a1a)' : 'white';
			item.style.color = this.currentStyleId === style.id ? 'white' : '#333';
			item.style.fontWeight = this.currentStyleId === style.id ? '600' : '400';

			item.addEventListener('click', (e) => {
				e.stopPropagation();
				this.currentStyleId = style.id;
				this.map?.setStyle(style.styleUrl);
				this.updateActiveState();
				this.closeDropdown();
			});

			item.addEventListener('mouseenter', () => {
				if (this.currentStyleId !== style.id) {
					item.style.background = 'var(--color-accent, #2a5a1a)';
					item.style.color = 'white';
				}
			});

			item.addEventListener('mouseleave', () => {
				const isActive = this.currentStyleId === style.id;
				item.style.background = isActive ? 'var(--color-accent, #2a5a1a)' : 'white';
				item.style.color = isActive ? 'white' : '#333';
			});

			this.dropdown?.appendChild(item);
		});

		this.container.appendChild(this.dropdown);

		// Close dropdown when clicking outside
		document.addEventListener('click', this.handleOutsideClick);

		return this.container;
	}

	private handleOutsideClick = (): void => {
		this.closeDropdown();
	};

	private toggleDropdown(): void {
		this.isOpen = !this.isOpen;
		if (this.dropdown) {
			this.dropdown.style.display = this.isOpen ? 'block' : 'none';
		}
	}

	private closeDropdown(): void {
		this.isOpen = false;
		if (this.dropdown) {
			this.dropdown.style.display = 'none';
		}
	}

	private updateActiveState(): void {
		const items = this.dropdown?.querySelectorAll('[data-style-id]');
		items?.forEach((el) => {
			const item = el as HTMLDivElement;
			const isActive = item.dataset.styleId === this.currentStyleId;
			item.style.background = isActive ? 'var(--color-accent, #2a5a1a)' : 'white';
			item.style.color = isActive ? 'white' : '#333';
			item.style.fontWeight = isActive ? '600' : '400';
		});
	}

	onRemove(): void {
		document.removeEventListener('click', this.handleOutsideClick);
		this.container?.parentNode?.removeChild(this.container);
		this.map = undefined;
	}
}

// Pre-configured style options
export const defaultStyleOptions: StyleOption[] = [
	{
		id: 'streets',
		label: 'Streets',
		styleUrl: 'mapbox://styles/mapbox/streets-v12'
	},
	{
		id: 'satellite',
		label: 'Satellite',
		styleUrl: 'mapbox://styles/mapbox/satellite-streets-v12'
	}
];

// Legacy export for backward compatibility
export const CustomStyleControl = StyleToggleControl;
