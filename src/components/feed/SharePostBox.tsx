
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
	Image as ImageIcon, 
	Smile, 
	Video, 
	Globe, 
	MapPin, 
	Send, 
	Tag, 
	Sparkles, 
	Plus,
	X,
	Paperclip,
	Mic
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function SharePostBox({ onPostCreated }: { onPostCreated?: () => void }) {
	const [content, setContent] = useState("");
	const [isExpanded, setIsExpanded] = useState(false);
	const [feedType, setFeedType] = useState("campus");
	const [category, setCategory] = useState("General");
	const [isPosting, setIsPosting] = useState(false);
	const [userProfile, setUserProfile] = useState<{ name: string; avatar: string } | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const categories = [
		"Academic",
		"Events",
		"Social",
		"Marketplace",
		"Career",
		"General"
	];

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
		if (!content.trim()) return;

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

			const { error } = await supabase.from('Post').insert({
				content,
				scope: feedType === 'campus' ? 'CAMPUS' : 'UNIVERSE',
				universityId: feedType === 'campus' ? profile?.universityId : null,
				authorId: user.id,
				type: 'TEXT',
				category: category
			});

			if (error) throw error;

			setContent("");
			setCategory("General");
			setIsExpanded(false);
			if (onPostCreated) onPostCreated();

		} catch (error) {
			console.error("Error creating post:", error);
		} finally {
			setIsPosting(false);
		}
	};

	return (
		<Card className={cn(
			"mb-10 border-border/40 bg-card/60 backdrop-blur-2xl rounded-[2.5rem] transition-all duration-500 overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-primary/5",
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
								<motion.div
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: 'auto', opacity: 1 }}
									exit={{ height: 0, opacity: 0 }}
									transition={{ duration: 0.3, ease: "circOut" }}
									className="overflow-hidden"
								>
									<div className="flex flex-wrap items-center gap-2 mt-4 pb-4">
										{categories.map((cat) => (
											<button
												key={cat}
												onClick={() => setCategory(cat)}
												className={cn(
													"px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
													category === cat 
														? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
														: "bg-muted/50 text-muted-foreground hover:bg-muted/80"
												)}
											>
												{cat}
											</button>
										))}
									</div>
								</motion.div>
							)}
						</AnimatePresence>

						<div className="flex items-center justify-between pt-6 border-t border-border/10 mt-2">
							<div className="flex gap-1.5 items-center">
								<Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground/50 hover:text-primary hover:bg-primary/5 rounded-full transition-all group/btn">
									<ImageIcon className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
								</Button>
								<Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground/50 hover:text-violet-500 hover:bg-violet-500/5 rounded-full transition-all group/btn">
									<Video className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
								</Button>
								<Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground/50 hover:text-amber-500 hover:bg-amber-500/5 rounded-full transition-all group/btn hidden sm:flex">
									<Mic className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
								</Button>

								<div className="h-6 w-px bg-border/20 mx-2 hidden sm:block" />

								<div className="flex bg-muted/30 backdrop-blur-md rounded-full p-1 h-10 items-center ring-1 ring-border/5">
									<button
										onClick={() => setFeedType("campus")}
										className={cn(
											"text-[10px] uppercase font-black tracking-widest px-4 py-1.5 rounded-full transition-all duration-300",
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
											"text-[10px] uppercase font-black tracking-widest px-4 py-1.5 rounded-full transition-all duration-300",
											feedType === 'universe' 
												? 'bg-background shadow-lg text-violet-500 scale-95' 
												: 'text-muted-foreground/60 hover:text-foreground'
										)}
									>
										Universe
									</button>
								</div>
							</div>

							<div className="flex items-center gap-3">
								{isExpanded && (
									<Button 
										variant="ghost" 
										size="icon" 
										onClick={() => {
											setIsExpanded(false);
											if (!content.trim()) setContent("");
										}}
										className="h-10 w-10 text-muted-foreground/40 hover:text-foreground rounded-full"
									>
										<X className="h-5 w-5" />
									</Button>
								)}
								<Button
									className={cn(
										"h-12 px-8 gap-2 bg-primary hover:bg-primary/90 text-white rounded-full font-black italic tracking-tighter shadow-xl shadow-primary/20 transition-all active:scale-95 group/submit",
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
