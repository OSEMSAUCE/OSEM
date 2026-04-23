// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MapboxMap = any;

export interface ScaleBarOptions {
    width?: number;
    maxRangeMeters?: number;
    minStepWidth?: number;
    maxDepth?: number;
    height?: number;
    unit?: string;
}

const NICE_STEPS = [1, 2, 5];

function niceNumberAtMost(value: number): number {
    if (value <= 0) return 0;
    const exp = Math.floor(Math.log10(value));
    const pow = Math.pow(10, exp);
    let best = 0;
    for (const s of NICE_STEPS) {
        const v = s * pow;
        if (v <= value && v > best) best = v;
    }
    return best;
}

function formatSI(value: number, unit: string): string {
    if (value >= 1000) {
        const k = value / 1000;
        const str = k >= 10 ? k.toFixed(0) : k.toFixed(2).replace(/\.?0+$/, "");
        return `${str}k${unit}`;
    }
    return `${value}${unit}`;
}

function metersPerPixel(lat: number, zoom: number): number {
    return (
        (40075016.686 * Math.cos((lat * Math.PI) / 180)) /
        Math.pow(2, zoom + 8)
    );
}

export class NiceScaleBarControl {
    private opts: Required<ScaleBarOptions>;
    private map: MapboxMap | null = null;
    private container: HTMLDivElement | null = null;
    private blocksEl: HTMLDivElement | null = null;
    private labelsEl: HTMLDivElement | null = null;
    private onMove = () => this.update();

    constructor(options: ScaleBarOptions = {}) {
        this.opts = {
            width: options.width ?? 200,
            maxRangeMeters: options.maxRangeMeters ?? 5000,
            minStepWidth: options.minStepWidth ?? 23,
            maxDepth: options.maxDepth ?? 4,
            height: options.height ?? 20,
            unit: options.unit ?? "m",
        };
    }

    onAdd(map: MapboxMap): HTMLElement {
        this.map = map;
        const el = document.createElement("div");
        el.className = "mapboxgl-ctrl nice-scale-bar";
        el.style.pointerEvents = "none";

        const blocks = document.createElement("div");
        blocks.className = "nice-scale-bar__blocks";
        blocks.style.height = `${this.opts.height}px`;
        el.appendChild(blocks);

        const labels = document.createElement("div");
        labels.className = "nice-scale-bar__labels";
        el.appendChild(labels);

        this.container = el;
        this.blocksEl = blocks;
        this.labelsEl = labels;

        map.on("move", this.onMove);
        this.update();
        return el;
    }

    onRemove(): void {
        if (this.map) this.map.off("move", this.onMove);
        this.container?.parentNode?.removeChild(this.container);
        this.container = null;
        this.blocksEl = null;
        this.labelsEl = null;
        this.map = null;
    }

    getDefaultPosition(): string {
        return "bottom-left";
    }

    private update(): void {
        if (!this.map || !this.blocksEl || !this.labelsEl) return;
        const { width, maxRangeMeters, minStepWidth, maxDepth } = this.opts;

        const lat = this.map.getCenter().lat;
        const zoom = this.map.getZoom();
        const mpp = metersPerPixel(lat, zoom);
        if (!isFinite(mpp) || mpp <= 0) return;

        const maxMeters = Math.min(maxRangeMeters, width * mpp);
        const totalMeters = niceNumberAtMost(maxMeters);
        if (totalMeters <= 0) {
            this.blocksEl.innerHTML = "";
            this.labelsEl.innerHTML = "";
            return;
        }

        let divisions = maxDepth;
        while (divisions > 1 && totalMeters / divisions / mpp < minStepWidth) {
            divisions = divisions === 4 ? 2 : 1;
        }

        const totalPx = totalMeters / mpp;
        const stepMeters = totalMeters / divisions;

        // Blocks
        this.blocksEl.style.width = `${totalPx}px`;
        this.blocksEl.innerHTML = "";
        for (let i = 0; i < divisions; i++) {
            const b = document.createElement("div");
            b.className = `nice-scale-bar__block ${i % 2 === 0 ? "is-dark" : "is-light"}`;
            this.blocksEl.appendChild(b);
        }

        // Labels at each tick (0 .. totalMeters)
        this.labelsEl.style.width = `${totalPx}px`;
        this.labelsEl.innerHTML = "";
        for (let i = 0; i <= divisions; i++) {
            const t = document.createElement("span");
            t.className = "nice-scale-bar__tick";
            t.style.left = `${(i / divisions) * 100}%`;
            const v = i * stepMeters;
            t.textContent = i === 0 ? "0" : formatSI(Math.round(v), this.opts.unit);
            this.labelsEl.appendChild(t);
        }
    }
}
