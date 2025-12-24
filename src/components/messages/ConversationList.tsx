import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
	id: string;
	name: string;
	avatar: string;
	lastMessage: string;
	time: string;
	unreadCount?: number;
	online?: boolean;
}

interface ConversationListProps {
	conversations: Conversation[];
	activeId: string;
	onSelect: (id: string) => void;
}

export function ConversationList({ conversations, activeId, onSelect }: ConversationListProps) {
	return (
		<div className="flex flex-col h-full bg-card/50 backdrop-blur-sm border-r border-border/50">
			<div className="p-4 border-b border-border/50">
				<h2 className="text-xl font-bold mb-4">Messages</h2>
				<div className="relative">
					<Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input placeholder="Search chats..." className="pl-9 bg-background/50" />
				</div>
			</div>

			<ScrollArea className="flex-1">
				<div className="flex flex-col gap-1 p-2">
					{conversations.map((chat) => (
						<button
							key={chat.id}
							onClick={() => onSelect(chat.id)}
							className={cn(
								"flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left hover:bg-muted/50",
								activeId === chat.id ? "bg-primary/10 hover:bg-primary/15" : ""
							)}
						>
							<div className="relative">
								<Avatar>
									<AvatarImage src={chat.avatar} />
									<AvatarFallback>{chat.name[0]}</AvatarFallback>
								</Avatar>
								{chat.online && (
									<span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
								)}
							</div>

							<div className="flex-1 min-w-0">
								<div className="flex justify-between items-baseline mb-0.5">
									<span className={cn(
										"font-medium truncate",
										activeId === chat.id ? "text-primary" : "text-foreground"
									)}>
										{chat.name}
									</span>
									<span className="text-[10px] text-muted-foreground shrink-0">{chat.time}</span>
								</div>
								<p className={cn(
									"text-xs truncate",
									chat.unreadCount ? "font-semibold text-foreground" : "text-muted-foreground"
								)}>
									{chat.lastMessage}
								</p>
							</div>

							{chat.unreadCount && (
								<Badge className="bg-primary text-primary-foreground h-5 w-5 rounded-full p-0 flex items-center justify-center shrink-0">
									{chat.unreadCount}
								</Badge>
							)}
						</button>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}
