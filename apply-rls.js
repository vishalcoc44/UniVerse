import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

async function applyPolicies() {
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: { rejectUnauthorized: false }
	});

	try {
		await client.connect();
		console.log("Adding RLS policies for MarketplaceListing...");

		// Insert policy
		await client.query(`
			CREATE POLICY "Users can create their own listings"
			ON "public"."MarketplaceListing"
			FOR INSERT
			TO authenticated
			WITH CHECK (auth.uid()::text = "sellerId");
		`);

		// Update policy
		await client.query(`
			CREATE POLICY "Users can update their own listings"
			ON "public"."MarketplaceListing"
			FOR UPDATE
			TO authenticated
			USING (auth.uid()::text = "sellerId")
			WITH CHECK (auth.uid()::text = "sellerId");
		`);

		// Delete policy
		await client.query(`
			CREATE POLICY "Users can delete their own listings"
			ON "public"."MarketplaceListing"
			FOR DELETE
			TO authenticated
			USING (auth.uid()::text = "sellerId");
		`);

		console.log("RLS policies added successfully.");
	} catch (e) {
		console.error("Error applying policies:", e);
	} finally {
		await client.end();
	}
}

applyPolicies();
