'use server';

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export type ListingType = 'SELL' | 'BUY' | 'LOST' | 'FOUND';

export interface CreateListingData {
	title: string;
	price: number;
	description: string;
	type: ListingType;
	category?: string;
	imageUrl?: string;
}

export async function createListing(data: CreateListingData) {
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error("Unauthorized");

		// Get user profile for universityId
		const { data: profile } = await supabase
			.from('Profile')
			.select('universityId')
			.eq('id', user.id)
			.single();

		if (!profile?.universityId) throw new Error("University profile not found");

		// Append category to description if present, since schema doesn't have it yet
		const finalDescription = data.category
			? `[${data.category}] ${data.description}`
			: data.description;

		const { error } = await supabase.from('MarketplaceListing').insert({
			title: data.title,
			price: data.price,
			description: finalDescription,
			type: data.type,
			imageUrl: data.imageUrl,
			scope: 'CAMPUS',
			universityId: profile.universityId,
			sellerId: user.id,
			status: 'ACTIVE'
		});

		if (error) throw error;

		revalidatePath('/marketplace');
		return { success: true };
	} catch (error) {
		console.error("Error creating listing:", error);
		return { success: false, error: "Failed to create listing" };
	}
}

export async function getListings({
	scope = 'campus',
	types = ['SELL'],
	search = ''
}: {
	scope?: 'campus' | 'universe',
	types?: ListingType[],
	search?: string
}) {
	try {
		let query = supabase
			.from('MarketplaceListing')
			.select(`
        *,
        seller:Profile(fullName, avatarUrl, universityId)
      `)
			.in('type', types)
			.eq('status', 'ACTIVE')
			.order('createdAt', { ascending: false });

		// Scope filtering
		if (scope === 'campus') {
			const { data: { user } } = await supabase.auth.getUser();
			if (user) {
				const { data: profile } = await supabase
					.from('Profile')
					.select('universityId')
					.eq('id', user.id)
					.single();

				if (profile?.universityId) {
					query = query.eq('universityId', profile.universityId);
				}
			}
		} else {
			// Universe scope logic if any
		}

		if (search) {
			query = query.ilike('title', `%${search}%`);
		}

		const { data, error } = await query;
		if (error) throw error;

		return { success: true, data };
	} catch (error) {
		console.error("Error fetching listings:", error);
		return { success: false, start: [], error: "Failed to fetch listings" };
	}
}
