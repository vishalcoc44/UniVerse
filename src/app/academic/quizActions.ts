'use server';

import { createClient } from "@/lib/server-supabase";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { rateLimit } from "@/lib/rate-limit";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateQuizAction(topic: string, courseId?: string) {
	try {
		const supabase = await createClient();
		const { data: { user } } = await supabase.auth.getUser();

		if (!user) {
			return { success: false, error: "Unauthorized" };
		}

		// FC-19: 10 quiz generations per 5 minutes per user
		const r = rateLimit(`ai-quiz:${user.id}`, { maxRequests: 10, windowMs: 5 * 60_000 });
		if (!r.allowed) return { success: false, error: `Too many requests. Try again in ${r.resetInSeconds}s.` };

		const model = genAI.getGenerativeModel({
			model: "gemini-2.5-flash",
			generationConfig: {
				responseMimeType: "application/json"
			}
		});

		const prompt = `Generate a 5-question multiple choice quiz on the topic: "${topic}". Make it challenging but fair for a university level student. Ensure the correct answer is exactly one of the options.
Return ONLY valid JSON that strictly matches this structure without any markdown backticks:
{
  "title": "Topic Quiz",
  "questions": [
    {
      "question": "The question text?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Why A is correct"
    }
  ]
}`;

		const result = await model.generateContent(prompt);
		const text = result.response.text();
		const quizData = JSON.parse(text);

		// 1. Save Quiz
		const { data: quiz, error: quizError } = await supabase
			.from('Quiz')
			.insert({
				title: quizData.title,
				userId: user.id,
				courseId: courseId || null,
			})
			.select()
			.single();

		if (quizError) throw quizError;

		// 2. Save Questions
		const questionsToInsert = quizData.questions.map((q: any) => ({
			quizId: quiz.id,
			question: q.question,
			options: q.options,
			correctAnswer: q.correctAnswer,
			explanation: q.explanation
		}));

		const { error: questionsError } = await supabase
			.from('QuizQuestion')
			.insert(questionsToInsert);

		if (questionsError) throw questionsError;

		revalidatePath('/academic');

		// Return structured data to the client
		return {
			success: true,
			quiz: {
				id: quiz.id,
				title: quizData.title,
				questions: questionsToInsert
			}
		};

	} catch (error: any) {
		console.error("Error generating quiz:", error?.message || error);
		return { success: false, error: "Failed to generate quiz." };
	}
}

export async function saveQuizAttemptAction(quizId: string, score: number, totalQuestions: number) {
	try {
		const supabase = await createClient();
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error("Unauthorized");

		const { error } = await supabase
			.from('QuizAttempt')
			.insert({
				quizId,
				userId: user.id,
				score,
				totalQuestions
			});

		if (error) throw error;

		revalidatePath('/academic');
		return { success: true };
	} catch (error: any) {
		console.error("Error saving quiz attempt:", error?.message || error);
		return { success: false, error: "Failed to save quiz attempt." };
	}
}

export async function getQuizzesAction(courseId?: string) {
	try {
		const supabase = await createClient();
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error("Unauthorized");

		let query = supabase
			.from('Quiz')
			.select(`
                *,
                questions:QuizQuestion(*),
                attempts:QuizAttempt(*)
            `)
			.eq('userId', user.id)
			.order('createdAt', { ascending: false });

		if (courseId) {
			query = query.eq('courseId', courseId);
		}

		const { data, error } = await query;

		if (error) throw error;

		return { success: true, quizzes: data };
	} catch (error: any) {
		console.error("Error fetching quizzes:", error?.message || error);
		return { success: false, error: "Failed to fetch quizzes." };
	}
}
