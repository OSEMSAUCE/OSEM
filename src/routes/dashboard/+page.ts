import type { PageLoad } from './$types';
import { supabase } from '$lib/supabase';
import {
	mockProjects,
	mockLands,
	mockCrops,
	mockPlantings,
	mockAvailableTables
} from '$lib/data/mockData';

// Disable SSR to fix bits-ui portal issue
export const ssr = false;

export const load: PageLoad = async ({ url }) => {
	// Get project ID and table name from URL parameters
	const projectIdParam = url.searchParams.get('project');
	const tableParam = url.searchParams.get('table');

	// Use mock data if Supabase not configured
	if (!supabase) {
		console.log('Using mock data (Supabase not configured)');
		return loadMockData(projectIdParam, tableParam);
	}

	try {
		// Available tables with projectId column
		const availableTables = [
			{ tableName: 'landTable' },
			{ tableName: 'cropTable' },
			{ tableName: 'plantingTable' },
			{ tableName: 'polyTable' },
			{ tableName: 'stakeholderTable' }
		];

		// Fetch all projects from Supabase
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

		// Default selection logic
		let selectedProjectId = projectIdParam;
		let selectedTable = tableParam;

		const validTableNames = new Set<string>([
			'projectTable',
			...availableTables.map((t) => t.tableName)
		]);

		if (!selectedTable || !validTableNames.has(selectedTable)) {
			selectedTable = 'projectTable';
			selectedProjectId = null;
		}

		if (!selectedProjectId && !selectedTable) {
			selectedTable = 'projectTable';
		} else if (!selectedProjectId && selectedTable && selectedTable !== 'projectTable') {
			selectedProjectId = projects[0]?.projectId || null;
			selectedTable = 'landTable';
		} else if (selectedProjectId && !selectedTable) {
			selectedTable = 'landTable';
		}

		// Fetch data for the selected table
		let tableData: unknown[] = [];
		if (selectedTable === 'projectTable') {
			const { data, error } = await supabase.from('projectTable').select('*').eq('deleted', false);
			if (!error && data) tableData = data;
		} else if (selectedProjectId && selectedTable) {
			if (!availableTables.find((t) => t.tableName === selectedTable)) {
				return {
					projects,
					tableData: [],
					availableTables,
					selectedProjectId,
					selectedTable,
					error: `Unknown table: ${selectedTable}`
				};
			}

			const { data, error } = await supabase
				.from(selectedTable)
				.select('*')
				.eq('projectId', selectedProjectId)
				.eq('deleted', false);

			if (!error && data) tableData = data;
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

function loadMockData(projectIdParam: string | null, tableParam: string | null) {
	const availableTables = mockAvailableTables;

	let selectedProjectId = projectIdParam;
	let selectedTable = tableParam;

	const validTableNames = new Set<string>([
		'projectTable',
		...availableTables.map((t) => t.tableName)
	]);

	if (!selectedTable || !validTableNames.has(selectedTable)) {
		selectedTable = 'projectTable';
		selectedProjectId = null;
	}

	if (!selectedProjectId && !selectedTable) {
		selectedTable = 'projectTable';
	} else if (!selectedProjectId && selectedTable && selectedTable !== 'projectTable') {
		selectedProjectId = mockProjects[0]?.projectId?.toString() || null;
		selectedTable = 'landTable';
	} else if (selectedProjectId && !selectedTable) {
		selectedTable = 'landTable';
	}

	// Get table data
	let tableData: unknown[] = [];
	const projectId = selectedProjectId ? parseInt(selectedProjectId) : null;

	if (selectedTable === 'projectTable') {
		tableData = mockProjects;
	} else if (projectId && selectedTable === 'landTable') {
		tableData = mockLands.filter((l) => l.projectId === projectId);
	} else if (projectId && selectedTable === 'cropTable') {
		tableData = mockCrops.filter((c) => c.projectId === projectId);
	} else if (projectId && selectedTable === 'plantingTable') {
		tableData = mockPlantings.filter((p) => p.projectId === projectId);
	}

	return {
		projects: mockProjects,
		tableData,
		availableTables,
		selectedProjectId,
		selectedTable
	};
}
