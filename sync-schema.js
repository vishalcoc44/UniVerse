import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;
const OUTPUT_DIR = './supabase/current_schema';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
	fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Map your filenames to the specific SQL queries (raw - no json_agg needed, we handle output directly)
const tasks = [
	{ file: 'All_RLS_Policies.json', sql: 'SELECT * FROM pg_policies' },
	{ file: 'All_Constraints.json', sql: "SELECT * FROM information_schema.table_constraints WHERE table_schema = 'public'" },
	{ file: 'All_Triggers.json', sql: "SELECT * FROM information_schema.triggers WHERE event_object_schema = 'public'" },
	{ file: 'tables_dump.json', sql: "SELECT table_name, column_name, data_type, column_default FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position" },
	{ file: 'All_Functions.json', sql: "SELECT proname, pg_get_functiondef(p.oid) as definition FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public'" },
	{ file: 'Storage_Buckets.json', sql: "SELECT * FROM storage.buckets" },
	{
		file: 'All_Types.json',
		sql: `SELECT t.typname as type_name, e.enumlabel as enum_value
          FROM pg_type t
          LEFT JOIN pg_enum e ON t.oid = e.enumtypid
          JOIN pg_namespace n ON t.typnamespace = n.oid
          WHERE n.nspname = 'public'
          ORDER BY t.typname, e.enumsortorder`
	}
];

async function sync() {
	if (!process.env.DATABASE_URL) {
		console.error("❌ No DATABASE_URL found in .env");
		process.exit(1);
	}

	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: { rejectUnauthorized: false }
	});

	try {
		await client.connect();
		console.log("🚀 Connected to Supabase. Syncing schema to JSON...\n");

		for (const { file, sql } of tasks) {
			try {
				const result = await client.query(sql);
				const output = JSON.stringify(result.rows, null, 2);
				fs.writeFileSync(path.join(OUTPUT_DIR, file), output);
				console.log(`✅ Updated ${file} (${result.rows.length} rows)`);
			} catch (err) {
				console.error(`❌ Failed ${file}: ${err.message}`);
			}
		}

		console.log("\n✨ All files updated. No more copy-pasting!");
	} finally {
		await client.end();
	}
}

sync();
