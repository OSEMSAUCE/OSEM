import type { PageLoad } from './$types';
import { supabase } from '$lib/supabase';

// Disable SSR to fix bits-ui portal issue
export const ssr = false;

export const load: PageLoad = async ({ url }) => {
	// Get project ID and table name from URL parameters
	const projectIdParam = url.searchParams.get('project');
	const tableParam = url.searchParams.get('table');

	try {
		// Available tables with projectId column (hardcoded for now since RLS prevents schema queries)
		const availableTables = [
			{ tableName: 'landTable' },
			{ tableName: 'cropTable' },
			{ tableName: 'plantingTable' },
			{ tableName: 'polyTable' },
			{ tableName: 'stakeholderTable' }
		];

		console.log('Available tables:', availableTables);

		// Fetch all projects from Supabase
		console.log('Fetching projects from Supabase...');
		const { data: projects, error: projectsError } = await supabase
			.from('projectTable')
			.select('projectId, projectName')
			.eq('deleted', false)
			.order('projectName');

		if (projectsError) {
			console.error('Failed to fetch projects:', projectsError);
			return {
				projects: [],
				tableData: [],
				availableTables,
				selectedProjectId: null,
				selectedTable: null,
				error: `Database error: ${projectsError.message}`
			};
		}

		if (!projects) {
			return {
				projects: [],
				tableData: [],
				availableTables,
				selectedProjectId: null,
				selectedTable: null
			};
		}

		console.log('Fetched projects:', projects.length);

		// Default selection logic:
		// 1. Default state: no project selected + table is 'projectTable'
		// 2. If user selects a table (not projectTable) without a project: default to first project + landTable
		// 3. If user selects a project without a table: default to first project + landTable
		let selectedProjectId = projectIdParam;
		let selectedTable = tableParam;

		// Normalize and validate selectedTable in case the URL contains a weird value
		const validTableNames = new Set<string>([
			'projectTable',
			...availableTables.map((t) => t.tableName)
		]);

		// If table is missing or invalid, just show projectTable and clear project
		if (!selectedTable || !validTableNames.has(selectedTable)) {
			selectedTable = 'projectTable';
			selectedProjectId = null;
		}

		// Apply defaults
		if (!selectedProjectId && !selectedTable) {
			// Default state: show projectTable (no project needed)
			selectedTable = 'projectTable';
		} else if (!selectedProjectId && selectedTable && selectedTable !== 'projectTable') {
			// User selected a table but no project - default to first project + landTable
			selectedProjectId = projects[0]?.projectId || null;
			selectedTable = 'landTable';
		} else if (selectedProjectId && !selectedTable) {
			// User selected a project but no table - default to landTable
			selectedTable = 'landTable';
		}

		// Fetch data for the selected table and project
		let tableData: unknown[] = [];
		if (selectedTable === 'projectTable') {
			// Special case: projectTable doesn't need a projectId filter
			console.log('Fetching projectTable (all projects)');
			const { data, error } = await supabase.from('projectTable').select('*').eq('deleted', false);

			if (error) {
				console.error('Failed to fetch projectTable:', error);
			} else if (data) {
				tableData = data;
				console.log('Fetched projectTable:', tableData.length);
			}
		} else if (selectedProjectId && selectedTable) {
			// Validate table name
			if (!availableTables.find((t) => t.tableName === selectedTable)) {
				console.error('Unknown table:', selectedTable);
				return {
					projects,
					tableData: [],
					availableTables,
					selectedProjectId,
					selectedTable,
					error: `Unknown table: ${selectedTable}`
				};
			}

			console.log(`Fetching ${selectedTable} for project:`, selectedProjectId);

			// Query Supabase directly
			const { data, error } = await supabase
				.from(selectedTable)
				.select('*')
				.eq('projectId', selectedProjectId)
				.eq('deleted', false);

			if (error) {
				console.error(`Failed to fetch ${selectedTable}:`, error);
			} else if (data) {
				tableData = data;
				console.log(`Fetched ${selectedTable}:`, tableData.length);
			}
		}

		return {
			projects: projects || [],
			tableData,
			availableTables,
			selectedProjectId,
			selectedTable
		};
	} catch (error) {
		console.error('Error loading dashboard data:', error);
		return {
			projects: [],
			tableData: [],
			availableTables: [],
			selectedProjectId: null,
			selectedTable: null,
			error: error instanceof Error ? error.message : 'Unknown error loading data'
		};
	}
};
