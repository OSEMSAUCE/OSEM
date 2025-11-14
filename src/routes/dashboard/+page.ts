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

		const selectedProjectId = projectIdParam;
		const selectedTable = tableParam;

		// Fetch data for the selected table and project
		let tableData: unknown[] = [];
		if (selectedProjectId && selectedTable) {
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
