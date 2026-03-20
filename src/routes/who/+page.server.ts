import type { PageServerLoad } from "./$types";
import type { StagePageData } from "$lib/components/stageOSEM/stageTypes";

export const load: PageServerLoad = async () => {
    const data: StagePageData = {
        entity: "organization",
        heading: "WHO",
        description: "New organization stage page scaffold.",
        routePath: "/who",
    };

    return data;
};
