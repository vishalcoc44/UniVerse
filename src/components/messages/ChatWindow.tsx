
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoreVertical, Phone, Send, Smile, Paperclip, Video, Loader2, Trash2, Edit2, Download, FileIcon, X, Check, CheckCheck, ShieldAlert, UserCheck, UserX, Clock, Reply, Star, Search, Mic, Info, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🙏", "😍"];

interface Message {
	id: string;
	text: string;
	sender: "me" | "them";
	senderId: string;
	senderName?: string;
	senderUsername?: string;
	senderAvatar?: string;
	timestamp: string;
	exactTime: string;
	isEdited: boolean;
	isDeleted: boolean;
	deletedFor?: string[];
	attachments: any[];
	reactions: any[];
	readBy: string[];
	replyToId?: string | null;
	replyToText?: string | null;
	replyToSender?: string | null;
}

interface ChatWindowProps {
	chat: {
		id: string;
		name: string;
		username?: string;
		avatar: string;
		online?: boolean;
		status?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
		peerStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
		isGroup?: boolean;
		participants?: any[];
	};
	currentUserId: string;
	onChatUpdated?: (id: string, updates: any) => void;
}

export function ChatWindow({ chat, currentUserId, onChatUpdated }: ChatWindowProps) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [inputValue, setInputValue] = useState("");
	const [loading, setLoading] = useState(true);
	const [editingMessage, setEditingMessage] = useState<Message | null>(null);
	const [replyingTo, setReplyingTo] = useState<Message | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [acceptanceLoading, setAcceptanceLoading] = useState(false);
	const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
	const [selectedProfile, setSelectedProfile] = useState<any | null>(null);

	// New feature states
	const [typingUsers, setTypingUsers] = useState<string[]>([]);
	const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
	const [searchOpen, setSearchOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
	const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null);
	const [isMuted, setIsMuted] = useState(false);
	const [isBlocked, setIsBlocked] = useState(false);
	const currentParticipant = chat.participants?.find((participant: any) => participant?.user?.id === currentUserId);
	const canModerateGroupMessages = Boolean(chat.isGroup && currentParticipant?.role === "ADMIN");

	const scrollRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const presenceChannelRef = useRef<any>(null);
	const hoverHideTimer = useRef<NodeJS.Timeout | null>(null);

	const handleMsgMouseEnter = (id: string) => {
		if (hoverHideTimer.current) clearTimeout(hoverHideTimer.current);
		setHoveredMsgId(id);
	};

	const handleMsgMouseLeave = (id: string) => {
		// Don't hide if the dropdown for this message is still open
		if (dropdownOpenId === id) return;
		hoverHideTimer.current = setTimeout(() => setHoveredMsgId(null), 600);
	};

	const handleViewProfile = () => {
		const otherParticipant = (chat.participants || []).find((participant: any) => participant?.user?.id !== currentUserId)?.user;
		if (!otherParticipant) {
			toast.info("Profile details are not available for this chat.");
			return;
		}
		setSelectedProfile(otherParticipant);
		setIsProfileDialogOpen(true);
	};

	const handleCallClick = () => {
		if (isBlocked) {
			toast.error("Unblock this user to start a call.");
			return;
		}
		toast.info("Voice calling will be available in a future update.");
	};

	const handleVideoClick = () => {
		if (isBlocked) {
			toast.error("Unblock this user to start a video call.");
			return;
		}
		toast.info("Video calling will be available in a future update.");
	};

	const handleToggleMute = () => {
		setIsMuted((prev) => {
			const next = !prev;
			toast.success(next ? "Notifications muted for this chat." : "Notifications unmuted.");
			return next;
		});
	};

	const handleToggleBlock = () => {
		setIsBlocked((prev) => {
			const next = !prev;
			toast.success(next ? `${chat.name} has been blocked in this session.` : `${chat.name} has been unblocked.`);
			return next;
		});
	};

	const handleAcceptResponse = async (accept: boolean) => {
		setAcceptanceLoading(true);
		const status = accept ? 'ACCEPTED' : 'REJECTED';
		const { error } = await supabase
			.from('ConversationParticipant')
			.update({ status })
			.eq('conversationId', chat.id)
			.eq('userId', currentUserId);

		if (error) {
			toast.error(`Failed to ${status.toLowerCase()} conversation`);
		} else {
			toast.success(`Conversation ${status.toLowerCase()}`);
			if (onChatUpdated) onChatUpdated(chat.id, { status });
		}
		setAcceptanceLoading(false);
	};

	const fetchMessages = useCallback(async (isInitial = false) => {
		try {
			if (isInitial) setLoading(true);
			const { data, error } = await supabase
				.from('Message')
				.select('*, sender:Profile!Message_senderId_fkey(fullName, username, avatarUrl), MessageAttachment(*), MessageReaction(*), replyTo:Message!replyToId(id, content, sender:Profile!Message_senderId_fkey(fullName))')
				.eq('conversationId', chat.id)
				.order('createdAt', { ascending: true });

			if (error) throw error;

			if (data) {
				// Filter out messages the current user has marked deleted
				const visible = data.filter((m: any) => !((m.deletedFor || []).includes(currentUserId)));
				setMessages(visible.map((m: any) => ({
					id: m.id,
					text: m.content,
					sender: m.senderId === currentUserId ? "me" : "them",
					senderId: m.senderId,
					senderName: m.sender?.fullName,
					senderUsername: m.sender?.username,
					senderAvatar: m.sender?.avatarUrl,
					timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
					exactTime: new Date(m.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
					isEdited: m.isEdited,
					isDeleted: m.isDeleted,
					deletedFor: m.deletedFor || [],
					attachments: m.MessageAttachment || [],
					reactions: m.MessageReaction || [],
					readBy: m.readBy || [],
					replyToId: m.replyToId || null,
					replyToText: m.replyTo?.content || null,
					replyToSender: m.replyTo?.sender?.fullName || null,
				})));
			}
		} catch (err: any) {
			console.error("Error fetching messages:", err);
			if (err.message) toast.error("Failed to load messages");
		} finally {
			setLoading(false);
			scrollToBottom();
		}
	}, [chat.id, currentUserId]);

	// Typing indicator: Supabase presence
	useEffect(() => {
		const presenceChannel = supabase.channel(`typing:${chat.id}`, {
			config: { presence: { key: currentUserId } }
		});

		presenceChannel
			.on('presence', { event: 'sync' }, () => {
				const state = presenceChannel.presenceState();
				const typingList = Object.entries(state)
					.filter(([uid, presences]: any) => uid !== currentUserId && presences[0]?.isTyping)
					.map(([, presences]: any) => presences[0]?.name as string)
					.filter(Boolean);
				setTypingUsers(typingList);
			})
			.subscribe();

		presenceChannelRef.current = presenceChannel;

		return () => {
			supabase.removeChannel(presenceChannel);
		};
	}, [chat.id, currentUserId]);

	const broadcastTyping = useCallback(async (isTyping: boolean) => {
		if (presenceChannelRef.current) {
			await presenceChannelRef.current.track({
				isTyping,
				name: chat.name, // will be replaced by real name below
				userId: currentUserId,
			});
		}
	}, [chat.id, currentUserId, chat.name]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);

		// Broadcast typing = true
		broadcastTyping(true);

		// Debounce stop typing
		if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
		typingTimeoutRef.current = setTimeout(() => {
			broadcastTyping(false);
		}, 2000);
	};

	useEffect(() => {
		fetchMessages(true);

		const channel = supabase
			.channel(`chat:${chat.id}`)
			.on('postgres_changes', {
				event: '*',
				schema: 'public',
				table: 'Message'
			}, (payload) => {
				const newMsg = payload.new as any;
				const oldMsg = payload.old as any;
				if ((newMsg && newMsg.conversationId === chat.id) || (oldMsg && oldMsg.conversationId === chat.id)) {
					fetchMessages();
				}
			})
			.on('postgres_changes', { event: '*', schema: 'public', table: 'MessageReaction' }, () => {
				fetchMessages();
			})
			.on('postgres_changes', { event: '*', schema: 'public', table: 'MessageAttachment' }, () => {
				fetchMessages();
			})
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [chat.id, currentUserId, chat.status, fetchMessages]);

	// Refetch only when user comes back online or re-focuses
	useEffect(() => {
		const refreshOnFocus = () => fetchMessages();
		const refreshOnVisibility = () => {
			if (document.visibilityState === 'visible') {
				fetchMessages();
			}
		};

		window.addEventListener('focus', refreshOnFocus);
		window.addEventListener('online', refreshOnFocus);
		document.addEventListener('visibilitychange', refreshOnVisibility);

		return () => {
			window.removeEventListener('focus', refreshOnFocus);
			window.removeEventListener('online', refreshOnFocus);
			document.removeEventListener('visibilitychange', refreshOnVisibility);
		};
	}, [fetchMessages]);

	// Mark as read when messages change or component mounts
	useEffect(() => {
		const markAsRead = async () => {
			const unreadMessages = messages.filter(
				m => m.sender === 'them' && !m.readBy.includes(currentUserId)
			);

			if (unreadMessages.length === 0) return;

			const { error } = await supabase.rpc('mark_conversation_messages_read', {
				p_conversation_id: chat.id,
			});

			if (error) {
				console.error('Errors marking messages read:', error);
				fetchMessages();
			}
		};

		if (messages.length > 0) {
				markAsRead();
			}
	}, [messages, currentUserId]);

	const scrollToBottom = () => {
		setTimeout(() => {
			if (scrollRef.current) {
				scrollRef.current.scrollIntoView({ behavior: 'smooth' });
			}
		}, 100);
	};

	const handleSend = async () => {
		if (isBlocked) {
			toast.error("You cannot send messages while this user is blocked.");
			return;
		}
		if (!inputValue.trim()) return;

		const tempId = `temp-${Date.now()}`;
		const newMessageText = inputValue;
		setInputValue("");
		broadcastTyping(false);

		if (editingMessage) {
			const { error } = await supabase
				.from('Message')
				.update({ content: newMessageText })
				.eq('id', editingMessage.id);

			if (error) {
				toast.error("Failed to edit message: " + error.message);
				setInputValue(newMessageText);
			} else {
				// Optimistically update local state
				setMessages(prev => prev.map(m => m.id === editingMessage.id
					? { ...m, text: newMessageText, isEdited: true }
					: m
				));
				setEditingMessage(null);
			}
		} else {
			// Optimistic Update
			const optimisticMsg: Message = {
				id: tempId,
				text: newMessageText,
				sender: "me",
				senderId: currentUserId,
				timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
				exactTime: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
				isEdited: false,
				isDeleted: false,
				attachments: [],
				reactions: [],
				readBy: [],
				replyToId: replyingTo?.id || null,
				replyToText: replyingTo?.text || null,
				replyToSender: replyingTo?.senderName || null,
			};
			setMessages(prev => [...prev, optimisticMsg]);
			setReplyingTo(null);
			scrollToBottom();

			const { error } = await supabase.from('Message').insert({
				conversationId: chat.id,
				senderId: currentUserId,
				content: newMessageText,
				replyToId: replyingTo?.id || null,
			});

			if (error) {
				toast.error("Failed to send message");
				setMessages(prev => prev.filter(m => m.id !== tempId));
				setInputValue(newMessageText);
			}
		}
	};

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsUploading(true);
		try {
			const fileExt = file.name.split('.').pop();
			const fileName = `${Math.random()}.${fileExt}`;
			const filePath = `${chat.id}/${fileName}`;

			const { error: uploadError } = await supabase.storage
				.from('message-attachments')
				.upload(filePath, file);

			if (uploadError) throw uploadError;

			const { data: { publicUrl } } = supabase.storage
				.from('message-attachments')
				.getPublicUrl(filePath);

			const { data: msg, error: msgError } = await supabase
				.from('Message')
				.insert({
					conversationId: chat.id,
					senderId: currentUserId,
					content: `Sent an attachment: ${file.name}`
				})
				.select()
				.single();

			if (msgError) throw msgError;

			const { error: attachError } = await supabase
				.from('MessageAttachment')
				.insert({
					messageId: msg.id,
					uploaderId: currentUserId,
					fileName: file.name,
					fileType: file.type,
					fileSize: file.size,
					url: publicUrl
				});

			if (attachError) throw attachError;

			toast.success("File uploaded successfully");
		} catch (err: any) {
			console.error(err);
			toast.error(err.message || "Failed to upload file");
		} finally {
			setIsUploading(false);
		}
	};

	const handleDeleteForMe = async (messageId: string) => {
		// Optimistic UI update
		setMessages(prev => prev.filter(m => m.id !== messageId));

		try {
			// Read current deletedFor array
			const { data: row, error: selectError } = await supabase
				.from('Message')
				.select('deletedFor')
				.eq('id', messageId)
				.single();

			if (selectError) throw selectError;

			const existing: string[] = row?.deletedFor || [];
			if (existing.includes(currentUserId)) {
				return; // already marked
			}

			const next = [...existing, currentUserId];

			const { error: updateError } = await supabase
				.from('Message')
				.update({ deletedFor: next })
				.eq('id', messageId);

			if (updateError) {
				toast.error('Failed to persist deletion: ' + updateError.message);
			}
		} catch (err: any) {
			console.error('Error marking message deletedFor:', err);
			toast.error(err?.message || 'Failed to persist deletion');
		}
	};

	const handleDeleteForEveryone = async (messageId: string) => {
		const { error } = await supabase
			.from('Message')
			.update({
				content: "This message was deleted",
				isDeleted: true,
				deletedAt: new Date().toISOString(),
				deletedBy: currentUserId,
			})
			.eq('id', messageId);

		if (error) {
			toast.error("Failed to delete message: " + error.message);
		} else {
			// Optimistically update local state
			setMessages(prev => prev.map(m => m.id === messageId
				? { ...m, text: "This message was deleted", isDeleted: true }
				: m
			));
			toast.success("Message deleted for everyone");
		}
	};

	const handleToggleReaction = async (messageId: string, emoji: string) => {
		const existing = messages.find(m => m.id === messageId)?.reactions.find(r => r.userId === currentUserId && r.emoji === emoji);

		if (existing) {
			await supabase.from('MessageReaction').delete().eq('id', existing.id);
		} else {
			await supabase.from('MessageReaction').insert({ messageId, userId: currentUserId, emoji });
		}
	};

	const handleToggleStar = (messageId: string) => {
		setStarredIds(prev => {
			const next = new Set(prev);
			if (next.has(messageId)) {
				next.delete(messageId);
				toast.success("Message unstarred");
			} else {
				next.add(messageId);
				toast.success("Message starred ⭐");
			}
			return next;
		});
	};

	const filteredMessages = searchQuery.trim()
		? messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
		: messages;

	return (
		<div className="flex flex-col h-full bg-background/5 shadow-inner">
			{/* Header */}
			<div className="px-6 py-4 border-b border-border/40 flex items-center justify-between bg-card/60 backdrop-blur-xl z-10">
				<div className="flex items-center gap-4">
					<div className="relative">
						<Avatar className="h-10 w-10 border-2 border-background shadow-sm">
							<AvatarImage src={chat.avatar} />
							<AvatarFallback className="bg-primary/5 text-primary font-bold">{chat.name[0]}</AvatarFallback>
						</Avatar>
						{chat.online && (
							<span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />
						)}
					</div>
					<div className="flex flex-col">
						<h3 className="font-bold text-[15px] leading-tight flex items-center gap-2">
							{chat.name}
							{chat.username && (
								<span className="text-[11px] font-medium text-primary/50 normal-case tracking-normal">
									@{chat.username}
								</span>
							)}
						</h3>
						<div className="flex items-center gap-1.5">
							{chat.status === 'PENDING' ? (
								<div className="flex items-center gap-1.5">
									<Clock className="w-3 h-3 text-amber-500" />
									<p className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">
										Pending Request
									</p>
								</div>
							) : typingUsers.length > 0 ? (
								<div className="flex items-center gap-1.5">
									<span className="flex gap-0.5">
										<span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
										<span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
										<span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
									</span>
									<p className="text-[11px] font-bold text-primary">
										{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
									</p>
								</div>
							) : (
								<>
									<div className={cn("w-1.5 h-1.5 rounded-full", chat.online ? "bg-green-500" : "bg-muted-foreground/30")} />
									<p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
										{chat.online ? "Active Now" : "Currently Away"}
									</p>
								</>
							)}
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{/* In-chat search toggle */}
					<Button
						variant="ghost"
						size="icon"
						className={cn("h-9 w-9 rounded-full transition-all", searchOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary hover:bg-primary/10")}
						onClick={() => { setSearchOpen(s => !s); setSearchQuery(""); }}
					>
						{searchOpen ? <SearchX className="h-[18px] w-[18px]" /> : <Search className="h-[18px] w-[18px]" />}
					</Button>
					<Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" onClick={handleCallClick}>
						<Phone className="h-[18px] w-[18px]" />
					</Button>
					<Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" onClick={handleVideoClick}>
						<Video className="h-[18px] w-[18px]" />
					</Button>
					<div className="w-px h-6 bg-border/50 mx-1" />
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted transition-all">
								<MoreVertical className="h-[18px] w-[18px]" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56 p-2">
							<DropdownMenuItem className="rounded-md py-2 px-3 focus:bg-primary/5" onClick={handleViewProfile}>
								<div className="flex items-center gap-2">
									<Avatar className="h-5 w-5"><AvatarImage src={chat.avatar} /></Avatar>
									<span>View Profile</span>
								</div>
							</DropdownMenuItem>
							<DropdownMenuItem className="rounded-md py-2 px-3" onClick={() => { setSearchOpen(true); }}>
								<Search className="h-4 w-4 mr-2" />Search Conversation
							</DropdownMenuItem>
							{starredIds.size > 0 && (
								<DropdownMenuItem className="rounded-md py-2 px-3" onClick={() => toast.info(`${starredIds.size} starred message(s)`)}>
									<Star className="h-4 w-4 mr-2 fill-amber-400 text-amber-400" />Starred ({starredIds.size})
								</DropdownMenuItem>
							)}
							<DropdownMenuItem className="rounded-md py-2 px-3" onClick={handleToggleMute}>
								{isMuted ? "Unmute Notifications" : "Mute Notifications"}
							</DropdownMenuItem>
							<DropdownMenuSeparator className="my-1" />
							<DropdownMenuItem className="rounded-md py-2 px-3 text-destructive focus:bg-destructive/5" onClick={handleToggleBlock}>
								{isBlocked ? `Unblock ${chat.name}` : `Block ${chat.name}`}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* In-Chat Search Bar */}
			{searchOpen && (
				<div className="px-6 py-2 border-b border-border/30 bg-muted/20 animate-in slide-in-from-top-1">
					<div className="flex items-center gap-2 bg-background rounded-xl border border-border/50 px-3 py-1.5">
						<Search className="h-4 w-4 text-muted-foreground shrink-0" />
						<input
							autoFocus
							placeholder="Search in conversation..."
							className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
						/>
						{searchQuery && (
							<span className="text-[10px] font-bold text-muted-foreground">
								{filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''}
							</span>
						)}
					</div>
				</div>
			)}

			<div className="flex-1 relative flex flex-col min-h-0">
				{/* Sender-side queued-request banner */}
				{!chat.isGroup && chat.status === 'ACCEPTED' && chat.peerStatus === 'PENDING' && (
					<div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-3 animate-in slide-in-from-top-1">
						<Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
						<div className="flex-1 min-w-0">
							<p className="text-[12px] font-semibold text-amber-700 dark:text-amber-300 leading-tight">
								Chat request pending
							</p>
							<p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 leading-tight">
								<span className="font-semibold">{chat.name}</span> hasn’t accepted yet — your messages are queued and will be delivered once they accept.
							</p>
						</div>
					</div>
				)}

				{/* Messages Area */}
				<ScrollArea className="flex-1 px-6">
					{loading ? (
						<div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
							<Loader2 className="h-8 w-8 animate-spin text-primary" />
							<p className="text-sm font-medium">Securing your connection...</p>
						</div>
					) : (
						<div className="py-8 space-y-8">
							<div className="flex justify-center mb-4">
								<Badge variant="outline" className="bg-muted/30 text-[10px] font-bold uppercase tracking-widest border-none px-3 py-1">
									{searchQuery ? `Showing ${filteredMessages.length} result(s) for "${searchQuery}"` : "Conversation Started"}
								</Badge>
							</div>

							{filteredMessages.map((msg, idx) => {
								const showAvatar = msg.sender === "them" && (idx === 0 || filteredMessages[idx - 1].sender === "me");
								const isStarred = starredIds.has(msg.id);

								return (
									<div
										key={msg.id}
										className={cn(
											"group relative flex gap-3 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
											msg.sender === "me" ? "ml-auto flex-row-reverse" : "mr-auto"
										)}
										onMouseEnter={() => handleMsgMouseEnter(msg.id)}
										onMouseLeave={() => handleMsgMouseLeave(msg.id)}
									>
										{/* Avatar for "them" */}
										<div className="w-8 flex-shrink-0 flex items-end">
											{showAvatar ? (
												<Avatar className="h-8 w-8 border border-border/50 shadow-sm">
													<AvatarImage src={chat.isGroup ? msg.senderAvatar : chat.avatar} />
													<AvatarFallback>{(chat.isGroup ? msg.senderName : chat.name)?.[0]}</AvatarFallback>
												</Avatar>
											) : <div className="w-8" />}
										</div>

										<div className={cn(
											"flex flex-col gap-1.5",
											msg.sender === "me" ? "items-end" : "items-start"
										)}>
											{/* Sender name for groups */}
											{chat.isGroup && msg.sender !== "me" && showAvatar && (
												<div className="flex items-baseline gap-2 mb-0.5 px-1">
													<span className="text-[11px] font-bold text-foreground/80">
														{msg.senderName}
													</span>
													{msg.senderUsername && (
														<span className="text-[10px] text-muted-foreground italic">
															@{msg.senderUsername}
														</span>
													)}
												</div>
											)}

											{/* Starred indicator */}
											{isStarred && (
												<span className="text-[9px] font-bold text-amber-500 flex items-center gap-0.5 px-1">
													<Star className="h-2.5 w-2.5 fill-amber-400" /> Starred
												</span>
											)}

											{/* Actions bubble */}
											{!msg.isDeleted && (
												<div
													onMouseEnter={() => handleMsgMouseEnter(msg.id)}
													onMouseLeave={() => handleMsgMouseLeave(msg.id)}
													className={cn(
														"absolute -top-10 flex items-center gap-0.5 bg-background shadow-lg border border-border rounded-full p-1 z-20 transition-all duration-150",
														msg.sender === "me" ? "right-0" : "left-8",
														hoveredMsgId === msg.id
															? "opacity-100 scale-100 pointer-events-auto"
															: "opacity-0 scale-90 pointer-events-none"
													)}
												>
													{QUICK_REACTIONS.map(emoji => (
														<Button key={emoji} variant="ghost" size="icon" className="h-7 w-7 rounded-full text-base" onClick={() => handleToggleReaction(msg.id, emoji)}>{emoji}</Button>
													))}
													<div className="w-px h-4 bg-border mx-1" />
													{/* Reply */}
													<Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" title="Reply" onClick={() => { setReplyingTo(msg); setEditingMessage(null); }}>
														<Reply className="h-3.5 w-3.5" />
													</Button>
													{/* Star */}
													<Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" title={isStarred ? "Unstar" : "Star"} onClick={() => handleToggleStar(msg.id)}>
														<Star className={cn("h-3.5 w-3.5", isStarred && "fill-amber-400 text-amber-400")} />
													</Button>
													<div className="w-px h-4 bg-border mx-1" />
													<DropdownMenu onOpenChange={(open) => {
														setDropdownOpenId(open ? msg.id : null);
														if (!open) handleMsgMouseLeave(msg.id);
													}}>
														<DropdownMenuTrigger asChild>
															<Button variant="ghost" size="icon" className="h-7 w-7 rounded-full"><MoreVertical className="h-3 w-3" /></Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent side="bottom" align="end" className="w-44 p-1">
															{msg.sender === "me" && (
																<DropdownMenuItem onClick={() => {
																	setEditingMessage(msg);
																	setReplyingTo(null);
																	setInputValue(msg.text);
																}}>
																	<Edit2 className="h-3 w-3 mr-2" /> Edit
																</DropdownMenuItem>
															)}
															<DropdownMenuItem onClick={() => handleDeleteForMe(msg.id)}>
																<Trash2 className="h-3 w-3 mr-2" /> Delete for me
															</DropdownMenuItem>
															{(msg.sender === "me" || canModerateGroupMessages) && (
																<DropdownMenuItem className="text-destructive" onClick={() => handleDeleteForEveryone(msg.id)}>
																	<Trash2 className="h-3 w-3 mr-2" /> Delete for everyone
																</DropdownMenuItem>
															)}
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											)}

											{/* Reply preview above bubble */}
											{msg.replyToId && msg.replyToText && (
												<div className={cn(
													"text-[11px] rounded-t-xl rounded-b-none px-3 py-1.5 border-l-2 border-primary/50 bg-muted/40 max-w-xs truncate",
													msg.sender === "me" ? "text-right" : "text-left"
												)}>
													<span className="font-bold text-primary/70 block text-[9px] uppercase tracking-wider">{msg.replyToSender || "Replied to"}</span>
													<span className="truncate text-muted-foreground">{msg.replyToText}</span>
												</div>
											)}

											{/* Message Bubble */}
											<Popover>
												<PopoverTrigger asChild>
													<div className={cn(
														"relative px-4 py-2.5 text-[14.5px] shadow-sm transition-all cursor-pointer",
														msg.replyToId ? "rounded-b-2xl rounded-t-none" : "rounded-2xl",
														msg.sender === "me"
															? "bg-primary text-primary-foreground rounded-br-none"
															: "bg-muted/60 text-foreground rounded-bl-none border border-border/20",
														msg.isDeleted && "italic text-foreground/70 bg-muted/10 border border-border/20"
													)}>
														{msg.text}

														{/* Reactions */}
														{msg.reactions.length > 0 && (
															<div className={cn(
																"absolute -bottom-3 flex flex-wrap gap-1",
																msg.sender === "me" ? "right-0" : "left-0"
															)}>
																{Object.entries(
																	msg.reactions.reduce((acc: any, r: any) => {
																		acc[r.emoji] = (acc[r.emoji] || 0) + 1;
																		return acc;
																	}, {})
																).map(([emoji, count]) => (
																	<Badge
																		key={emoji}
																		variant="secondary"
																		className="h-5 px-1.5 gap-1 bg-background border border-border/50 shadow-sm rounded-full text-[10px] hover:bg-muted"
																	>
																		<span>{emoji as string}</span>
																		<span>{count as number}</span>
																	</Badge>
																))}
															</div>
														)}
													</div>
												</PopoverTrigger>
												<PopoverContent side="top" className="w-auto p-2 text-xs text-muted-foreground">
													<div className="flex flex-col gap-1">
														<p className="font-medium">{msg.exactTime}</p>
														{msg.isEdited && <p className="text-[10px] italic">Edited</p>}
														{msg.sender === "me" && msg.readBy.length > 0 && (
															<p className="text-[10px] flex items-center gap-1">
																<CheckCheck className="h-3 w-3 text-primary" /> Read
															</p>
														)}
													</div>
												</PopoverContent>
											</Popover>

											{/* Attachments */}
											{msg.attachments && msg.attachments.length > 0 && (
												<div className={cn(
													"flex flex-wrap gap-2 mt-1",
													msg.sender === "me" ? "justify-end" : "justify-start"
												)}>
													{msg.attachments.map((file: any) => {
														const isImage = file.fileType?.startsWith('image/');
														return (
															<div
																key={file.id}
																className="group/file relative rounded-xl overflow-hidden border border-border/50 bg-background/50 backdrop-blur"
															>
																{isImage ? (
																	<div className="relative h-40 w-60">
																		<img
																			src={file.url}
																			alt={file.fileName}
																			className="h-full w-full object-cover transition-transform group-hover/file:scale-105"
																		/>
																		<div className="absolute inset-0 bg-black/0 group-hover/file:bg-black/20 transition-colors flex items-center justify-center">
																			<Button
																				variant="secondary"
																				size="icon"
																				className="h-8 w-8 opacity-0 group-hover/file:opacity-100 rounded-full"
																				onClick={() => window.open(file.url, '_blank')}
																			>
																				<Download className="h-4 w-4" />
																			</Button>
																		</div>
																	</div>
																) : (
																	<div className="p-3 flex items-center gap-3 w-60">
																		<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
																			<FileIcon className="h-5 w-5 text-primary" />
																		</div>
																		<div className="flex-1 min-w-0">
																			<p className="text-xs font-medium truncate">{file.fileName}</p>
																			<p className="text-[10px] text-muted-foreground">{(file.fileSize / 1024).toFixed(1)} KB</p>
																		</div>
																		<Button
																			variant="ghost"
																			size="icon"
																			className="h-8 w-8 rounded-full"
																			onClick={() => window.open(file.url, '_blank')}
																		>
																			<Download className="h-4 w-4" />
																		</Button>
																	</div>
																)}
															</div>
														);
													})}
												</div>
											)}

											{/* Footer (Timestamp + Status) */}
											<div className={cn(
												"flex items-center gap-1.5 px-0.5 mt-0.5",
												msg.sender === "me" ? "flex-row-reverse" : "flex-row"
											)}>
												<span className="text-[10px] font-medium text-muted-foreground/60 tracking-tight">
													{msg.timestamp}
													{msg.isEdited && " • Edited"}
												</span>
												{msg.sender === "me" && (
													<div className="flex items-center gap-1">
														{!chat.isGroup && chat.peerStatus === 'PENDING' ? (
															<>
																<Clock className="h-3 w-3 text-amber-500" />
																<span className="text-[9px] font-bold uppercase tracking-wider text-amber-500">Queued</span>
															</>
														) : msg.readBy.length > 0 ? (
															<CheckCheck className="h-3 w-3 text-primary" />
														) : (
															<Check className="h-3 w-3 text-muted-foreground/40" />
														)}
													</div>
												)}
											</div>
										</div>
									</div>
								);
							})}
							<div ref={scrollRef} className="h-1" />
						</div>
					)}
				</ScrollArea>

				{chat.status === 'PENDING' && (
					<div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-background/60 backdrop-blur-md animate-in fade-in transition-all">
						<Card className="w-full max-w-sm border-primary/20 shadow-2xl overflow-hidden ring-1 ring-primary/10 bg-card/90">
							<div className="p-8 text-center space-y-6">
								<div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
									<ShieldAlert className="h-8 w-8 text-primary" />
								</div>

								<div className="space-y-2">
									<h2 className="text-xl font-bold tracking-tight">Chat Request</h2>
									<p className="text-sm text-muted-foreground leading-relaxed">
										<span className="font-semibold text-foreground">{chat.name}</span> wants to message you.
										Accept to start the conversation.
									</p>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<Button
										variant="outline"
										className="h-11 font-bold hover:bg-destructive/10 hover:text-destructive transition-all rounded-xl border-border/60"
										onClick={() => handleAcceptResponse(false)}
										disabled={acceptanceLoading}
									>
										<UserX className="mr-2 h-4 w-4" />
										Ignore
									</Button>
									<Button
										className="h-11 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 rounded-xl"
										onClick={() => handleAcceptResponse(true)}
										disabled={acceptanceLoading}
									>
										{acceptanceLoading ? (
											<Loader2 className="h-4 w-4 animate-spin mr-2" />
										) : (
											<UserCheck className="mr-2 h-4 w-4" />
										)}
										Accept
									</Button>
								</div>
							</div>
						</Card>
					</div>
				)}
			</div>

			{/* Input Area */}
			<div className={cn(
				"p-6 pt-2 bg-card/40 backdrop-blur-xl border-t border-border/40 transition-all",
				(chat.status === 'PENDING' || isBlocked) && "opacity-40 pointer-events-none grayscale-[0.3]"
			)}>
				{/* Edit indicator */}
				{editingMessage && (
					<div className="mb-3 p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-2">
						<div className="flex items-center gap-3">
							<div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
								<Edit2 className="h-4 w-4 text-primary" />
							</div>
							<div className="flex flex-col">
								<span className="text-xs font-bold text-primary uppercase tracking-wider">Editing message</span>
								<p className="text-[13px] truncate max-w-[400px] text-muted-foreground">{editingMessage.text}</p>
							</div>
						</div>
						<Button variant="ghost" size="icon" onClick={() => {
							setEditingMessage(null);
							setInputValue("");
						}} className="h-8 w-8 rounded-full">
							<X className="h-4 w-4" />
						</Button>
					</div>
				)}

				{/* Reply indicator */}
				{replyingTo && !editingMessage && (
					<div className="mb-3 p-3 bg-muted/30 border border-border/40 rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-2">
						<div className="flex items-center gap-3">
							<div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
								<Reply className="h-4 w-4 text-muted-foreground" />
							</div>
							<div className="flex flex-col">
								<span className="text-xs font-bold text-foreground/70 uppercase tracking-wider">Replying to {replyingTo.senderName || (replyingTo.sender === 'me' ? 'yourself' : chat.name)}</span>
								<p className="text-[13px] truncate max-w-[400px] text-muted-foreground italic">{replyingTo.text}</p>
							</div>
						</div>
						<Button variant="ghost" size="icon" onClick={() => setReplyingTo(null)} className="h-8 w-8 rounded-full">
							<X className="h-4 w-4" />
						</Button>
					</div>
				)}

				<div className="flex items-center gap-3 bg-muted/40 p-2 rounded-2xl ring-1 ring-border/20 focus-within:ring-primary/30 transition-shadow">
					<div className="flex gap-1 pl-1">
						<Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-background shadow-sm transition-all" onClick={() => fileInputRef.current?.click()}>
							{isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
						</Button>
						<Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-background shadow-sm transition-all">
							<Smile className="h-5 w-5" />
						</Button>
						{/* Voice note placeholder */}
						<Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-background shadow-sm transition-all" onClick={() => toast.info("🎤 Voice notes coming soon!")}>
							<Mic className="h-5 w-5" />
						</Button>
					</div>

					<Input
						placeholder={isBlocked ? "Unblock this user to message..." : chat.status === 'PENDING' ? "Accept request to reply..." : (editingMessage ? "Edit your message..." : replyingTo ? `Reply to ${replyingTo.senderName || chat.name}...` : (!chat.isGroup && chat.peerStatus === 'PENDING' ? "Type a message — it will be queued until they accept..." : "Type a message..."))}
						className="border-none bg-transparent shadow-none focus-visible:ring-0 text-[14.5px] h-10 px-0"
						value={inputValue}
						onChange={handleInputChange}
						onKeyDown={(e) => e.key === "Enter" && handleSend()}
						disabled={chat.status === 'PENDING' || isBlocked}
					/>

					<Button
						onClick={handleSend}
						disabled={!inputValue.trim() && !isUploading || chat.status === 'PENDING' || isBlocked}
						className={cn(
							"h-10 px-4 rounded-xl gap-2 transition-all shadow-md active:scale-95",
							inputValue.trim() && chat.status !== 'PENDING' && !isBlocked ? "bg-primary text-primary-foreground shadow-primary/20" : "bg-muted text-muted-foreground"
						)}
					>
						<span className="font-semibold text-sm">Send</span>
						<Send className="h-4 w-4" />
					</Button>
				</div>
				<input
					type="file"
					ref={fileInputRef}
					className="hidden"
					onChange={handleFileUpload}
				/>
			</div>

			<Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Student Profile</DialogTitle>
						<DialogDescription>Quick details from this conversation.</DialogDescription>
					</DialogHeader>
					{selectedProfile ? (
						<div className="space-y-4">
							<div className="flex items-center gap-3">
								<Avatar className="h-14 w-14 border border-border/50">
									<AvatarImage src={selectedProfile.avatarUrl || ""} />
									<AvatarFallback>{selectedProfile.fullName?.[0] || "U"}</AvatarFallback>
								</Avatar>
								<div>
									<p className="font-semibold text-base">{selectedProfile.fullName || "Unknown User"}</p>
									<p className="text-sm text-muted-foreground">{selectedProfile.username ? `@${selectedProfile.username}` : "No username"}</p>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-3 text-sm">
								<div className="rounded-md border border-border/50 p-3">
									<p className="text-xs text-muted-foreground mb-1">Role</p>
									<p className="font-medium">{selectedProfile.role || "STUDENT"}</p>
								</div>
								<div className="rounded-md border border-border/50 p-3">
									<p className="text-xs text-muted-foreground mb-1">Status</p>
									<p className="font-medium">{chat.online ? "Active Now" : "Offline"}</p>
								</div>
							</div>
						</div>
					) : null}
				</DialogContent>
			</Dialog>
		</div>
	);
}
