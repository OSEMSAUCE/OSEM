// TODO: restore StagePage load when stageOSEM components are rebuilt
// OSEM routes are outside the host app's SvelteKit route tree, so no
// ./$types is generated — use the generic ServerLoad type instead.
import type { ServerLoad } from "@sveltejs/kit";

export const load: ServerLoad = async () => {
    return {};
};
