'use server';

import { createClient } from "@/lib/server-supabase";
import { revalidatePath } from "next/cache";

export async function getMentors(universityId?: string) {
	try {
		const supabase = await createClient();
		let query = supabase
			.from('MentorProfile')
			.select(`
				*,
				profile:Profile(fullName, avatarUrl, department, universityId, University(name, abbreviation)),
				skills:MentorshipSkill(skill, type)
			`)
			.eq('isActive', true);

		if (universityId) {
			query = query.eq('profile.universityId', universityId);
		}

		const { data, error } = await query;
		if (error) throw error;
		return { success: true, mentors: data };
	} catch (error: any) {
		console.error("Error fetching mentors:", error?.message || error);
		return { success: false, error: "Failed to fetch mentors." };
	}
}

export async function requestMentorship(mentorId: string, message: string) {
	try {
		const supabase = await createClient();
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error("Unauthorized");

		if (!message || message.length > 2000) {
			return { success: false, error: "Message must be between 1 and 2000 characters." };
		}

		const { data: existing } = await supabase
			.from('MentorshipRequest')
			.select('id')
			.eq('menteeId', user.id)
			.eq('mentorId', mentorId)
			.eq('status', 'PENDING')
			.maybeSingle();

		if (existing) {
			return { success: false, error: "You already have a pending request with this mentor" };
		}

		const { error } = await supabase.from('MentorshipRequest').insert({
			menteeId: user.id,
			mentorId,
			message,
			status: 'PENDING',
		});

		if (error) throw error;

		revalidatePath('/career');
		return { success: true };
	} catch (error: any) {
		console.error("Error requesting mentorship:", error?.message || error);
		return { success: false, error: "Failed to send mentorship request." };
	}
}

export async function respondToMentorshipRequest(requestId: string, status: 'ACCEPTED' | 'DECLINED') {
	try {
		const supabase = await createClient();
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error("Unauthorized");

		const { error } = await supabase
			.from('MentorshipRequest')
			.update({ status })
			.eq('id', requestId)
			.eq('mentorId', user.id);

		if (error) throw error;

		revalidatePath('/career');
		return { success: true };
	} catch (error: any) {
		console.error("Error responding to mentorship request:", error?.message || error);
		return { success: false, error: "Failed to respond to request." };
	}
}

export async function getMyMentorshipRequests() {
	try {
		const supabase = await createClient();
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return { success: false, error: "Unauthorized" };

		const { data: sent, error: sentError } = await supabase
			.from('MentorshipRequest')
			.select(`
				*,
				mentor:Profile!MentorshipRequest_mentorId_fkey(fullName, avatarUrl, department)
			`)
			.eq('menteeId', user.id)
			.order('createdAt', { ascending: false });

		const { data: received, error: receivedError } = await supabase
			.from('MentorshipRequest')
			.select(`
				*,
				mentee:Profile!MentorshipRequest_menteeId_fkey(fullName, avatarUrl, department)
			`)
			.eq('mentorId', user.id)
			.order('createdAt', { ascending: false });

		if (sentError) throw sentError;
		if (receivedError) throw receivedError;

		return { success: true, sent: sent || [], received: received || [] };
	} catch (error: any) {
		console.error("Error fetching mentorship requests:", error?.message || error);
		return { success: false, error: "Failed to fetch mentorship requests." };
	}
}

export async function scheduleMentorshipSession(data: {
	requestId: string;
	scheduledAt: string;
	duration: number;
	meetLink?: string;
	notes?: string;
}) {
	try {
		const supabase = await createClient();
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error("Unauthorized");

		const { error } = await supabase.from('MentorshipSession').insert({
			requestId: data.requestId,
			scheduledAt: data.scheduledAt,
			duration: data.duration,
			meetLink: data.meetLink || null,
			notes: data.notes || null,
			status: 'SCHEDULED',
		});

		if (error) throw error;

		revalidatePath('/career');
		return { success: true };
	} catch (error: any) {
		console.error("Error scheduling session:", error?.message || error);
		return { success: false, error: "Failed to schedule session." };
	}
}
