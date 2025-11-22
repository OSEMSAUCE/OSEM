// Crop entity type definition - matches cropTable schema

export interface Crop {
	cropId: string;
	cropName: string;
	projectId?: string;
	speciesLocalName?: string;
	speciesId?: string;
	seedInfo?: string;
	cropStock?: string;
	createdAt?: string;
	lastEditedAt?: string;
	editedBy?: string;
	deleted?: boolean;
	organizationLocalName?: string;
	cropNotes?: string;

	// Joined data from related tables
	projectName?: string; // From projectTable
}

export interface CropFilter {
	searchQuery?: string;
	projectId?: string;
	speciesLocalName?: string;
}
