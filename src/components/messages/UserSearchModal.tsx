import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Search, MessageCircle, UserPlus, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner"; // Using sonner as per previous context

interface UserSearchModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSelectUser: (userId: string) => void;
}

export function UserSearchModal({ isOpen, onClose, onSelectUser }: UserSearchModalProps) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [searching, setSearching] = useState(false);

	useEffect(() => {
		const searchUsers = async () => {
			if (!query.trim()) {
				setResults([]);
				return;
			}

			setSearching(true);
			try {
				const { data, error } = await supabase
					.from('Profile')
					.select('id, fullName, username, avatarUrl, role')
					.or(`fullName.ilike.%${query}%,username.ilike.%${query}%`)
					.limit(10);

				if (error) throw error;
				setResults(data || []);
			} catch (err) {
				console.error("Error searching users:", err);
			} finally {
				setSearching(false);
			}
		};

		const timeoutId = setTimeout(searchUsers, 500);
		return () => clearTimeout(timeoutId);
	}, [query]);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
				<div className="bg-primary/5 p-8 pb-6 bg-gradient-to-br from-primary/10 via-background to-background">
					<DialogTitle className="text-2xl font-bold italic tracking-tight flex items-center gap-3">
						<MessageCircle className="h-6 w-6 text-primary" />
						New Conversation
					</DialogTitle>
					<DialogDescription className="text-muted-foreground/80 mt-1">
						Search for someone to start a private chat with.
					</DialogDescription>
					
					<div className="relative mt-8 group/search">
						<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
						<Input
							placeholder="Search by name or @username..."
							className="pl-10 h-12 bg-background border-border/50 focus-visible:ring-primary shadow-sm rounded-2xl"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							autoFocus
						/>
					</div>
				</div>

				<div className="p-4">
					<ScrollArea className="h-[350px] pr-4">
						{searching ? (
							<div className="flex flex-col items-center justify-center h-[200px] gap-3 opacity-50">
								<Loader2 className="h-8 w-8 animate-spin text-primary" />
								<p className="text-xs font-semibold uppercase tracking-widest">Searching Universe...</p>
							</div>
						) : !query ? (
							<div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground/40 gap-4">
								<div className="h-16 w-16 rounded-3xl bg-muted/20 flex items-center justify-center rotate-3 border border-dashed border-muted-foreground/20">
									<Search className="h-8 w-8" />
								</div>
								<p className="text-sm font-medium italic">Type to search for people...</p>
							</div>
						) : results.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground/60 gap-3">
								<div className="h-12 w-12 rounded-full bg-red-500/5 flex items-center justify-center">
									<Search className="h-6 w-6 text-red-500/40" />
								</div>
								<div className="text-center">
									<p className="text-sm font-semibold">No results found for "{query}"</p>
									<p className="text-xs">Check the spelling or try another name</p>
								</div>
							</div>
						) : (
							<div className="grid grid-cols-1 gap-2 pb-4">
								{results.map((user) => (
									<button
										key={user.id}
										className="w-full flex items-center justify-between p-3.5 hover:bg-primary/[0.04] active:bg-primary/[0.08] border border-transparent hover:border-primary/10 rounded-[1.25rem] transition-all group"
										onClick={() => onSelectUser(user.id)}
									>
										<div className="flex items-center gap-4">
											<div className="relative">
												<Avatar className="h-11 w-11 border-2 border-background shadow-sm group-hover:scale-105 transition-transform">
													<AvatarImage src={user.avatarUrl} />
													<AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">{user.fullName[0]}</AvatarFallback>
												</Avatar>
												<span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" />
											</div>
											<div className="text-left">
												<p className="font-bold text-sm tracking-tight">{user.fullName}</p>
												<div className="flex items-center gap-2">
													<p className="text-[11px] text-muted-foreground font-medium">@{user.username}</p>
													<span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
													<p className="text-[10px] uppercase font-bold text-primary/60 tracking-tighter">{user.role}</p>
												</div>
											</div>
										</div>
										<div className="h-8 w-8 rounded-full bg-background border border-border/50 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
											<UserPlus className="h-4 w-4 text-primary" />
										</div>
									</button>
								))}
							</div>
						)}
					</ScrollArea>
				</div>
			</DialogContent>
		</Dialog>
	);
}
