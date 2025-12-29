'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ConversationList } from "@/components/messages/ConversationList";
import { ChatWindow } from "@/components/messages/ChatWindow";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { MessageSquareDashed, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { UserSearchModal } from "@/components/messages/UserSearchModal";
import { useRouter } from "next/navigation";

interface Profile {
	id: string;
	fullName: string;
	avatarUrl: string | null;
}

interface Participant {
	user: Profile | null;
}

interface Message {
	content: string;
	createdAt: string;
}

interface RawConversation {
	id: string;
	input: Participant[];
	messages: Message[];
}

export default function Messages() {
	const router = useRouter();
	const [activeChatId, setActiveChatId] = useState<string | null>(null);

	interface UIConversation {
		id: string;
		name: string;
		avatar: string;
		lastMessage: string;
		time: string;
		unreadCount: number;
		online: boolean;
	}

	const [conversations, setConversations] = useState<UIConversation[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentUser, setCurrentUser] = useState<any>(null); // Supabase user type is complex, 'any' is acceptable or User
	const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);

	useEffect(() => {
		const fetchConversations = async () => {
			setLoading(true);
			const { data: { user } } = await supabase.auth.getUser();

			if (user) {
				setCurrentUser(user);
				// 1. Get conversations user is part of
				const { data: myConvos } = await supabase
					.from('ConversationParticipant')
					.select('conversationId')
					.eq('userId', user.id);

				const conversationIds = myConvos?.map(c => c.conversationId) || [];

				if (conversationIds.length > 0) {
					// 2. Fetch conversation details, participants, and latest message
					const { data: convos } = await supabase
						.from('Conversation')
						.select(`
							id,
							input:ConversationParticipant(
								user:Profile(id, fullName, avatarUrl)
							),
							messages:Message(content, createdAt)
						`)
						.in('id', conversationIds)
						.order('updatedAt', { ascending: false });

					// Cast supabase result to unknown first then to our type to avoid strict mismatch if needed, or rely on inference
					const typedConvos = convos as unknown as RawConversation[] | null;

					if (typedConvos) {
						// Process data to match UI expectations
						const formatted = typedConvos.map(c => {
							// Find the "other" participant
							const otherParticipant = c.input?.find((p) => p.user?.id !== user.id)?.user;
							// Find latest message
							const lastMsg = c.messages?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

							return {
								id: c.id,
								name: otherParticipant?.fullName || "Unknown User",
								avatar: otherParticipant?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant?.fullName || "Unknown User")}&background=random`,
								lastMessage: lastMsg?.content || "No messages yet",
								time: lastMsg ? new Date(lastMsg.createdAt).toLocaleDateString() : "",
								unreadCount: 0,
								online: false
							};
						});
						setConversations(formatted);
					}
				}
			}
			setLoading(false);
		};

		fetchConversations();
	}, []);

	const handleNewChat = () => {
		setIsUserSearchOpen(true);
	};

	const handleSelectUser = async (userId: string) => {
		setIsUserSearchOpen(false);
		if (!currentUser) return;

		// Check if conversation exists
		// 1. Get my conversations
		const { data: myConvos } = await supabase
			.from('ConversationParticipant')
			.select('conversationId')
			.eq('userId', currentUser.id);

		const myConvoIds = myConvos?.map(c => c.conversationId) || [];

		if (myConvoIds.length > 0) {
			// 2. Check if other user is in any of these
			const { data: existing } = await supabase
				.from('ConversationParticipant')
				.select('conversationId')
				.eq('userId', userId)
				.in('conversationId', myConvoIds)
				.maybeSingle();

			if (existing) {
				setActiveChatId(existing.conversationId);
				return;
			}
		}

		// Create new conversation
		const { data: newConvo, error: createError } = await supabase
			.from('Conversation')
			.insert({ isGroup: false })
			.select()
			.single();

		if (createError || !newConvo) {
			console.error("Error creating conversation", createError);
			return;
		}

		// Add participants
		await supabase
			.from('ConversationParticipant')
			.insert([
				{ conversationId: newConvo.id, userId: currentUser.id },
				{ conversationId: newConvo.id, userId: userId }
			]);

		// Reload to show new conversation
		router.refresh();
		// Since router.refresh() might not trigger a state re-fetch here if it is handled in useEffect [],
		// we might want to manually trigger re-fetch or rely on Realtime.
		// For now, mirroring original behavior but safer.
	};

	const activeChat = conversations.find(c => c.id === activeChatId);

	return (
		<DashboardLayout
			title="Messages"
			subtitle="Connect with peers and faculty."
			breadcrumb={["UniVerse", "Messages"]}
		>
			<Card className="flex h-[calc(100vh-12rem)] min-h-[500px] overflow-hidden border-border/50 shadow-lg bg-card/40 backdrop-blur-xl">
				{/* Left: Conversation List */}
				<div className={`${activeChatId ? 'hidden md:block' : 'w-full'} md:w-80 lg:w-96 flex-shrink-0 h-full border-r border-border/50`}>
					{loading ? (
						<div className="flex justify-center items-center h-full">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : (
						<ConversationList
							conversations={conversations}
							activeId={activeChatId || ""}
							onSelect={setActiveChatId}
							onNewChat={handleNewChat}
						/>
					)}
				</div>

				{/* Right: Chat Window */}
				<div className={`flex-1 h-full flex flex-col ${!activeChatId ? 'hidden md:flex' : 'w-full'}`}>
					{activeChatId && activeChat && currentUser ? (
						<ChatWindow chat={activeChat} currentUserId={currentUser.id} />
					) : (
						<div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
							<div className="h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
								<MessageSquareDashed className="h-8 w-8 opacity-50" />
							</div>
							<h3 className="text-lg font-medium text-foreground">No Chat Selected</h3>
							<p className="text-sm">Choose a conversation from the sidebar to start messaging.</p>
						</div>
					)}
				</div>
			</Card>

			<UserSearchModal
				isOpen={isUserSearchOpen}
				onClose={() => setIsUserSearchOpen(false)}
				onSelectUser={handleSelectUser}
			/>
		</DashboardLayout>
	);
};
