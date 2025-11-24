import type { PageServerLoad } from "./$types";
import { fetchDashboardData } from "../../api/dashboard";
import { PUBLIC_API_URL } from "$env/static/public";

export const load: PageServerLoad = async ({ url }) => {
  const projectIdParam = url.searchParams.get("project");
  const tableParam = url.searchParams.get("table");

  // Use SubWoof API client - works for both ReTreever and OSEM
  // ReTreever: calls localhost (its own API)
  // OSEM: calls ReTreever's public API URL
  const data = await fetchDashboardData(PUBLIC_API_URL, {
    project: projectIdParam || undefined,
    table: tableParam || undefined,
  });

  return data;
};
