/**
 * SubWoof Dashboard API Client
 *
 * Shared API client for dashboard data access.
 * Used by both ReTreever (private) and OSEM (public).
 * RLS on the server controls data access.
 */

export interface DashboardParams {
  project?: string;
  table?: string;
}

export interface DashboardResponse {
  projects: Array<{
    projectId: string;
    projectName: string;
  }>;
  tableData: unknown[];
  availableTables: Array<{
    tableName: string;
  }>;
  selectedProjectId: string | null;
  selectedTable: string | null;
  error?: string;
}

/**
 * Fetch dashboard data from the API
 *
 * @param apiUrl - Base URL of the API server (e.g., 'http://localhost:3001')
 * @param params - Optional query parameters (project, table)
 * @returns Dashboard data including projects, table data, and selections
 */
export async function fetchDashboardData(
  apiUrl: string,
  params: DashboardParams = {}
): Promise<DashboardResponse> {
  try {
    const url = new URL("/api/dashboard", apiUrl);

    if (params.project) {
      url.searchParams.set("project", params.project);
    }
    if (params.table) {
      url.searchParams.set("table", params.table);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(
        `API returned ${response.status}: ${response.statusText}`
      );
    }

    const data: DashboardResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Dashboard API fetch error:", error);
    return {
      projects: [],
      tableData: [],
      availableTables: [],
      selectedProjectId: null,
      selectedTable: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch dashboard data",
    };
  }
}
