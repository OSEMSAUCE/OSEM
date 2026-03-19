import type { ServerLoad } from "@sveltejs/kit";
import { PUBLIC_API_URL } from "$env/static/public";

export const load: ServerLoad = async ({
    url,
    fetch,
}: {
    url: URL;
    fetch: (info: RequestInfo, init?: RequestInit) => Promise<Response>;
}) => {
    const organizationKeyParam = url.searchParams.get("organizationKey");
    const tableParam = url.searchParams.get("table");

    const params = new URLSearchParams();
    if (organizationKeyParam)
        params.set("organizationKey", organizationKeyParam);
    if (tableParam) params.set("table", tableParam);

    const fallback = {
        selectedOrganizationKey: organizationKeyParam,
        selectedTable: tableParam,
        organizations: [],
        availableTables: [],
        tableData: [],
        tableCounts: {},
        lazy: Promise.resolve({ tableData: [], tableCounts: {} }),
    };

    const base = PUBLIC_API_URL.replace(/\/$/, "");
    const apiUrl = `${base}/api/who?${params}`;

    let response: Response;
    try {
        response = await fetch(apiUrl, {
            signal: AbortSignal.timeout(30_000),
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("❌ who API unreachable:", msg);
        return { ...fallback, error: `API unreachable: ${msg}` };
    }

    if (!response.ok) {
        const body = await response.text().catch(() => "");
        console.error(`❌ who API ${response.status}:`, body.substring(0, 500));
        return {
            ...fallback,
            error: `API error ${response.status}: ${body.substring(0, 200)}`,
        };
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
        const text = await response.text();
        console.error(
            "🚨 API returned non-JSON response:",
            text.substring(0, 500),
        );
        return { ...fallback, error: `API returned non-JSON (${contentType})` };
    }

    let json: unknown;
    try {
        json = await response.json();
    } catch {
        console.error("🚨 Failed to parse JSON from who API");
        return { ...fallback, error: "API returned unparseable JSON" };
    }

    // For now, assume the API returns { organizations: [...] }
    // We'll need to update the API to return table data structure
    const data = json as any;

    return {
        selectedOrganizationKey: organizationKeyParam,
        selectedTable: tableParam || "OrganizationTable",
        organizations: data.organizations || [],
        availableTables: data.availableTables || [
            { tableName: "OrganizationTable" },
        ],
        tableData: data.tableData || data.organizations || [],
        tableCounts: data.tableCounts || {
            OrganizationTable: (data.organizations || []).length,
        },
        lazy: Promise.resolve({
            tableData: data.tableData || data.organizations || [],
            tableCounts: data.tableCounts || {
                OrganizationTable: (data.organizations || []).length,
            },
        }),
    };
};
