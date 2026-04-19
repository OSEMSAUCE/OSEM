// Compact style switcher control - single button with dropdown
import type mapboxgl from "mapbox-gl";

// Folded map icon (matches Mapbox control style)
const MAP_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffd700" style="width:60%;height:60%">
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
        this.currentStyleId = defaultStyleId || styles[0]?.id || "satellite";
    }

    onAdd(map: mapboxgl.Map): HTMLElement {
        this.map = map;

        // Main container
        this.container = document.createElement("div");
        this.container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
        this.container.style.position = "relative";

        // Main button (matches Mapbox nav control style)
        const button = document.createElement("button");
        button.type = "button";
        button.className = "mapboxgl-ctrl-icon";
        button.title = "Map Style";
        button.setAttribute("aria-label", "Map Style");
        button.style.width = "100%";
        button.style.height = "100%";
        button.style.display = "flex";
        button.style.alignItems = "center";
        button.style.justifyContent = "center";
        button.style.border = "none";
        button.style.background = "transparent";
        button.style.cursor = "pointer";
        button.style.padding = "0";
        button.innerHTML = MAP_ICON;

        button.addEventListener("click", (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        this.container.appendChild(button);

        // Dropdown menu
        this.dropdown = document.createElement("div");
        this.dropdown.style.position = "absolute";
        this.dropdown.style.top = "0";
        this.dropdown.style.right = "100%";
        this.dropdown.style.marginRight = "4px";
        this.dropdown.style.background = "transparent";
        this.dropdown.style.borderRadius = "4px";
        this.dropdown.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
        this.dropdown.style.border = "1px solid rgba(255,255,255,0.4)";
        this.dropdown.style.display = "none";
        this.dropdown.style.minWidth = "120px";
        this.dropdown.style.overflow = "hidden";
        this.dropdown.style.zIndex = "1000";

        this.styles.forEach((style) => {
            const item = document.createElement("div");
            item.dataset.styleId = style.id;
            item.textContent = style.label;
            // Desktop simulator uses phone frame (~390px) — check container, not window
            const phoneFrame = this.container?.closest(".mobile-preview-frame");
            const containerWidth = phoneFrame
                ? phoneFrame.clientWidth
                : window.innerWidth;
            const isTablet = containerWidth >= 500;
            item.style.padding = isTablet ? "12px 16px" : "10px 14px";
            item.style.cursor = "pointer";
            item.style.fontSize = isTablet ? "1.1rem" : "0.9rem";
            item.style.fontFamily = "system-ui, sans-serif";
            item.style.background =
                this.currentStyleId === style.id ? "#ffd700" : "transparent";
            item.style.color =
                this.currentStyleId === style.id ? "#1a1a1a" : "#d4d4d4";
            item.style.fontWeight =
                this.currentStyleId === style.id ? "600" : "400";

            item.addEventListener("click", (e) => {
                e.stopPropagation();
                this.currentStyleId = style.id;
                this.map?.setStyle(style.styleUrl);
                this.updateActiveState();
                this.closeDropdown();
            });

            item.addEventListener("mouseenter", () => {
                if (this.currentStyleId !== style.id) {
                    item.style.background = "rgba(255, 215, 0, 0.25)";
                    item.style.color = "#d4d4d4";
                }
            });

            item.addEventListener("mouseleave", () => {
                const isActive = this.currentStyleId === style.id;
                item.style.background = isActive ? "#ffd700" : "transparent";
                item.style.color = isActive ? "#1a1a1a" : "#d4d4d4";
            });

            this.dropdown?.appendChild(item);
        });

        this.container.appendChild(this.dropdown);

        // Close dropdown when clicking outside
        document.addEventListener("click", this.handleOutsideClick);

        return this.container;
    }

    private handleOutsideClick = (): void => {
        this.closeDropdown();
    };

    private toggleDropdown(): void {
        this.isOpen = !this.isOpen;
        if (this.dropdown) {
            this.dropdown.style.display = this.isOpen ? "block" : "none";
        }
    }

    private closeDropdown(): void {
        this.isOpen = false;
        if (this.dropdown) {
            this.dropdown.style.display = "none";
        }
    }

    private updateActiveState(): void {
        const items = this.dropdown?.querySelectorAll("[data-style-id]");
        items?.forEach((el) => {
            const item = el as HTMLDivElement;
            const isActive = item.dataset.styleId === this.currentStyleId;
            item.style.background = isActive ? "#ffd700" : "transparent";
            item.style.color = isActive ? "#1a1a1a" : "#d4d4d4";
            item.style.fontWeight = isActive ? "600" : "400";
        });
    }

    onRemove(): void {
        document.removeEventListener("click", this.handleOutsideClick);
        this.container?.parentNode?.removeChild(this.container);
        this.map = undefined;
    }
}

// Pre-configured style options
export const defaultStyleOptions: StyleOption[] = [
    {
        id: "natural",
        label: "Natural",
        styleUrl: "mapbox://styles/mapbox/dark-v11",
    },
    {
        id: "streets",
        label: "Streets",
        styleUrl: "mapbox://styles/mapbox/streets-v12",
    },
    {
        id: "satellite",
        label: "Satellite",
        styleUrl: "mapbox://styles/mapbox/satellite-streets-v12",
    },
];

/**
 * Resolve the style-option id that matches a given Mapbox style URL.
 * Falls back to "satellite" when the URL isn't in the list.
 */
export function styleIdFromUrl(
    url: string | undefined,
    options: StyleOption[] = defaultStyleOptions,
): string {
    if (!url) return "natural";
    return options.find((o) => o.styleUrl === url)?.id ?? "natural";
}

// Legacy export for backward compatibility
export const CustomStyleControl = StyleToggleControl;
