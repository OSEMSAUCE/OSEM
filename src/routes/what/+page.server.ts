import type { ServerLoad } from "@sveltejs/kit";
import { PUBLIC_API_URL } from "$env/static/public";
import { WhatPageDataSchema } from "../../lib/types/what";

export const load: ServerLoad = async ({ url, fetch }: { url: URL; fetch: (info: RequestInfo, init?: RequestInit) => Promise<Response> }) => {
	const projectIdParam = url.searchParams.get("project");
	const tableParam = url.searchParams.get("table");

	// Build query params
	const params = new URLSearchParams();

	if (projectIdParam) params.set("project", projectIdParam);
	if (tableParam) params.set("table", tableParam);

	const apiUrl = `${PUBLIC_API_URL.replace(/\/$/, "")}/api/what${params.toString() ? `?${params.toString()}` : ""}`;
	console.log(`🔧 [What Load] Fetching: ${apiUrl}`);
	const response = await fetch(apiUrl);

	if (!response.ok) {
		const body = await response.text().catch(() => "");
		throw new Error(`Failed to fetch what data (${response.status} ${response.statusText}) from ${apiUrl}${body ? `: ${body}` : ""}`);
	}

	// Check content-type before parsing JSON
	const contentType = response.headers.get("content-type");
	if (!contentType?.includes("application/json")) {
		const text = await response.text();
		console.error("🚨 API returned non-JSON response:", text.substring(0, 500));
		throw new Error(`API returned non-JSON response (${contentType}): ${text.substring(0, 200)}`);
	}

	let json: unknown;
	try {
		json = await response.json();
	} catch {
		const text = await response.text();
		console.error("🚨 Failed to parse JSON:", text.substring(0, 500));
		throw new Error(`Failed to parse JSON response: ${text.substring(0, 200)}`);
	}

	if (json && typeof json === "object" && "projects" in json) {
		const projects = (json as { projects: unknown[] }).projects;
		if (projects.length > 0) {
		
		}
	}

	const parsed = WhatPageDataSchema.safeParse(json);
	if (!parsed.success) {
		console.error("❌ SCHEMA VALIDATION FAILED:", parsed.error);
		throw new Error("API returned invalid what payload");
	}
	return parsed.data;
};
