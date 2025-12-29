import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

interface CommentModalProps {
	isOpen: boolean;
	onClose: () => void;
	postId: string;
	postAuthorName: string; // To show in header "Comments on Alex's post"
}

export function CommentModal({ isOpen, onClose, postId, postAuthorName }: CommentModalProps) {
	const [comments, setComments] = useState<any[]>([]);
	const [newComment, setNewComment] = useState("");
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);

	useEffect(() => {
		if (isOpen && postId) {
			fetchComments();
		}
	}, [isOpen, postId]);

	const fetchComments = async () => {
		setLoading(true);
		const { data, error } = await supabase
			.from('Comment')
			.select(`
                *,
                author:Profile(fullName, username, avatarUrl)
            `)
			.eq('postId', postId)
			.order('createdAt', { ascending: true });

		if (error) {
			console.error("Error fetching comments:", error);
		} else {
			setComments(data || []);
		}
		setLoading(false);
	};

	const handleSend = async () => {
		if (!newComment.trim()) return;
		setSending(true);

		const { data: { user } } = await supabase.auth.getUser();
		if (!user) return;

		try {
			const { error } = await supabase.from('Comment').insert({
				content: newComment,
				postId: postId,
				authorId: user.id
			});

			if (error) throw error;

			setNewComment("");
			fetchComments(); // Refresh list
		} catch (err) {
			console.error("Error sending comment:", err);
		} finally {
			setSending(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
				<DialogHeader className="p-4 border-b border-border/50">
					<DialogTitle>Comments on {postAuthorName}'s post</DialogTitle>
				</DialogHeader>

				<ScrollArea className="flex-1 p-4">
					{loading ? (
						<div className="flex justify-center p-4">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : comments.length === 0 ? (
						<div className="text-center text-muted-foreground py-8">
							No comments yet. Say something!
						</div>
					) : (
						<div className="space-y-4">
							{comments.map((comment) => (
								<div key={comment.id} className="flex gap-3">
									<Avatar className="h-8 w-8">
										<AvatarImage src={comment.author?.avatarUrl} />
										<AvatarFallback>{comment.author?.fullName?.[0] || "?"}</AvatarFallback>
									</Avatar>
									<div className="flex-1">
										<div className="bg-muted/50 p-3 rounded-2xl rounded-tl-none">
											<div className="flex items-baseline justify-between mb-1">
												<span className="font-semibold text-sm">{comment.author?.fullName}</span>
												<span className="text-xs text-muted-foreground">
													{(() => {
														const raw = comment.createdAt;
														const dateStr = raw.includes('+') || raw.endsWith('Z') ? raw : (raw.includes('T') ? raw : raw.replace(' ', 'T')) + 'Z';
														return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
													})()}
												</span>
											</div>
											<p className="text-sm text-foreground/90">{comment.content}</p>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</ScrollArea>

				<div className="p-4 border-t border-border/50 bg-card">
					<form
						onSubmit={(e) => { e.preventDefault(); handleSend(); }}
						className="flex gap-2"
					>
						<Input
							value={newComment}
							onChange={(e) => setNewComment(e.target.value)}
							placeholder="Write a comment..."
							className="flex-1"
						/>
						<Button type="submit" size="icon" disabled={sending || !newComment.trim()}>
							{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
						</Button>
					</form>
				</div>
			</DialogContent>
		</Dialog>
	);
}
