import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET() {
	try {
		const imagesDirectory = path.join(process.cwd(), 'public/images');
		const filenames = fs.readdirSync(imagesDirectory);

		const images = filenames
			.filter(file => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file))
			.map(file => `/images/${file}`);

		return NextResponse.json(images);
	} catch (error: any) {
		console.error('API /api/images error:', error.message || error);
		return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
	}
}
