import { toast } from "svelte-sonner";
import type { Feature } from "geojson";

export async function shareFeatureGeoJSON(feature: Feature): Promise<void> {
    const geojson = JSON.stringify(feature, null, 2);
    const file = new File([geojson], "feature.geojson", {
        type: "application/geo+json",
    });

    try {
        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({ title: "Map Feature", files: [file] });
            return;
        }
    } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
    }

    try {
        await navigator.clipboard.writeText(geojson);
        toast.success("GeoJSON copied to clipboard");
    } catch {
        toast.error("Could not share or copy feature");
    }
}
