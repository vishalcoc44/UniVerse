
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Read .env manually
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvValue = (key) => {
	const match = envContent.match(new RegExp(`${key}=(.*)`));
	return match ? match[1].replace(/"/g, '').trim() : null;
};

const url = getEnvValue('VITE_SUPABASE_URL');
const key = getEnvValue('VITE_SUPABASE_ANON_KEY');

if (!url || !key) {
	console.error('Could not find Supabase URL or Key in .env');
	process.exit(1);
}

// 2. Init Supabase
const supabase = createClient(url, key);

async function checkEvent() {
	console.log('Checking Event table structure...');

	// Fetch one event to see columns
	const { data, error } = await supabase
		.from('Event')
		.select('*')
		.limit(1);

	if (error) {
		console.error('Error fetching event:', error);
	} else {
		if (data.length > 0) {
			console.log('Found Event Row. Keys:');
			console.log(JSON.stringify(data[0], null, 2));
		} else {
			console.log('Event table is empty. Attempting to insert dummy to check columns is risky. Just reporting null.');
		}
	}
}

checkEvent();
