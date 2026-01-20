import type { ServerLoad } from "@sveltejs/kit";
import { WhatPageDataSchema } from "../../lib/types/what";

// Use local API in development, production in production
const PUBLIC_API_URL = "http://localhost:5175";

export const load: ServerLoad = async ({ url, fetch }: { url: URL; fetch: (info: RequestInfo, init?: RequestInit) => Promise<Response> }) => {
	const projectIdParam = url.searchParams.get("project");
	const decodedProjectId = projectIdParam;
	const tableParam = url.searchParams.get("table");

	// Build query params
	const params = new URLSearchParams();

	if (decodedProjectId) params.set("project", decodedProjectId);
	if (tableParam) params.set("table", tableParam);

	const apiUrl = `${PUBLIC_API_URL.replace(/\/$/, "")}/api/what${params.toString() ? `?${params.toString()}` : ""}`;
	console.log(`🔧 [What Load] Fetching: ${apiUrl}`);
	const response = await fetch(apiUrl);

	if (!response.ok) {
		const body = await response.text().catch(() => "");
		throw new Error(`Failed to fetch what data (${response.status} ${response.statusText}) from ${apiUrl}${body ? `: ${body}` : ""}`);
	}

	const json = await response.json();
	const parsed = WhatPageDataSchema.safeParse(json);
	if (!parsed.success) {
		console.error("OSEM what page validation error:", parsed.error);
		throw new Error("API returned invalid what payload");
	}
	return parsed.data;
};
