'use server';

import { createClient } from "@/lib/server-supabase";
import { revalidatePath } from "next/cache";

export type ListingType = 'SELL' | 'BUY' | 'LOST' | 'FOUND';

export interface CreateListingData {
	title: string;
	price: number;
	description: string;
	type: ListingType;
	scope?: 'CAMPUS' | 'UNIVERSE';
	category?: string;
	imageUrl?: string;
}

export async function createListing(data: CreateListingData) {
	const supabase = await createClient();
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

		const { error } = await supabase.from('MarketplaceListing').insert({
			id: crypto.randomUUID(),
			title: data.title,
			price: data.price,
			description: data.description,
			type: data.type,
			imageUrl: data.imageUrl,
			category: data.category || null,
			scope: data.scope || 'CAMPUS',
			universityId: profile.universityId,
			sellerId: user.id,
			status: 'ACTIVE'
		});

		if (error) throw error;

		revalidatePath('/marketplace');
		return { success: true };
	} catch (error: any) {
		console.error("Error creating listing:", error);
		return { success: false, error: error?.message || "Failed to create listing" };
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
	const supabase = await createClient();
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
			// In universe mode, only show items explicitly marked as UNIVERSE
			query = query.eq('scope', 'UNIVERSE');
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

export async function updateListing(id: string, data: {
	title?: string;
	price?: number;
	description?: string;
	category?: string;
	imageUrl?: string;
	scope?: 'CAMPUS' | 'UNIVERSE';
}) {
	const supabase = await createClient();
	try {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error("Unauthorized");

		const updates: any = {};
		if (data.title !== undefined) updates.title = data.title;
		if (data.price !== undefined) updates.price = data.price;
		if (data.imageUrl !== undefined) updates.imageUrl = data.imageUrl;
		if (data.scope !== undefined) updates.scope = data.scope;
		if (data.description !== undefined) updates.description = data.description;
		if (data.category !== undefined) updates.category = data.category;

		const { error } = await supabase
			.from('MarketplaceListing')
			.update(updates)
			.eq('id', id)
			.eq('sellerId', user.id);

		if (error) throw error;

		revalidatePath('/marketplace');
		return { success: true };
	} catch (error: any) {
		console.error("Error updating listing:", error);
		return { success: false, error: error?.message || "Failed to update listing" };
	}
}
