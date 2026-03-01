'use server';

import { createClient } from "@/lib/server-supabase";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function saveNoteAction(title: string, content: string, noteId?: string, courseId?: string) {
	try {
		const supabase = await createClient();
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error("Unauthorized");

		if (noteId) {
			const { error } = await supabase
				.from('Note')
				.update({ title, content, updatedAt: new Date().toISOString() })
				.eq('id', noteId)
				.eq('userId', user.id);

			if (error) throw error;
			revalidatePath('/academic');
			return { success: true, noteId };
		} else {
			const { data, error } = await supabase
				.from('Note')
				.insert({
					title,
					content,
					userId: user.id,
					courseId: courseId || null,
				})
				.select()
				.single();

			if (error) throw error;
			revalidatePath('/academic');
			return { success: true, noteId: data.id };
		}
	} catch (error: any) {
		console.error("Error saving note:", error);
		return { success: false, error: error.message };
	}
}

export async function getNotesAction(courseId?: string) {
	try {
		const supabase = await createClient();
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error("Unauthorized");

		let query = supabase
			.from('Note')
			.select('*')
			.eq('userId', user.id)
			.order('updatedAt', { ascending: false });

		if (courseId) {
			query = query.eq('courseId', courseId);
		}

		const { data, error } = await query;
		if (error) throw error;

		return { success: true, notes: data };
	} catch (error: any) {
		console.error("Error fetching notes:", error);
		return { success: false, error: error.message };
	}
}

export async function summarizeTextAction(text: string) {
	try {
		const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
		const prompt = `Summarize the following academic notes into concise, easy-to-read bullet points:\n\n${text}`;

		const result = await model.generateContent(prompt);
		return { success: true, summary: result.response.text() };
	} catch (error: any) {
		console.error("Error summarizing text:", error);
		return { success: false, error: error.message };
	}
}

export async function explainConceptAction(concept: string) {
	try {
		const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
		const prompt = `Explain the following academic concept clearly and simply as if teaching a university student. Provide analogies if helpful:\n\n${concept}`;

		const result = await model.generateContent(prompt);
		return { success: true, explanation: result.response.text() };
	} catch (error: any) {
		console.error("Error explaining concept:", error);
		return { success: false, error: error.message };
	}
}
