import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Search, Users, X, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GroupCreateDialogProps {
	isOpen: boolean;
	onClose: () => void;
	currentUserId: string;
	onCreated: (conversationId: string) => void;
}

export function GroupCreateDialog({ isOpen, onClose, currentUserId, onCreated }: GroupCreateDialogProps) {
	const [groupName, setGroupName] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [results, setResults] = useState<any[]>([]);
	const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
	const [searching, setSearching] = useState(false);
	const [creating, setCreating] = useState(false);

	useEffect(() => {
		const searchUsers = async () => {
			if (!searchQuery.trim()) {
				setResults([]);
				return;
			}

			setSearching(true);
			try {
				const { data, error } = await supabase
					.from('Profile')
					.select('id, fullName, username, avatarUrl')
					.or(`fullName.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
					.neq('id', currentUserId)
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
	}, [searchQuery, currentUserId]);

	const toggleUser = (user: any) => {
		if (selectedUsers.some(u => u.id === user.id)) {
			setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
		} else {
			setSelectedUsers([...selectedUsers, user]);
		}
	};

	const handleCreateGroup = async () => {
		if (!groupName.trim()) {
			toast.error("Please enter a group name");
			return;
		}
		if (selectedUsers.length < 1) {
			toast.error("Please select at least one other member");
			return;
		}

		setCreating(true);
		try {
			// 1. Create conversation
			const { data: conversation, error: convError } = await supabase
				.from('Conversation')
				.insert({
					isGroup: true,
					name: groupName,
					updatedAt: new Date().toISOString()
				})
				.select()
				.single();

			if (convError) throw convError;

			// 2. Add participants
			const participants = [
				{ conversationId: conversation.id, userId: currentUserId, role: 'ADMIN' },
				...selectedUsers.map(user => ({
					conversationId: conversation.id,
					userId: user.id,
					role: 'MEMBER'
				}))
			];

			const { error: partError } = await supabase
				.from('ConversationParticipant')
				.insert(participants);

			if (partError) throw partError;

			toast.success("Group created successfully!");
			onCreated(conversation.id);
			onClose();
			// Reset state
			setGroupName("");
			setSelectedUsers([]);
			setSearchQuery("");
		} catch (err: any) {
			console.error("Error creating group:", err);
			toast.error(err.message || "Failed to create group");
		} finally {
			setCreating(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl rounded-[2rem]">
				<div className="bg-gradient-to-br from-green-500/10 via-background to-background p-8 pb-0">
					<DialogTitle className="text-2xl font-bold italic tracking-tight flex items-center gap-3">
						<div className="h-10 w-10 rounded-2xl bg-green-500/10 flex items-center justify-center">
							<Users className="h-6 w-6 text-green-600" />
						</div>
						Create Circle
					</DialogTitle>
					<DialogDescription className="text-muted-foreground/80 mt-1">
						Bring people together for study, projects, or fun.
					</DialogDescription>

					<div className="space-y-6 mt-8">
						<div className="space-y-2 group/field">
						<Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1 group-focus-within/field:text-primary transition-colors">Circle Name</Label>
							<Input
								placeholder="e.g. Physics Study Group, Weekend Hiking..."
								className="h-12 bg-background border-border/50 focus-visible:ring-primary shadow-sm rounded-2xl text-[15px]"
								value={groupName}
								onChange={(e) => setGroupName(e.target.value)}
							/>
						</div>

						<div className="space-y-2 group/search">
							<Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1 group-focus-within/search:text-primary transition-colors">Add Members</Label>
							<div className="relative">
								<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search peers to invite..."
									className="pl-10 h-11 bg-muted/30 border-none rounded-2xl text-sm"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
						</div>
					</div>
				</div>

				<div className="px-8 mt-4">
					{selectedUsers.length > 0 && (
						<div className="flex flex-wrap gap-2 mb-4 max-h-[100px] overflow-y-auto p-1 py-1">
							{selectedUsers.map(user => (
								<Badge key={user.id} className="pl-1 pr-2 py-1 gap-2 bg-primary/10 text-primary hover:bg-primary/20 transition-all border-none rounded-full group/chip">
									<Avatar className="h-5 w-5">
										<AvatarImage src={user.avatarUrl} />
										<AvatarFallback className="text-[8px]">{user.fullName[0]}</AvatarFallback>
									</Avatar>
									<span className="text-[11px] font-bold">{user.fullName.split(' ')[0]}</span>
									<button onClick={() => toggleUser(user)} className="hover:text-red-500 transition-colors">
										<X className="h-3 w-3" />
									</button>
								</Badge>
							))}
						</div>
					)}
				</div>

				<div className="px-8 pb-8">
					<ScrollArea className="h-[200px] border border-border/40 rounded-2xl bg-muted/10 p-2">
						{searching ? (
							<div className="flex flex-col items-center justify-center p-8 gap-2 opacity-40">
								<Loader2 className="h-6 w-6 animate-spin text-primary" />
								<p className="text-[10px] uppercase font-bold tracking-widest">Searching...</p>
							</div>
						) : !searchQuery && results.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-full gap-2 py-8 opacity-30">
								<Users className="h-8 w-8" />
								<p className="text-[11px] font-medium italic">Search for members above</p>
							</div>
						) : results.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-full py-8 opacity-40">
								<p className="text-xs font-semibold">No results for "{searchQuery}"</p>
							</div>
						) : (
							<div className="space-y-1">
								{results.map((user) => (
									<div
										key={user.id}
										className={cn(
											"flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border border-transparent hover:translate-x-1",
											selectedUsers.some(u => u.id === user.id) 
												? "bg-primary/10 border-primary/20 shadow-sm" 
												: "hover:bg-primary/[0.03]"
										)}
										onClick={() => toggleUser(user)}
									>
										<div className="flex items-center gap-3">
											<Avatar className="h-9 w-9 border border-background">
												<AvatarImage src={user.avatarUrl} />
												<AvatarFallback className="text-[10px]">{user.fullName[0]}</AvatarFallback>
											</Avatar>
											<div className="text-left">
												<p className="font-bold text-xs tracking-tight">{user.fullName}</p>
												<p className="text-[10px] text-muted-foreground">@{user.username}</p>
											</div>
										</div>
										{selectedUsers.some(u => u.id === user.id) && (
											<div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground animate-in zoom-in-50">
												<Check className="h-3 w-3" />
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</ScrollArea>
				</div>

				<div className="p-8 pt-0 flex gap-3">
					<Button variant="ghost" onClick={onClose} className="flex-1 rounded-2xl h-12 font-semibold">
						Cancel
					</Button>
					<Button
						onClick={handleCreateGroup}
						disabled={creating || !groupName.trim() || selectedUsers.length < 1}
						className="flex-[2] rounded-2xl h-12 font-bold shadow-lg shadow-primary/20"
					>
						{creating ? (
							<div className="flex items-center gap-2">
								<Loader2 className="h-4 w-4 animate-spin" />
								Creating...
							</div>
						) : "Create Circle"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
