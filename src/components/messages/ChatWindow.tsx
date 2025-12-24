import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoreVertical, Phone, Send, Smile, Paperclip, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
}

export function ChatWindow({ chat }: ChatWindowProps) {
	const [messages, setMessages] = useState<Message[]>([
		{ id: "1", text: "Hey! Are you coming to the Hackathon?", sender: "them", timestamp: "10:30 AM" },
		{ id: "2", text: "Yeah, definitely! I'm just finalizing my team.", sender: "me", timestamp: "10:32 AM" },
		{ id: "3", text: "Awesome, let me know if you need an extra backend dev.", sender: "them", timestamp: "10:33 AM" },
	]);
	const [inputValue, setInputValue] = useState("");

	const handleSend = () => {
		if (!inputValue.trim()) return;
		const newMessage: Message = {
			id: Date.now().toString(),
			text: inputValue,
			sender: "me",
			timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		};
		setMessages([...messages, newMessage]);
		setInputValue("");
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
				</div>
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
					>
						<Send className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
