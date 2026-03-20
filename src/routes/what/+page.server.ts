import type { PageServerLoad } from "./$types";
import type { StagePageData } from "$lib/components/stageOSEM/stageTypes";

export const load: PageServerLoad = async () => {
    const data: StagePageData = {
        entity: "project",
        heading: "WHAT",
        description: "New project stage page scaffold.",
        routePath: "/what",
    };

    return data;
};
