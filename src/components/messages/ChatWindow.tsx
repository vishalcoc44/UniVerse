
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoreVertical, Phone, Send, Smile, Paperclip, Video, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface Message {
	id: string;
	text: string;
	sender: "me" | "them";
	timestamp: string;
}

interface ChatWindowProps {
	chat: {
		id: string;
		name: string;
		avatar: string;
		online?: boolean;
	};
	currentUserId: string;
}

export function ChatWindow({ chat, currentUserId }: ChatWindowProps) {
	const [messages, setMessages] = useState<Message[]>([]);
	const [inputValue, setInputValue] = useState("");
	const [loading, setLoading] = useState(true);
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const fetchMessages = async () => {
			setLoading(true);
			const { data, error } = await supabase
				.from('Message')
				.select('*')
				.eq('conversationId', chat.id)
				.order('createdAt', { ascending: true });

			if (data) {
				setMessages(data.map((m: any) => ({
					id: m.id,
					text: m.content,
					sender: m.senderId === currentUserId ? "me" : "them",
					timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
				})));
			}
			setLoading(false);
			scrollToBottom();
		};

		fetchMessages();

		// Subscribe to new messages
		const channel = supabase
			.channel(`chat:${chat.id}`)
			.on('postgres_changes', {
				event: 'INSERT',
				schema: 'public',
				table: 'Message',
				filter: `conversationId=eq.${chat.id}`
			}, (payload) => {
				const newMessage = payload.new as any;
				setMessages((prev) => [...prev, {
					id: newMessage.id,
					text: newMessage.content,
					sender: newMessage.senderId === currentUserId ? "me" : "them",
					timestamp: new Date(newMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
				}]);
				scrollToBottom();
			})
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [chat.id, currentUserId]);

	const scrollToBottom = () => {
		setTimeout(() => {
			if (scrollRef.current) {
				scrollRef.current.scrollIntoView({ behavior: 'smooth' });
			}
		}, 100);
	};

	const handleSend = async () => {
		if (!inputValue.trim()) return;

		// Optimistic update
		const tempId = Date.now().toString();
		const tempMsg: Message = {
			id: tempId,
			text: inputValue,
			sender: "me",
			timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		};
		setMessages([...messages, tempMsg]);
		setInputValue("");
		scrollToBottom();

		// Send to DB
		const { error } = await supabase.from('Message').insert({
			conversationId: chat.id,
			senderId: currentUserId,
			content: tempMsg.text
		});

		if (error) {
			console.error("Error sending message:", error);
			// Could show error state here or revert optimistic update
		}
	};

	return (
		<div className="flex flex-col h-full bg-card/30 backdrop-blur-sm">
			{/* Header */}
			<div className="p-4 border-b border-border/50 flex items-center justify-between bg-card/50">
				<div className="flex items-center gap-3">
					<Avatar>
						<AvatarImage src={chat.avatar} />
						<AvatarFallback>{chat.name[0]}</AvatarFallback>
					</Avatar>
					<div>
						<h3 className="font-semibold text-foreground flex items-center gap-2">
							{chat.name}
							{chat.online && <span className="w-2 h-2 rounded-full bg-green-500" />}
						</h3>
						<p className="text-xs text-muted-foreground">{chat.online ? "Online" : "Offline"}</p>
					</div>
				</div>
				<div className="flex items-center gap-1">
					<Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
					<Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
					<Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
				</div>
			</div>

			{/* Messages Area */}
			<ScrollArea className="flex-1 p-4">
				{loading ? (
					<div className="flex justify-center mt-10"><Loader2 className="animate-spin text-muted-foreground" /></div>
				) : (
					<div className="space-y-4">
						{messages.map((msg) => (
							<div
								key={msg.id}
								className={cn(
									"flex w-max max-w-[75%] flex-col gap-1 rounded-2xl px-4 py-2 text-sm shadow-sm",
									msg.sender === "me"
										? "ml-auto bg-primary text-primary-foreground rounded-tr-sm"
										: "bg-muted text-foreground rounded-tl-sm"
								)}
							>
								<p>{msg.text}</p>
								<span className={cn(
									"text-[10px] self-end opacity-70",
									msg.sender === "me" ? "text-primary-foreground" : "text-muted-foreground"
								)}>
									{msg.timestamp}
								</span>
							</div>
						))}
						<div ref={scrollRef} />
					</div>
				)}
			</ScrollArea>

			{/* Input Area */}
			<div className="p-4 border-t border-border/50 bg-card/50">
				<div className="flex items-center gap-2 bg-background/50 p-1.5 rounded-full border border-border/50 shadow-sm">
					<Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground">
						<Paperclip className="h-4 w-4" />
					</Button>
					<Input
						className="flex-1 border-none shadow-none focus-visible:ring-0 bg-transparent h-9 placeholder:text-muted-foreground"
						placeholder="Type a message..."
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSend()}
					/>
					<Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground">
						<Smile className="h-4 w-4" />
					</Button>
					<Button
						size="icon"
						className="rounded-full h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-95"
						onClick={handleSend}
						disabled={!inputValue.trim()}
					>
						<Send className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
