'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ConversationList } from "@/components/messages/ConversationList";
import { ChatWindow } from "@/components/messages/ChatWindow";
import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquareDashed, MessageSquare, Loader2, Plus, Users, Sparkle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { UserSearchModal } from "@/components/messages/UserSearchModal";
import { useRouter } from "next/navigation";
import { GroupCreateDialog } from "@/components/messages/GroupCreateDialog";

interface Profile {
	id: string;
	fullName: string;
	username?: string;
	avatarUrl: string | null;
	role: string | null;
	lastSeenAt?: string | null;
	showOnlineStatus?: boolean | null;
}

interface Participant {
	id: string;
	userId: string;
	role: string | null;
	status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
	user: Profile | null;
}

interface Message {
	id: string;
	content: string;
	createdAt: string;
	senderId: string;
	readBy?: string[] | null;
	conversationId: string;
}

interface RawConversation {
	id: string;
	isGroup: boolean;
	name: string | null;
	input: Participant[];
	updatedAt: string;
}

export default function Messages() {
	const router = useRouter();
	const [activeChatId, setActiveChatId] = useState<string | null>(null);

	interface UIConversation {
		id: string;
		name: string;
		username?: string;
		avatar: string;
		lastMessage: string;
		time: string;
		unreadCount: number;
		online: boolean;
		isGroup: boolean;
		onlineCount: number;
		participants: Participant[];
		isMuted: boolean;
		isArchived: boolean;
		primaryRole?: string;
		isPinned?: boolean;
		status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
	}

	const [conversations, setConversations] = useState<UIConversation[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentUser, setCurrentUser] = useState<any>(null); // Supabase user type is complex, 'any' is acceptable or User
	const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
	const [isGroupCreateOpen, setIsGroupCreateOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [filters, setFilters] = useState({
		unreadOnly: false,
		groupsOnly: false,
		facultyOnly: false,
		archivedOnly: false
	});

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
					// 2. Fetch conversation details and participants
					const { data: convos } = await supabase
						.from('Conversation')
						.select(`
							id,
							isGroup,
							name,
							updatedAt,
							input:ConversationParticipant(
								id,
								userId,
								role,
								status,
								user:Profile(id, fullName, username, avatarUrl, role, lastSeenAt, showOnlineStatus)
							)
						`)
						.in('id', conversationIds)
						.order('updatedAt', { ascending: false });

					const { data: messages } = await supabase
						.from('Message')
						.select('id, content, createdAt, senderId, readBy, conversationId')
						.in('conversationId', conversationIds);

					const { data: preferences } = await supabase
						.from('ConversationPreference')
						.select('*')
						.eq('userId', user.id)
						.in('conversationId', conversationIds);

					const preferenceMap = new Map(
						(preferences || []).map((pref: any) => [pref.conversationId, pref])
					);

					const messageByConversation = new Map<string, Message[]>();
					(messages || []).forEach((msg: Message) => {
						const list = messageByConversation.get(msg.conversationId) || [];
						list.push(msg);
						messageByConversation.set(msg.conversationId, list);
					});

					// Cast supabase result to unknown first then to our type to avoid strict mismatch if needed, or rely on inference
					const typedConvos = convos as unknown as RawConversation[] | null;

					if (typedConvos) {
						// Process data to match UI expectations
						const formatted = typedConvos.map(c => {
							const participants = c.input || [];
							const otherParticipants = participants.filter((p) => p.user?.id !== user.id).map(p => p.user).filter(Boolean) as Profile[];
							const primaryOther = otherParticipants[0];
							const participantUsers = participants.map(p => p.user).filter(Boolean) as Profile[];
							const now = Date.now();
							const onlineParticipants = participantUsers.filter(p => {
								if (p.id === user.id) return false;
								if (p.showOnlineStatus === false) return false;
								if (!p.lastSeenAt) return false;
								return (now - new Date(p.lastSeenAt).getTime()) < 5 * 60 * 1000;
							});
							const messagesForConversation = messageByConversation.get(c.id) || [];
							const lastMsg = messagesForConversation
								.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
							const unreadCount = messagesForConversation.filter(m => {
								if (m.senderId === user.id) return false;
								return !m.readBy || !m.readBy.includes(user.id);
							}).length;
							const pref = preferenceMap.get(c.id);
							const isArchived = Boolean(pref?.isArchived); // Updated to use isArchived boolean
							const isMuted = Boolean(pref?.isMuted);
							const myParticipant = participants.find(p => p.userId === user.id);

							return {
								id: c.id,
								name: c.isGroup
									? (c.name || `Group with ${otherParticipants.map(p => p.fullName).slice(0, 3).join(', ') || 'participants'}`)
									: (primaryOther?.fullName || "Unknown User"),
								username: c.isGroup ? undefined : primaryOther?.username,
								avatar: c.isGroup
									? `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || "Group")}&background=random`
									: (primaryOther?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(primaryOther?.fullName || "Unknown User")}&background=random`),
								lastMessage: lastMsg?.content || "No messages yet",
								time: lastMsg ? new Date(lastMsg.createdAt).toLocaleDateString() : "",
								unreadCount,
								online: onlineParticipants.length > 0,
								isGroup: c.isGroup,
								onlineCount: onlineParticipants.length,
								participants,
								isMuted,
								isArchived,
								isPinned: Boolean(pref?.isPinned),
								primaryRole: c.isGroup ? undefined : primaryOther?.role || undefined,
								status: myParticipant?.status || 'PENDING'
							};
						});
						setConversations(formatted);
					}
				}
			}
			setLoading(false);
		};

		fetchConversations();

		// Real-time for global updates (new conversations, last message updates, preferences)
		const channel = supabase
			.channel('messages-global')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'Conversation' }, () => {
				fetchConversations();
			})
			.on('postgres_changes', { event: '*', schema: 'public', table: 'ConversationParticipant' }, () => {
				fetchConversations();
			})
			.on('postgres_changes', { event: '*', schema: 'public', table: 'Message' }, () => {
				fetchConversations();
			})
			.on('postgres_changes', { event: '*', schema: 'public', table: 'ConversationPreference' }, () => {
				fetchConversations();
			})
			.subscribe();

		const interval = setInterval(() => {
			fetchConversations();
		}, 5000);

		const refreshOnFocus = () => fetchConversations();
		const refreshOnVisibility = () => {
			if (document.visibilityState === 'visible') {
				fetchConversations();
			}
		};

		window.addEventListener('focus', refreshOnFocus);
		window.addEventListener('online', refreshOnFocus);
		document.addEventListener('visibilitychange', refreshOnVisibility);

		return () => {
			clearInterval(interval);
			window.removeEventListener('focus', refreshOnFocus);
			window.removeEventListener('online', refreshOnFocus);
			document.removeEventListener('visibilitychange', refreshOnVisibility);
			supabase.removeChannel(channel);
		};
	}, []);

	useEffect(() => {
		let intervalId: NodeJS.Timeout | null = null;
		const updatePresence = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;
			await supabase
				.from('Profile')
				.update({ lastSeenAt: new Date().toISOString() })
				.eq('id', user.id);
		};

		updatePresence();
		intervalId = setInterval(updatePresence, 60 * 1000);
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				updatePresence();
			}
		};
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			if (intervalId) clearInterval(intervalId);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, []);

	const handleNewChat = () => {
		setIsUserSearchOpen(true);
	};

	const handleNewGroup = () => {
		setIsGroupCreateOpen(true);
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
			.insert({
				isGroup: false,
				updatedAt: new Date().toISOString()
			})
			.select()
			.single();

		if (createError || !newConvo) {
			console.error("Error creating conversation", createError);
			return;
		}

		// Add participants (insert self first for RLS safety)
		await supabase
			.from('ConversationParticipant')
			.insert({
				conversationId: newConvo.id,
				userId: currentUser.id,
				role: 'ADMIN',
				status: 'ACCEPTED' // Creator is auto-accepted
			});

		await supabase
			.from('ConversationParticipant')
			.insert({
				conversationId: newConvo.id,
				userId: userId,
				role: 'MEMBER',
				status: 'PENDING' // Recipient is pending
			});

		// Reload to show new conversation
		router.refresh();
		// Since router.refresh() might not trigger a state re-fetch here if it is handled in useEffect [],
		// we might want to manually trigger re-fetch or rely on Realtime.
		// For now, mirroring original behavior but safer.
	};

	const activeChat = conversations.find(c => c.id === activeChatId);

	const filteredConversations = useMemo(() => {
		return conversations
			.filter(c => {
				if (!filters.archivedOnly && c.isArchived) return false;
				if (filters.archivedOnly && !c.isArchived) return false;
				if (filters.unreadOnly && c.unreadCount === 0) return false;
				if (filters.groupsOnly && !c.isGroup) return false;
				if (filters.facultyOnly && c.primaryRole !== 'FACULTY') return false;
				if (searchQuery.trim()) {
					const term = searchQuery.toLowerCase();
					return c.name.toLowerCase().includes(term) || c.lastMessage.toLowerCase().includes(term);
				}
				return true;
			})
			.sort((a, b) => {
				if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
				return 0; // Maintain original updatedAt sort order otherwise
			});
	}, [conversations, filters, searchQuery]);

	const handleToggleFilter = (key: string) => {
		setFilters(prev => ({ ...prev, [key as keyof typeof filters]: !prev[key as keyof typeof filters] }));
	};

	const handleConversationUpdate = (conversationId: string, updates: Partial<UIConversation>) => {
		setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, ...updates } : c));
	};

	const handleTogglePreference = async (convoId: string, type: 'isPinned' | 'isArchived' | 'isMuted') => {
		const convo = conversations.find(c => c.id === convoId);
		if (!convo || !currentUser) return;

		const { data: existing } = await supabase
			.from('ConversationPreference')
			.select('id')
			.eq('conversationId', convoId)
			.eq('userId', currentUser.id)
			.maybeSingle();

		const val = !convo[type as keyof UIConversation];
		const update = { [type]: val };

		if (existing) {
			await supabase.from('ConversationPreference').update(update).eq('id', existing.id);
		} else {
			await supabase.from('ConversationPreference').insert({
				conversationId: convoId,
				userId: currentUser.id,
				...update
			});
		}
	};

	return (
		<DashboardLayout
			title={
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
						<MessageSquare className="h-6 w-6" />
					</div>
					<h1 className="text-3xl md:text-4xl font-bold tracking-tight">
						Direct <span className="text-primary">Messages</span>
					</h1>
				</div>
			}
			subtitle="Connect with peers and faculty."
			breadcrumb={["UniVerse", "Messages"]}
		>
			<Card className="flex h-[calc(100vh-12rem)] min-h-[500px] overflow-hidden border-border/40 shadow-2xl bg-card/10 backdrop-blur-2xl rounded-3xl group/container">
				{/* Left: Conversation List */}
				<div className={`${activeChatId ? 'hidden md:block' : 'w-full'} md:w-80 lg:w-96 flex-shrink-0 h-full border-r border-border/40 bg-background/20 relative z-20`}>
					{loading ? (
						<div className="flex flex-col justify-center items-center h-full gap-3">
							<div className="relative">
								<div className="absolute inset-0 rounded-full bg-primary/20 blur-md animate-ping" />
								<Loader2 className="h-8 w-8 animate-spin text-primary relative" />
							</div>
							<p className="text-xs font-medium text-muted-foreground animate-pulse">Syncing conversations...</p>
						</div>
					) : (
						<ConversationList
							conversations={filteredConversations}
							activeId={activeChatId || ""}
							onSelect={setActiveChatId}
							onNewChat={handleNewChat}
							onNewGroup={handleNewGroup}
							onTogglePin={(id) => handleTogglePreference(id, 'isPinned')}
							onToggleArchive={(id) => handleTogglePreference(id, 'isArchived')}
							onToggleMute={(id) => handleTogglePreference(id, 'isMuted')}
							searchQuery={searchQuery}
							onSearchChange={setSearchQuery}
							filters={filters}
							onToggleFilter={handleToggleFilter}
						/>
					)}
				</div>

				{/* Right: Chat Window */}
				<div className={`flex-1 h-full flex flex-col items-stretch relative overflow-hidden transition-all duration-500 ${!activeChatId ? 'hidden md:flex bg-muted/5' : 'w-full bg-background/5'}`}>
					{activeChatId && activeChat && currentUser ? (
						<ChatWindow
							chat={activeChat}
							currentUserId={currentUser.id}
							onChatUpdated={handleConversationUpdate}
						/>
					) : (
						<div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-700">
							<div className="relative group/icon mb-8">
								<div className="absolute -inset-8 rounded-full bg-primary/5 blur-3xl group-hover/icon:bg-primary/10 transition-colors" />
								<div className="relative h-24 w-24 bg-primary/10 rounded-[2rem] flex items-center justify-center rotate-6 group-hover/icon:rotate-0 transition-transform duration-500 shadow-inner">
									<MessageSquare className="h-12 w-12 text-primary drop-shadow-sm" />
									<Sparkle className="absolute -top-1 -right-1 h-6 w-6 text-primary animate-pulse" />
								</div>
							</div>

							<div className="max-w-md space-y-4">
								<h3 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent italic">
									Your Universe Awaits
								</h3>
								<p className="text-muted-foreground text-sm leading-relaxed px-4">
									Collaborate with peers, ask questions to faculty, or start a study group.
									Select a contact from the left to start your journey.
								</p>
							</div>

							<div className="mt-10 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-1000 delay-300">
								<Button
									onClick={handleNewChat}
									className="rounded-full px-8 h-12 shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all"
								>
									<Plus className="mr-2 h-4 w-4" /> Start Messaging
								</Button>
								<Button
									variant="outline"
									onClick={handleNewGroup}
									className="rounded-full px-8 h-12 bg-background/50 backdrop-blur-sm border-border/50 hover:bg-muted active:scale-95 transition-all"
								>
									<Users className="mr-2 h-4 w-4" /> New Group
								</Button>
							</div>

							{/* Decorative features list */}
							<div className="absolute inset-x-0 bottom-12 flex justify-center opacity-[0.03] grayscale pointer-events-none">
								<div className="flex gap-12 text-6xl font-black italic tracking-tighter uppercase whitespace-nowrap animate-marquee">
									<span>Collaboration</span>
									<span>Networking</span>
									<span>Academics</span>
									<span>Community</span>
								</div>
							</div>
						</div>
					)}
				</div>
			</Card>

			<UserSearchModal
				isOpen={isUserSearchOpen}
				onClose={() => setIsUserSearchOpen(false)}
				onSelectUser={handleSelectUser}
			/>
			<GroupCreateDialog
				isOpen={isGroupCreateOpen}
				onClose={() => setIsGroupCreateOpen(false)}
				currentUserId={currentUser?.id}
				onCreated={(conversationId) => {
					setActiveChatId(conversationId);
				}}
			/>
		</DashboardLayout>
	);
};
