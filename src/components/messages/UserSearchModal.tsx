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
					.ilike('fullName', `%${query}%`)
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
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>New Message</DialogTitle>
					<DialogDescription>Search for a user to start a conversation with.</DialogDescription>
				</DialogHeader>
				<div className="gap-4 py-4">
					<div className="relative">
						<Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search users..."
							className="pl-9"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
						/>
					</div>
					<ScrollArea className="h-[300px] mt-4 pr-4">
						{searching ? (
							<div className="flex justify-center p-4">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						) : results.length === 0 && query ? (
							<div className="text-center text-muted-foreground p-4">
								No users found.
							</div>
						) : (
							<div className="space-y-2">
								{results.map((user) => (
									<div
										key={user.id}
										className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors group"
										onClick={() => onSelectUser(user.id)}
									>
										<div className="flex items-center gap-3">
											<Avatar>
												<AvatarImage src={user.avatarUrl} />
												<AvatarFallback>{user.fullName[0]}</AvatarFallback>
											</Avatar>
											<div>
												<p className="font-medium text-sm">{user.fullName}</p>
												<p className="text-xs text-muted-foreground">@{user.username}</p>
											</div>
										</div>
										<Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
											<MessageCircle className="h-4 w-4" />
										</Button>
									</div>
								))}
							</div>
						)}
					</ScrollArea>
				</div>
			</DialogContent>
		</Dialog>
	);
}
