import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

async function checkTable() {
	if (!process.env.DATABASE_URL) {
		console.error("No DATABASE_URL");
		process.exit(1);
	}

	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: { rejectUnauthorized: false }
	});

	try {
		await client.connect();
		const result = await client.query(`
			SELECT column_name, data_type 
			FROM information_schema.columns 
			WHERE table_name ILIKE '%Marketplace%'
		`);
		console.log("Columns:", result.rows);
	} finally {
		await client.end();
	}
}

checkTable();
