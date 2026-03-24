'use server';

import { createClient } from "@/lib/server-supabase";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateStudyPlanAction(data: {
	title: string;
	targetGpa?: number;
	topics: string;
	examDate: string;
	hoursPerDay: number;
	courseId?: string;
}) {
	try {
		const supabase = await createClient();
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error("Unauthorized");

		const model = genAI.getGenerativeModel({
			model: "gemini-2.5-flash",
			generationConfig: {
				responseMimeType: "application/json"
			}
		});

		const prompt = `You are an expert academic advisor. Create a study plan for a university student.
Title of Goal: ${data.title}
Topics to Cover: ${data.topics}
Target Exam Date: ${data.examDate}
Available Study Time per Day: ${data.hoursPerDay} hours

Generate a structured daily study plan starting from tomorrow up to the exam date. Break down the topics into manageable daily sessions. Make the plan realistic.

Return ONLY valid JSON that strictly matches this structure without markdown backticks:
{
  "planTitle": "Structured study plan title",
  "sessions": [
    {
      "date": "YYYY-MM-DD",
      "durationMinutes": 120,
      "topic": "Specific sub-topic to study today"
    }
  ]
}`;

		const result = await model.generateContent(prompt);
		const text = result.response.text();
		const planData = JSON.parse(text);

		// 1. Create StudyPlan
		const { data: studyPlan, error: planError } = await supabase
			.from('StudyPlan')
			.insert({
				title: planData.planTitle || data.title,
				targetGpa: data.targetGpa || null,
				userId: user.id
			})
			.select()
			.single();

		if (planError) throw planError;

		// 2. Create StudyPlanSessions
		const sessionsToInsert = planData.sessions.map((s: any) => ({
			planId: studyPlan.id,
			courseId: data.courseId || null,
			date: new Date(s.date).toISOString(),
			durationMinutes: s.durationMinutes,
			topic: s.topic,
			completed: false
		}));

		const { error: sessionError } = await supabase
			.from('StudyPlanSession')
			.insert(sessionsToInsert);

		if (sessionError) throw sessionError;

		revalidatePath('/academic');

		return {
			success: true,
			plan: {
				id: studyPlan.id,
				title: studyPlan.title,
				sessions: sessionsToInsert
			}
		};
	} catch (error: any) {
		console.error("Error generating study plan:", error?.message || error);
		return { success: false, error: "Failed to generate study plan." };
	}
}

export async function getStudyPlansAction() {
	try {
		const supabase = await createClient();
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error("Unauthorized");

		const { data, error } = await supabase
			.from('StudyPlan')
			.select(`
                *,
                sessions:StudyPlanSession(*)
            `)
			.eq('userId', user.id)
			.order('createdAt', { ascending: false });

		if (error) throw error;

		return { success: true, plans: data };
	} catch (error: any) {
		console.error("Error fetching study plans:", error?.message || error);
		return { success: false, error: "Failed to fetch study plans." };
	}
}

export async function markSessionCompleteAction(sessionId: string, completed: boolean) {
	try {
		const supabase = await createClient();
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error("Unauthorized");

		// Verify the session belongs to a plan owned by this user
		const { data: session } = await supabase
			.from('StudyPlanSession')
			.select('id, planId, plan:StudyPlan!inner(userId)')
			.eq('id', sessionId)
			.single();

		if (!session || (session as any).plan?.userId !== user.id) {
			return { success: false, error: "Session not found" };
		}

		const { error } = await supabase
			.from('StudyPlanSession')
			.update({ completed })
			.eq('id', sessionId);

		if (error) throw error;

		revalidatePath('/academic');
		return { success: true };
	} catch (error: any) {
		console.error("Error updating session:", error?.message || error);
		return { success: false, error: "Failed to update session." };
	}
}
