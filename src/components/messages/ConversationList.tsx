import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Users, Filter, Archive, MoreVertical, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Conversation {
	id: string;
	name: string;
	username?: string;
	avatar: string;
	lastMessage: string;
	time: string;
	unreadCount?: number;
	online?: boolean;
	isPinned?: boolean;
	isArchived?: boolean;
	isMuted?: boolean;
}

interface ConversationListProps {
	conversations: Conversation[];
	activeId: string;
	onSelect: (id: string) => void;
	onNewChat: () => void;
	onNewGroup: () => void;
	onTogglePin: (id: string) => void;
	onToggleArchive: (id: string) => void;
	onToggleMute: (id: string) => void;
	searchQuery: string;
	onSearchChange: (query: string) => void;
	filters: {
		unreadOnly: boolean;
		groupsOnly: boolean;
		facultyOnly: boolean;
		archivedOnly: boolean;
	};
	onToggleFilter: (filter: string) => void;
}

export function ConversationList({ 
	conversations, 
	activeId, 
	onSelect, 
	onNewChat,
	onNewGroup,
	onTogglePin,
	onToggleArchive,
	onToggleMute,
	searchQuery,
	onSearchChange,
	filters,
	onToggleFilter
}: ConversationListProps) {
	return (
		<div className="flex flex-col h-full bg-background/20 backdrop-blur-md border-r border-border/40">
			<div className="p-5 border-b border-border/40">
				<div className="flex items-center justify-between mb-5">
					<h2 className="text-2xl font-bold tracking-tight">Messages</h2>
					<div className="flex items-center gap-2">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 transition-colors">
									<Plus className="h-5 w-5" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56 p-2">
								<DropdownMenuItem onClick={onNewChat} className="rounded-md cursor-pointer py-2.5">
									<div className="flex items-center gap-3">
										<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
											<Plus className="h-4 w-4 text-primary" />
										</div>
										<div className="flex flex-col">
											<span className="font-medium text-sm">New Chat</span>
											<span className="text-[11px] text-muted-foreground">Start a direct conversation</span>
										</div>
									</div>
								</DropdownMenuItem>
								<DropdownMenuItem onClick={onNewGroup} className="rounded-md cursor-pointer py-2.5 mt-1">
									<div className="flex items-center gap-3">
										<div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
											<Users className="h-4 w-4 text-green-600" />
										</div>
										<div className="flex flex-col">
											<span className="font-medium text-sm">New Group</span>
											<span className="text-[11px] text-muted-foreground">Chat with multiple members</span>
										</div>
									</div>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted/80 transition-colors text-muted-foreground">
									<Filter className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56">
								<DropdownMenuLabel className="font-semibold px-2 py-2">Filter messages</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<div className="p-1">
									<DropdownMenuCheckboxItem 
										className="rounded-md py-2"
										checked={filters.unreadOnly}
										onCheckedChange={() => onToggleFilter('unreadOnly')}
									>
										Unread Messages
									</DropdownMenuCheckboxItem>
									<DropdownMenuCheckboxItem 
										className="rounded-md py-2"
										checked={filters.groupsOnly}
										onCheckedChange={() => onToggleFilter('groupsOnly')}
									>
										Groups Only
									</DropdownMenuCheckboxItem>
									<DropdownMenuCheckboxItem 
										className="rounded-md py-2"
										checked={filters.facultyOnly}
										onCheckedChange={() => onToggleFilter('facultyOnly')}
									>
										Faculty Members
									</DropdownMenuCheckboxItem>
									<DropdownMenuSeparator className="my-1" />
									<DropdownMenuCheckboxItem 
										className="rounded-md py-2 font-medium"
										checked={filters.archivedOnly}
										onCheckedChange={() => onToggleFilter('archivedOnly')}
									>
										<div className="flex items-center">
											<Archive className="h-3.5 w-3.5 mr-2" />
											Archived
										</div>
									</DropdownMenuCheckboxItem>
								</div>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
				<div className="relative group/search">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
					<Input 
						placeholder="Search chats, people, groups..." 
						className="pl-9 h-11 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/30 rounded-xl" 
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
					/>
				</div>
			</div>

			<ScrollArea className="flex-1 px-3">
				<div className="flex flex-col gap-1.5 py-4">
					{conversations.length === 0 ? (
						<div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
							<div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center">
								<Search className="h-6 w-6 text-muted-foreground/50" />
							</div>
							<div className="space-y-1">
								<p className="font-medium text-sm text-muted-foreground">No conversations found</p>
								<p className="text-xs text-muted-foreground/60">Try adjusting your filters or search</p>
							</div>
						</div>
					) : (
						conversations.map((chat) => (
							<div key={chat.id} className="relative group">
								<button
									onClick={() => onSelect(chat.id)}
									className={cn(
										"w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 text-left border border-transparent",
										activeId === chat.id 
											? "bg-primary/[0.08] border-primary/10 shadow-sm" 
											: "hover:bg-muted/40 hover:translate-x-0.5 active:scale-[0.98]"
									)}
								>
									<div className="relative shrink-0">
										<Avatar className="h-12 w-12 border-2 border-background shadow-sm group-hover:scale-105 transition-transform">
											<AvatarImage src={chat.avatar} />
											<AvatarFallback className="bg-primary/5 text-primary text-sm font-bold">{chat.name[0]}</AvatarFallback>
										</Avatar>
										{chat.online && (
											<span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-[2.5px] border-background animate-pulse shadow-sm" />
										)}
									</div>

									<div className="flex-1 min-w-0 pr-2">
										<div className="flex justify-between items-center mb-1">
											<span className={cn(
												"font-semibold truncate text-[14px]",
												chat.unreadCount ? "text-foreground" : "text-muted-foreground/90"
											)}>
												{chat.name}
												{chat.username && (
													<span className="ml-1 text-[10px] font-medium text-muted-foreground/50 lowercase italic">
														@{chat.username}
													</span>
												)}
											</span>
											<span className="text-[10px] text-muted-foreground/60 font-medium shrink-0 uppercase tracking-tighter group-hover:opacity-0 transition-opacity">
												{chat.time}
											</span>
										</div>
										<div className="flex justify-between items-center gap-2">
											<p className={cn(
												"text-[12.5px] truncate max-w-[80%] leading-tight",
												chat.unreadCount ? "font-semibold text-foreground" : "text-muted-foreground/70"
											)}>
												{chat.lastMessage}
											</p>
											<div className="flex items-center gap-2 shrink-0 group-hover:opacity-0 transition-opacity">
												{chat.isPinned && (
													<div className="h-4 w-4 flex items-center justify-center bg-primary/10 rounded-full">
														<Pin className="h-2.5 w-2.5 text-primary fill-primary" />
													</div>
												)}
												{chat.unreadCount ? (
													<Badge className="bg-primary hover:bg-primary border-none text-[10px] font-bold h-5 min-w-[20px] rounded-full p-0 px-1.5 flex items-center justify-center shadow-sm shadow-primary/20">
														{chat.unreadCount}
													</Badge>
												) : null}
											</div>
										</div>
									</div>
								</button>
								
								<div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button 
												variant="ghost" 
												size="icon" 
												className="h-7 w-7 rounded-full bg-background/80 backdrop-blur shadow-sm border border-border/50 pointer-events-auto hover:bg-red-50 hover:text-red-500"
												onClick={(e) => e.stopPropagation()}
											>
												<MoreVertical className="h-3.5 w-3.5" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="w-40">
											<DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTogglePin(chat.id); }}>
												<Pin className="mr-2 h-4 w-4" /> {chat.isPinned ? "Unpin" : "Pin"}
											</DropdownMenuItem>
											<DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleMute(chat.id); }}>
												{chat.isMuted ? "Unmute" : "Mute"}
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleArchive(chat.id); }}>
												<Archive className="mr-2 h-4 w-4" /> {chat.isArchived ? "Unarchive" : "Archive"}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
						))
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
