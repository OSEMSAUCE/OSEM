import { json } from "@sveltejs/kit";
import { PUBLIC_API_URL } from "$env/static/public";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
	try {
		// Call ReTreever's API to get polygons
		const response = await fetch(`${PUBLIC_API_URL}/api/where/polygons`);

		if (!response.ok) {
			console.error("Failed to fetch polygons from ReTreever:", response.status);
			return json({ error: "Failed to fetch polygons from upstream service" }, { status: response.status });
		}

		const polygonData = await response.json();
		return json(polygonData);
	} catch (error) {
		console.error("Error fetching polygons:", error);
		return json({ error: "Failed to fetch polygons" }, { status: 500 });
	}
};
