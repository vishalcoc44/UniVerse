'use server';

import { createClient } from "@/lib/server-supabase";
import { revalidatePath } from "next/cache"; // Removed cookies import as per recent changes not using it directly here in imports seen
// import pdf from 'pdf-parse'; // Will be imported dynamically to avoid build issues with fs
import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function chatAction(history: { role: 'user' | 'assistant'; content: string }[]) {
	try {
		const supabase = await createClient();
		const userMsg = history[history.length - 1].content;

		// 1. Generate Query Embedding using dedicated embedding model
		// gemini-2.5-flash is for text generation ONLY — use gemini-embedding-001 for embeddings
		let embedding: number[] | null = null;
		try {
			const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
			// RETRIEVAL_QUERY task type optimizes the embedding for semantic question answering
			const result = await embeddingModel.embedContent({
				content: { parts: [{ text: userMsg }], role: "user" },
				taskType: TaskType.RETRIEVAL_QUERY,
			});
			embedding = result?.embedding?.values || null;
			console.log("DEBUG: Generated query embedding, dimensions:", embedding?.length);
		} catch (embedErr: any) {
			console.warn("Embedding failed (falling back to no-context generation):", embedErr?.message || embedErr);
			embedding = null;
		}

		// 2. Retrieve Context (Vector Search) if embedding succeeded
		let documents: any[] | null = null;
		if (embedding && Array.isArray(embedding)) {
			try {
				console.log("DEBUG: Running vector search for query:", userMsg.substring(0, 50) + "...");
				const rpcResult = await supabase.rpc('match_documents', {
					query_embedding: embedding,
					match_threshold: 0.1, // Lower threshold = more permissive = more context retrieved
					match_count: 8       // More chunks = richer context for the AI
				});
				documents = (rpcResult as any).data || null;
				if ((rpcResult as any).error) console.error("DEBUG: Vector Search Error:", (rpcResult as any).error);
				else console.log("DEBUG: Vector Search Results:", documents?.length || 0, "documents found");
			} catch (vecErr: any) {
				console.error("Vector search RPC failed, continuing without context:", vecErr?.message || vecErr);
				documents = null;
			}
		} else {
			console.log("Skipping vector search because embedding is not available.");
		}

		const contextText = documents?.map((d: { content: string }) => d.content).join("\n---\n") || "";
		console.log("DEBUG: Final Context Length:", contextText.length);

		// 3. Augment System Prompt
		const hasContext = contextText.length > 0;
		const systemInstructionText = hasContext
			? `You are an expert academic AI tutor. The user has uploaded study materials.

Answer the user's question using ONLY the context below from their uploaded notes.
Be specific, cite details from the context, and be thorough. Do NOT say the answer is not in the notes if you can find it.

--- CONTEXT FROM UPLOADED NOTES ---
${contextText}
--- END CONTEXT ---`
			: `You are an expert academic AI tutor. Help the user study and learn. No uploaded notes context is available, so answer from your general knowledge.`;

		// 4. Generate Response
		// Re-initialize model with specific system instruction for this turn
		const model = genAI.getGenerativeModel({
			model: "gemini-2.5-flash",
			systemInstruction: {
				parts: [{ text: systemInstructionText }],
				role: "model"
			}
		});

		const chat = model.startChat({
			history: history.slice(0, -1).map(m => ({
				role: m.role === 'user' ? 'user' : 'model', // Gemini uses 'model'
				parts: [{ text: m.content }]
			}))
		});

	const msgResult = await chat.sendMessage(userMsg);
		const response = msgResult.response.text();

		return { success: true, response };

	} catch (error: any) {
		console.error("Chat Server Action Error:", error);
		return { success: false, error: error.message };
	}
}


export interface ChatMessage {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	createdAt: string;
}

export async function getOrCreateChat() {
	try {
		const supabase = await createClient();
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return { success: false, error: "Unauthorized" };

		// Try to find the most recent chat from today/active
		// For simplicity, let's just get the last created chat
		const { data: chats } = await supabase
			.from('AcademicAIChat')
			.select('*')
			.eq('userId', user.id)
			.order('updatedAt', { ascending: false })
			.limit(1);

		let chatId;
		let messages: ChatMessage[] = [];

		if (chats && chats.length > 0) {
			chatId = chats[0].id;
			// Fetch messages
			const { data: msgs } = await supabase
				.from('AcademicAIChatMessage')
				.select('*')
				.eq('chatId', chatId)
				.order('createdAt', { ascending: true });

			if (msgs) {
				messages = msgs.map(m => ({
					id: m.id,
					role: m.role as 'user' | 'assistant',
					content: m.content,
					createdAt: m.createdAt
				}));
			}
		} else {
			// Create new chat
			const { data: newChat, error } = await supabase
				.from('AcademicAIChat')
				.insert({
					userId: user.id,
					title: "New Study Session"
				})
				.select()
				.single();

			if (error) throw error;
			chatId = newChat.id;
		}

		return { success: true, chatId, messages };
	} catch (error: any) {
		console.error("Error in getOrCreateChat:", error);
		return { success: false, error: error.message };
	}
}

