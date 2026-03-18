import type { ServerLoad } from "@sveltejs/kit";
import { PUBLIC_API_URL } from "$env/static/public";
import { WhatPageDataSchema } from "../../lib/types/what";

export const load: ServerLoad = async ({
    url,
    fetch,
}: {
    url: URL;
    fetch: (info: RequestInfo, init?: RequestInit) => Promise<Response>;
}) => {
    const projectKeyParam = url.searchParams.get("projectKey");
    const tableParam = url.searchParams.get("table");

    // Build query params
    const params = new URLSearchParams();

    if (projectKeyParam) params.set("projectKey", projectKeyParam);
    if (tableParam) params.set("table", tableParam);

    const fallback = {
        selectedprojectKey: projectKeyParam,
        selectedTable: tableParam,
        projects: [],
        availableTables: [],
        tableData: [],
        tableCounts: {},
        projectScore: null,
        lazy: Promise.resolve({ tableData: [], tableCounts: {} }),
    };

    const base = PUBLIC_API_URL.replace(/\/$/, "");
    const apiUrl = `${base}/api/what?${params}`;

    let response: Response;
    // 16 Mar 2026 The honestly says that this await is where we make the initial call and then we could make sequential ones after this. So it'll say await a number of times.
    // that way we prevent making new clients and can lazy load sequentially, not in parallel.
    // eventually maybe w'ell move subsequnet calls to different compoentents. the load/scroll driven ones.
    try {
        response = await fetch(apiUrl, {
            signal: AbortSignal.timeout(30_000),
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("❌ what API unreachable:", msg);
        return { ...fallback, error: `API unreachable: ${msg}` };
    }

    if (!response.ok) {
        const body = await response.text().catch(() => "");
        console.error(
            `❌ what API ${response.status}:`,
            body.substring(0, 500),
        );
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
        console.error("🚨 Failed to parse JSON from what API");
        return { ...fallback, error: "API returned unparseable JSON" };
    }

    const parsed = WhatPageDataSchema.safeParse(json);
    if (!parsed.success) {
        console.error("❌ SCHEMA VALIDATION FAILED:", parsed.error);
        return {
            ...fallback,
            error: "API returned unexpected data shape",
            lazy: Promise.resolve({ tableData: [], tableCounts: {} }),
        };
    }

    return {
        ...parsed.data,
        lazy: Promise.resolve({
            tableData: parsed.data.tableData,
            tableCounts: parsed.data.tableCounts,
        }),
    };
};
