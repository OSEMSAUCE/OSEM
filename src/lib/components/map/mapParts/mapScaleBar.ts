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
    const pow = 10 ** exp;
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
        return `${str}km`;
    }
    return `${value}${unit}`;
}

function metersPerPixel(map: MapboxMap): number {
    const container = map.getContainer();
    const cx = container.clientWidth / 2;
    const cy = container.clientHeight / 2;
    const left = map.unproject([cx - 50, cy]);
    const right = map.unproject([cx + 50, cy]);
    const R = 6371008.8;
    const toRad = Math.PI / 180;
    const dLon = (right.lng - left.lng) * toRad;
    const lat1 = left.lat * toRad;
    const lat2 = right.lat * toRad;
    const a = Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) / 100;
}

export class NiceScaleBarControl {
    private opts: Required<ScaleBarOptions>;
    private map: MapboxMap | null = null;
    private container: HTMLDivElement | null = null;
    private blocksEl: HTMLDivElement | null = null;
    private labelsEl: HTMLDivElement | null = null;
    private hideTimeout: ReturnType<typeof setTimeout> | null = null;
    private onMove = () => this.update();
    private onZoomStart = () => {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
        this.container?.classList.add("is-active");
    };
    private onZoomEnd = () => {
        if (this.hideTimeout) clearTimeout(this.hideTimeout);
        this.hideTimeout = setTimeout(() => {
            this.container?.classList.remove("is-active");
            this.hideTimeout = null;
        }, 2000);
    };

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
        map.on("zoomstart", this.onZoomStart);
        map.on("zoomend", this.onZoomEnd);
        this.update();
        return el;
    }

    onRemove(): void {
        if (this.map) {
            this.map.off("move", this.onMove);
            this.map.off("zoomstart", this.onZoomStart);
            this.map.off("zoomend", this.onZoomEnd);
        }
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
        this.container?.parentNode?.removeChild(this.container);
        this.container = null;
        this.blocksEl = null;
        this.labelsEl = null;
        this.map = null;
    }

    getDefaultPosition(): "bottom-left" {
        return "bottom-left";
    }

    private update(): void {
        if (!this.map || !this.blocksEl || !this.labelsEl) return;
        const { width, maxRangeMeters, minStepWidth, maxDepth } = this.opts;

        const mpp = metersPerPixel(this.map);
        if (!isFinite(mpp) || mpp <= 0) return;

        const maxMeters = Math.min(maxRangeMeters, width * mpp);
        const totalMeters = niceNumberAtMost(maxMeters);
        if (totalMeters <= 0) {
            this.blocksEl.innerHTML = "";
            this.labelsEl.innerHTML = "";
            return;
        }

        const totalPx = totalMeters / mpp;

        // Powers-of-two layout only. The bar is always split in half.
        // The left half can be split in half again (quarters) if there's room.
        // Never thirds — every division is ½ or ¼ of the total.
        //
        // Layout (when quarters fit):
        //   [■ ¼ | ░ ¼ | ■■ ½ ░░░░░░░░░░░░░░░]
        //   0   ¼     ½                        total
        //
        // Layout (when only halves fit):
        //   [■■■ ½ | ░░░░░░░░░░░░░░░░░░░░░░░░]
        //   0      ½                          total

        const halfPx = totalPx / 2;
        const halfMeters = totalMeters / 2;
        const quarterPx = totalPx / 4;
        const quarterMeters = totalMeters / 4;

        const showQuarters = quarterPx >= minStepWidth;

        // ── Blocks ──────────────────────────────────────────────────
        this.blocksEl.style.width = `${totalPx}px`;
        this.blocksEl.innerHTML = "";

        const addBlock = (widthPx: number, dark: boolean) => {
            const b = document.createElement("div");
            b.className = `nice-scale-bar__block ${dark ? "is-dark" : "is-light"}`;
            b.style.flex = "none";
            b.style.width = `${widthPx}px`;
            this.blocksEl!.appendChild(b);
        };

        if (showQuarters) {
            // Left half subdivided: [¼ dark][¼ light]  Right half: [½ dark]
            addBlock(quarterPx, true);
            addBlock(quarterPx, false);
            addBlock(halfPx, true);
        } else {
            // Just halves: [½ dark][½ light]
            addBlock(halfPx, true);
            addBlock(halfPx, false);
        }

        // ── Labels ──────────────────────────────────────────────────
        this.labelsEl.style.width = `${totalPx}px`;
        this.labelsEl.innerHTML = "";

        const addTick = (cssClass: string, text: string, leftPx?: number) => {
            const span = document.createElement("span");
            span.className = `nice-scale-bar__tick ${cssClass}`;
            if (leftPx !== undefined) span.style.left = `${leftPx}px`;
            span.textContent = text;
            this.labelsEl!.appendChild(span);
        };

        // 0 at left edge
        addTick("nice-scale-bar__tick--start", "0");

        // Quarter label (only when quarters are shown and there's room)
        if (showQuarters && quarterPx > minStepWidth * 1.5) {
            addTick(
                "nice-scale-bar__tick--mid",
                formatSI(Math.round(quarterMeters), this.opts.unit),
                quarterPx,
            );
        }

        // Half label — always shown
        addTick(
            "nice-scale-bar__tick--mid",
            formatSI(Math.round(halfMeters), this.opts.unit),
            halfPx,
        );

        // Total at right edge
        addTick(
            "nice-scale-bar__tick--end",
            formatSI(Math.round(totalMeters), this.opts.unit),
        );
    }
}