export async function saveChatMessage(chatId: string, role: 'user' | 'assistant', content: string) {
	try {
		const supabase = await createClient();
		const { error } = await supabase
			.from('AcademicAIChatMessage')
			.insert({
				chatId,
				role,
				content
			});

		if (error) throw error;

		// Update chat updatedAt
		await supabase
			.from('AcademicAIChat')
			.update({ updatedAt: new Date().toISOString() })
			.eq('id', chatId);

		return { success: true };
	} catch (error: any) {
		console.error("Error saving message:", error);
		return { success: false, error: error.message };
	}
}

export async function getResources(universityId: string) {
	try {
		const supabase = await createClient();
		const { data, error } = await supabase
			.from('Resource')
			.select(`
				*,
				course:Course!inner(code, universityId),
				uploader:Profile(fullName, username, avatarUrl)
			`)
			.eq('course.universityId', universityId)
			.order('createdAt', { ascending: false });

		if (error) throw error;
		return { success: true, resources: data };
	} catch (error: any) {
		console.error("Error fetching resources:", error);
		return { success: false, error: error.message };
	}
}

export async function voteResource(resourceId: string) {
	try {
		const supabase = await createClient();
		// Simple increment for now as schema support for individual tracking is pending
		const { error } = await supabase.rpc('increment_resource_upvotes', { row_id: resourceId });

		// Fallback if RPC doesn't exist (likely doesn't)
		if (error) {
			// Fetch current, increment, update (race condition possible but acceptable for MVP)
			const { data } = await supabase.from('Resource').select('upvotes').eq('id', resourceId).single();
			if (data) {
				await supabase.from('Resource').update({ upvotes: (data.upvotes || 0) + 1 }).eq('id', resourceId);
			}
		}

		revalidatePath('/academic');
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function generateFlashcardsAction(topic: string) {
	try {
		// Mock implementation for now as we transition from Edge Functions
		// In production, this would call the AI model via Google Generative AI SDK
		// simulating AI response for "Wow" factor
		const mockCards = [
			{ front: `What is ${topic}?`, back: `${topic} is a key concept in this field.` },
			{ front: `Key principle of ${topic}`, back: "It involves understanding the core mechanisms." },
			{ front: `Who discovered ${topic}?`, back: "Various researchers have contributed to this." },
			{ front: `Application of ${topic}`, back: "Used in real-world scenarios extensively." },
			{ front: `Advanced ${topic}`, back: "Requires deeper study of underlying theories." }
		];

		// Simulate delay
		await new Promise(resolve => setTimeout(resolve, 1500));

		return { success: true, flashcards: mockCards };
	} catch (error: any) {
		console.error("Error generating flashcards:", error);
		return { success: false, error: error.message };
	}
}

export async function getStudyGroups(universityId: string) {
	try {
		const supabase = await createClient();
		const { data, error } = await supabase
			.from('StudyGroup')
			.select(`
				*,
				members:StudyGroupMember(count)
			`)
			.eq('universityId', universityId)
			.order('createdAt', { ascending: false });

		if (error) throw error;

		// Format for UI
		const groups = data.map(g => ({
			id: g.id,
			name: g.name,
			description: g.description,
			memberCount: g.members[0]?.count || 0
		}));

		return { success: true, groups };
	} catch (error: any) {
		console.error("Error fetching study groups:", error);
		return { success: false, error: error.message };
	}
}

export async function createStudyGroup(data: { name: string; description: string; universityId: string }) {
	try {
		console.log("Creating study circle started...");
		const supabase = await createClient();

		const { data: { user }, error: authError } = await supabase.auth.getUser();

		if (authError) {
			console.error("Auth Error details:", authError);
		}

		if (!user) {
			console.error("No user found in session.");
			// Log cookies to debug if needed (be careful with secrets, just checking existence)
			// const cookieStore = await cookies();
			// console.log("Cookies present:", cookieStore.getAll().map(c => c.name));
			throw new Error("Unauthorized - Please log in again");
		}

		console.log("User authenticated:", user.id);

		const { data: group, error } = await supabase
			.from('StudyGroup')
			.insert({
				...data,
				isPublic: true
			})
			.select()
			.single();

		if (error) {
			console.error("Database Insert Error:", error);
			throw error;
		}

		// Add creator as member (admin)
		await supabase.from('StudyGroupMember').insert({
			studyGroupId: group.id,
			userId: user.id,
			role: "ADMIN"
		});

		revalidatePath('/academic');
		return { success: true, group };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function joinStudyGroup(groupId: string) {
	try {
		const supabase = await createClient();
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error("Unauthorized");

		const { error } = await supabase.from('StudyGroupMember').insert({
			studyGroupId: groupId,
			userId: user.id,
			role: "MEMBER"
		});

		if (error) {
			if (error.code === '23505') return { success: false, error: "Already a member" }; // Unique violation
			throw error;
		}

		revalidatePath('/academic');
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

export async function createResource(data: {
	title: string;
	fileUrl: string;
	type: string;
	courseId: string;
	universityId: string;
}) {
	try {
		const supabase = await createClient();
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error("Unauthorized");

		// 1. Create Resource Entry
		const { data: resource, error } = await supabase.from('Resource').insert({
			title: data.title,
			fileUrl: data.fileUrl,
			type: 'NOTE',
			courseId: data.courseId,
			uploaderId: user.id,
			upvotes: 0
		}).select().single();

		if (error) throw error;

		// 2. RAG Processing (Background-like)
		// We catch errors here so we don't fail the upload if RAG fails
		try {
			if (data.fileUrl.endsWith('.pdf')) {
				console.log("Starting RAG processing for:", data.title);

				// A. Download file
				const filePath = data.fileUrl.split('/').pop(); // simplistic extraction
				// Need robust path extraction. The URL is public, so we can fetch it usually.
				// Or use storage download if private. Assuming public URL for now based on previous code.
				const response = await fetch(data.fileUrl);
				const arrayBuffer = await response.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);

				// B. Extract Text
				// Check if pdf-parse is importable (server-side only)
				const pdfModule = await import('pdf-parse');
				const pdf = (pdfModule as any).default || pdfModule;
				const pdfData = await (pdf as any)(buffer);
				const text = pdfData.text;

				// C. Chunk Text (500 chars with ~50 char overlap for better retrieval coverage)
				const rawChunks = text.match(/[\s\S]{1,500}/g) || [];
				// Remove chunks that are mostly whitespace/numbers (low information)
				const chunks = rawChunks.filter((c: string) => c.trim().length > 50);
				console.log(`DEBUG: Extracted ${chunks.length} usable chunks from PDF.`);

				// D. Generate Embeddings & Store using dedicated gemini-embedding-001 model
				// IMPORTANT: Use gemini-embedding-001 for documents (RETRIEVAL_DOCUMENT task type)
				const embModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

				let chunkCount = 0;
				for (const chunk of chunks.slice(0, 30)) { // Process up to 30 chunks
					try {
						// RETRIEVAL_DOCUMENT task type optimizes for document indexing
						const result = await embModel.embedContent({
							content: { parts: [{ text: chunk }], role: "user" },
							taskType: TaskType.RETRIEVAL_DOCUMENT,
						});
						const embedding = result?.embedding?.values || null;
						if (embedding) {
							await supabase.from('ResourceEmbedding').insert({
								resourceId: resource.id,
								content: chunk,
								embedding // Supabase pgvector handles the array
							});
							chunkCount++;
						} else {
							console.warn("Embedding not returned for chunk, skipping storage.");
						}
					} catch (chunkErr: any) {
						console.warn("Embedding failed for a chunk, skipping it:", chunkErr?.message || chunkErr);
						continue; // proceed with next chunk
					}
				}
				console.log(`DEBUG: Successfully embedded and stored ${chunkCount} chunks.`);
			}
		} catch (ragError) {
			console.error("RAG Processing Warning:", ragError);
			// Don't fail the whole request
		}

		revalidatePath('/academic');
		return { success: true };
	} catch (error: any) {
		console.error("Error creating resource:", error);
		return { success: false, error: error.message };
	}
}

export async function deleteResource(resourceId: string) {
	try {
		const supabase = await createClient();
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error("Unauthorized");

		// Check ownership
		const { data: resource, error: fetchError } = await supabase
			.from('Resource')
			.select('uploaderId')
			.eq('id', resourceId)
			.single();

		if (fetchError || !resource) throw new Error("Resource not found");
		if (resource.uploaderId !== user.id) throw new Error("You can only delete your own resources");

		// Delete (Cascades to Embeddings)
		const { error: deleteError } = await supabase
			.from('Resource')
			.delete()
			.eq('id', resourceId);

		if (deleteError) throw deleteError;

		revalidatePath('/academic');
		return { success: true };
	} catch (error: any) {
		console.error("Error deleting resource:", error);
		return { success: false, error: error.message };
	}
}

