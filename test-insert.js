import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testInsert() {
	console.log("Testing insert...");
	try {
		// Just provide some dummy data matching the required schema columns
		const { data, error } = await supabase.from('MarketplaceListing').insert({
			title: 'Test',
			price: 10,
			description: 'Test list',
			type: 'SELL',
			scope: 'CAMPUS',
			sellerId: '00000000-0000-0000-0000-000000000000', // invalid but will reveal schema error or FK error
			status: 'ACTIVE'
		});

		if (error) {
			console.error("Insert failed with error:", error);
		} else {
			console.log("Insert succeeded:", data);
		}
	} catch (e) {
		console.error("Exception:", e);
	}
}

testInsert();
