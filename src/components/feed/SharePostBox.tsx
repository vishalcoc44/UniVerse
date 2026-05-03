import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Image as ImageIcon,
	Video,
	Globe,
	Send,
	Sparkles,
	X,
	Mic,
	BarChart2,
	Plus,
	Trash2
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export function SharePostBox({ onPostCreated }: { onPostCreated?: () => void }) {
	const [content, setContent] = useState("");
	const [isExpanded, setIsExpanded] = useState(false);
	const [feedType, setFeedType] = useState("campus");
	const [category, setCategory] = useState("General");
	const [isPosting, setIsPosting] = useState(false);
	const [userProfile, setUserProfile] = useState<{ name: string; avatar: string } | null>(null);
	const [showPoll, setShowPoll] = useState(false);
	const [pollQuestion, setPollQuestion] = useState("");
	const [pollOptions, setPollOptions] = useState(["Option A", "Option B"]);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const categories = ["Academic", "Events", "Social", "Marketplace", "Career", "General"];

	useEffect(() => {
		async function fetchProfile() {
			const { data: { user } } = await supabase.auth.getUser();
			if (user) {
				const { data: profile } = await supabase
					.from('Profile')
					.select('fullName, avatarUrl')
					.eq('id', user.id)
					.single();

				if (profile) {
					setUserProfile({
						name: profile.fullName,
						avatar: profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
					});
				}
			}
		}
		fetchProfile();
	}, []);

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
			textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
		}
	}, [content]);

	const handlePost = async () => {
		if (!content.trim() && !showPoll) return;

		setIsPosting(true);
		try {
			const { data: { user } } = await supabase.auth.getUser();

			if (!user) {
				console.error("User not logged in");
				return;
			}

			const { data: profile } = await supabase
				.from('Profile')
				.select('universityId')
				.eq('id', user.id)
				.single();

			const postId = crypto.randomUUID();

			const { error } = await supabase.from('Post').insert({
				id: postId,
				content: content || (showPoll ? pollQuestion : ''),
				scope: feedType === 'campus' ? 'CAMPUS' : 'UNIVERSE',
				universityId: feedType === 'campus' && profile?.universityId ? profile.universityId : null,
				authorId: user.id,
				type: showPoll ? 'POLL' : 'TEXT',
				category: category,
				updatedAt: new Date().toISOString()
			});

			if (error) throw error;

			// Create poll if enabled
			if (showPoll && pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2) {
				const pollId = crypto.randomUUID();
				await supabase.from('PostPoll').insert({ id: pollId, postId, question: pollQuestion });
				const validOptions = pollOptions.filter(o => o.trim());
				await supabase.from('PostPollOption').insert(
					validOptions.map((text, i) => ({ id: crypto.randomUUID(), pollId, text, displayOrder: i }))
				);
			}

			setContent("");
			setCategory("General");
			setIsExpanded(false);
			setShowPoll(false);
			setPollQuestion("");
			setPollOptions(["Option A", "Option B"]);
			void import("@/lib/analytics").then(({ track }) => track("create_post", { scope: feedType === 'campus' ? 'CAMPUS' : 'UNIVERSE', hasPoll: showPoll }));
			toast.success("Post deployed!");
			if (onPostCreated) onPostCreated();

		} catch (error) {
			console.error("Error creating post:", error);
			toast.error("Failed to post.");
		} finally {
			setIsPosting(false);
		}
	};

	return (
		<Card className={cn(
			"mb-6 sm:mb-10 border-border/40 bg-card/60 backdrop-blur-2xl rounded-2xl sm:rounded-[2.5rem] transition-all duration-500 overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-primary/5",
			isExpanded ? "ring-2 ring-primary/20 shadow-2xl shadow-primary/10" : "hover:border-primary/20"
		)}>
			<div className="p-6 sm:p-8">
				<div className="flex gap-5">
					<Avatar className="h-12 w-12 border-2 border-background ring-4 ring-primary/5 shadow-inner hidden sm:flex shrink-0">
						<AvatarImage src={userProfile?.avatar} className="object-cover" />
						<AvatarFallback className="bg-primary/10 text-primary font-black uppercase text-base">
							{userProfile?.name?.[0] || 'U'}
						</AvatarFallback>
					</Avatar>

					<div className="flex-1 min-w-0">
						<textarea
							ref={textareaRef}
							placeholder="What's sparking in your universe?"
							className="w-full bg-transparent border-none resize-none focus:ring-0 text-lg font-medium italic tracking-tight placeholder:text-muted-foreground/40 min-h-[50px] max-h-[300px] py-1 transition-all duration-300"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							onFocus={() => setIsExpanded(true)}
						/>

						<AnimatePresence>
							{isExpanded && (
								<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "circOut" }} className="overflow-hidden">
									<div className="flex flex-wrap items-center gap-2 mt-4 pb-4">
										{categories.map((cat) => (
											<button key={cat} onClick={() => setCategory(cat)} className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", category === cat ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "bg-muted/50 text-muted-foreground hover:bg-muted/80")}>
												{cat}
											</button>
										))}
									</div>

									{/* Poll Builder */}
									{showPoll && (
										<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 border border-border/30 rounded-2xl p-4 bg-muted/10 space-y-3">
											<div className="flex items-center justify-between">
												<span className="text-sm font-bold">📊 Poll Options</span>
												<button onClick={() => setShowPoll(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
											</div>
											<Input placeholder="Poll question..." value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} className="bg-background/50 text-sm" />
											{pollOptions.map((opt, i) => (
												<div key={i} className="flex gap-2 items-center">
													<Input placeholder={`Option ${i + 1}`} value={opt} onChange={e => { const arr = [...pollOptions]; arr[i] = e.target.value; setPollOptions(arr); }} className="bg-background/50 text-sm flex-1" />
													{pollOptions.length > 2 && <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>}
												</div>
											))}
											{pollOptions.length < 4 && (
												<button onClick={() => setPollOptions([...pollOptions, ''])} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-bold">
													<Plus className="h-3.5 w-3.5" /> Add option
												</button>
											)}
										</motion.div>
									)}
								</motion.div>
							)}
						</AnimatePresence>

					<div className="flex flex-wrap items-center justify-between gap-2 pt-4 sm:pt-6 border-t border-border/10 mt-2">
						<div className="flex flex-wrap gap-1.5 items-center">
							<Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground/50 hover:text-primary hover:bg-primary/5 rounded-full transition-all">
								<ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
							</Button>
							<Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground/50 hover:text-violet-500 hover:bg-violet-500/5 rounded-full transition-all">
								<Video className="h-4 w-4 sm:h-5 sm:w-5" />
							</Button>
							<Button variant="ghost" size="icon" onClick={() => setShowPoll(v => !v)} className={cn("h-9 w-9 sm:h-10 sm:w-10 rounded-full transition-all", showPoll ? "text-primary bg-primary/10" : "text-muted-foreground/50 hover:text-amber-500 hover:bg-amber-500/5")}>
								<BarChart2 className="h-4 w-4 sm:h-5 sm:w-5" />
							</Button>

							<div className="h-6 w-px bg-border/20 mx-1 sm:mx-2 hidden sm:block" />

							<div className="flex bg-muted/30 backdrop-blur-md rounded-full p-0.5 sm:p-1 h-8 sm:h-10 items-center ring-1 ring-border/5">
								<button
									onClick={() => setFeedType("campus")}
									className={cn(
										"text-[9px] sm:text-[10px] uppercase font-black tracking-widest px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full transition-all duration-300",
										feedType === 'campus'
											? 'bg-background shadow-lg text-primary scale-95'
											: 'text-muted-foreground/60 hover:text-foreground'
									)}
								>
									Campus
								</button>
								<button
									onClick={() => setFeedType("universe")}
									className={cn(
										"text-[9px] sm:text-[10px] uppercase font-black tracking-widest px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full transition-all duration-300",
										feedType === 'universe'
											? 'bg-background shadow-lg text-violet-500 scale-95'
											: 'text-muted-foreground/60 hover:text-foreground'
									)}
								>
									Universe
								</button>
							</div>
						</div>

						<div className="flex items-center gap-2 sm:gap-3">
							{isExpanded && (
								<Button
									variant="ghost"
									size="icon"
									onClick={() => {
										setIsExpanded(false);
										if (!content.trim()) setContent("");
									}}
									className="h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground/40 hover:text-foreground rounded-full"
								>
									<X className="h-5 w-5" />
								</Button>
							)}
							<Button
								className={cn(
									"h-10 px-5 sm:h-12 sm:px-8 gap-2 bg-primary hover:bg-primary/90 text-white rounded-full font-black italic tracking-tighter shadow-xl shadow-primary/20 transition-all active:scale-95 group/submit text-sm sm:text-base",
									(!content.trim() || isPosting) && "opacity-50 grayscale"
								)}
								disabled={!content.trim() || isPosting}
								onClick={handlePost}
							>
								{isPosting ? (
									<Sparkles className="h-4 w-4 animate-spin" />
								) : (
									<>Deploy <Send className="h-4 w-4 group-hover/submit:translate-x-1 group-hover/submit:-translate-y-1 transition-transform" /></>
								)}
							</Button>
						</div>
					</div>
					</div>
				</div>
			</div>
		</Card>
	);
}
