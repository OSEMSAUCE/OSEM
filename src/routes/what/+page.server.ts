import type { PageServerLoad } from "./$types";
import type {
    StagePageData,
    EntityDetail,
    ProjectDetail,
} from "$lib/components/stageOSEM/stageTypes";
import { PUBLIC_API_URL } from "$env/static/public";

export const load: PageServerLoad = async ({ url, fetch }) => {
    const projectKey = url.searchParams.get("projectKey");

    let selectedEntity: EntityDetail | undefined;

    if (projectKey) {
        const base = PUBLIC_API_URL.replace(/\/$/, "");
        const apiUrl = `${base}/api/entity?projectKey=${encodeURIComponent(projectKey)}`;

        try {
            const response = await fetch(apiUrl);
            if (response.ok) {
                const result = await response.json();
                if (result.entity === "project" && result.data) {
                    selectedEntity = {
                        entity: "project",
                        data: result.data as ProjectDetail,
                    };
                }
            }
        } catch (error) {
            console.error(
                "[what/+page.server.ts] Failed to fetch project:",
                error,
            );
        }
    }

    const data: StagePageData = {
        entity: "project",
        heading: "WHAT",
        description: "New project stage page scaffold.",
        routePath: "/what",
        selectedEntity,
    };

    return data;
};
