import type { PageServerLoad } from "./$types";
import type {
    StagePageData,
    EntityDetail,
    OrganizationDetail,
} from "$lib/components/stageOSEM/stageTypes";
import { PUBLIC_API_URL } from "$env/static/public";

export const load: PageServerLoad = async ({ url, fetch }) => {
    const organizationKey = url.searchParams.get("organizationKey");

    let selectedEntity: EntityDetail | undefined;

    if (organizationKey) {
        const base = PUBLIC_API_URL.replace(/\/$/, "");
        const apiUrl = `${base}/api/entity?organizationKey=${encodeURIComponent(organizationKey)}`;

        try {
            const response = await fetch(apiUrl);
            if (response.ok) {
                const result = await response.json();
                if (result.entity === "organization" && result.data) {
                    selectedEntity = {
                        entity: "organization",
                        data: result.data as OrganizationDetail,
                    };
                }
            }
        } catch (error) {
            console.error(
                "[who/+page.server.ts] Failed to fetch organization:",
                error,
            );
        }
    }

    const data: StagePageData = {
        entity: "organization",
        heading: "WHO",
        description: "New organization stage page scaffold.",
        routePath: "/who",
        selectedEntity,
    };

    return data;
};
