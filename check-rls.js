import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

async function checkPolicy() {
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: { rejectUnauthorized: false }
	});

	try {
		await client.connect();
		const result = await client.query(`
			SELECT policyname, permissive, roles, cmd, qual, with_check 
			FROM pg_policies 
			WHERE tablename = 'MarketplaceListing'
		`);
		console.log(JSON.stringify(result.rows, null, 2));
	} finally {
		await client.end();
	}
}

checkPolicy();
