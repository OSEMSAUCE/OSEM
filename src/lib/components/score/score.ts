// Make this score algorithm here.
import { supabase } from "../../supabase";

// count all the fields from the score related tables including:
const relevantTables = ["ProjectTable", "LandTable", "PlantingTable", "PolyTable", "OrganizationLocalTable", "StakeholderTable", "SourceTable"];

const result: any[] = [];

relevantTables.forEach((table) => {
	const { data, error } = supabase.from(table).select("*");
	let count = 0;
	Object.keys(data).forEach((key) => {
		count += 1;
	});
	result.push({ table: count });
});

console.log(`🌏️ and` + result);
// const { data, error } = supabase.from("your_table_name").select("*");

// I need a method here that takes a
// score
