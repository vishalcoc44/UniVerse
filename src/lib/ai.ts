import { supabase } from './supabase';

export interface ChatMessage {
	role: 'user' | 'assistant';
	content: string;
}

export const aiService = {
	async chat(messages: ChatMessage[], universityId?: string) {
		try {
			// In a real app, this would be a call to a Supabase Edge Function
			// For now, we'll try to call the Edge Function if it exists, 
			// otherwise we can provide a fetch-based implementation if the key is available
			const { data, error } = await supabase.functions.invoke('academic-ai', {
				body: { messages, universityId },
			});

			if (error) {
				console.warn('Edge function error, falling back to mock:', error);
				return this.mockResponse(messages[messages.length - 1].content);
			}

			return data.response;
		} catch (err) {
			console.error('AI Service Error:', err);
			return this.mockResponse(messages[messages.length - 1].content);
		}
	},

	async generateFlashcards(topic: string) {
		try {
			const { data, error } = await supabase.functions.invoke('generate-flashcards', {
				body: { topic },
			});

			if (error) throw error;
			return data.flashcards;
		} catch (err) {
			console.error('Error generating flashcards:', err);
			return [
				{ front: "Mock Card 1", back: "Mock Answer 1" },
				{ front: "Mock Card 2", back: "Mock Answer 2" },
			];
		}
	},

	mockResponse(input: string) {
		return "I've received your query about \"" + input + "\". I'm currently connecting to my knowledge base to provide a detailed academic response...";
	}
};
