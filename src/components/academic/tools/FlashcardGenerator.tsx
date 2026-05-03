'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Layers, ArrowLeft, ArrowRight, RotateCw, Library, Loader2, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface FlashcardData {
	id?: number;
	front: string;
	back: string;
}

interface FlashcardSetData {
	id: string;
	title: string;
	createdAt: string;
	cards: FlashcardData[];
}

export function FlashcardGenerator() {
	const [cards, setCards] = useState<FlashcardData[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isFlipped, setIsFlipped] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [topic, setTopic] = useState("");
	const [activeTopic, setActiveTopic] = useState("Getting Started");
	const [savedSets, setSavedSets] = useState<FlashcardSetData[]>([]);
	const [showSaved, setShowSaved] = useState(false);
	const [loadingSets, setLoadingSets] = useState(false);

	useEffect(() => {
		loadSavedSets();
	}, []);

	const loadSavedSets = async () => {
		setLoadingSets(true);
		try {
			const { getFlashcardSets } = await import("@/app/academic/actions");
			const result = await getFlashcardSets();
			if (result.success && result.sets) {
				setSavedSets(result.sets);
				if (result.sets.length > 0 && cards.length === 0) {
					const latest = result.sets[0];
					setCards(latest.cards || []);
					setActiveTopic(latest.title);
					setCurrentIndex(0);
				}
			}
		} catch (err) {
			console.error("Failed to load saved sets:", err);
		} finally {
			setLoadingSets(false);
		}
	};

	const nextCard = () => {
		if (cards.length === 0) return;
		setIsFlipped(false);
		setCurrentIndex((prev) => (prev + 1) % cards.length);
	};

	const prevCard = () => {
		if (cards.length === 0) return;
		setIsFlipped(false);
		setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
	};

	const generateNewSet = async () => {
		if (!topic.trim()) {
			toast.error("Please enter a topic first");
			return;
		}

		setIsGenerating(true);
		try {
			const { generateFlashcardsAction } = await import("@/app/academic/actions");
			const { success, flashcards, error } = await generateFlashcardsAction(topic.trim());

			if (success && flashcards && flashcards.length > 0) {
				setCards(flashcards.map((c: any, i: number) => ({ ...c, id: Date.now() + i })));
				setCurrentIndex(0);
				setIsFlipped(false);
				setActiveTopic(topic.trim());
				setTopic("");
				void import("@/lib/analytics").then(({ track }) => track("generate_flashcards", { count: flashcards.length }));
				toast.success(`Generated ${flashcards.length} flashcards!`);
				loadSavedSets();
			} else {
				toast.error(error || "Failed to generate flashcards");
			}
		} catch (error) {
			console.error("Error generating flashcards:", error);
			toast.error("Failed to generate flashcards");
		} finally {
			setIsGenerating(false);
		}
	};

	const loadSet = (set: FlashcardSetData) => {
		setCards(set.cards || []);
		setActiveTopic(set.title);
		setCurrentIndex(0);
		setIsFlipped(false);
		setShowSaved(false);
	};

	if (showSaved) {
		return (
			<Card className="border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden">
				<CardHeader className="pb-2">
					<div className="flex items-center justify-between">
						<CardTitle className="flex items-center gap-2 text-base">
							<Library className="h-4 w-4 text-primary" />
							Saved Sets
						</CardTitle>
						<Button variant="ghost" size="sm" onClick={() => setShowSaved(false)}>
							Back
						</Button>
					</div>
				</CardHeader>
				<CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
					{loadingSets ? (
						<div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
					) : savedSets.length === 0 ? (
						<p className="text-sm text-muted-foreground text-center py-8">No saved sets yet. Generate your first one!</p>
					) : (
						savedSets.map((set) => (
							<button
								key={set.id}
								onClick={() => loadSet(set)}
								className="w-full text-left p-3 rounded-xl border border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-all"
							>
								<p className="font-medium text-sm truncate">{set.title}</p>
								<p className="text-xs text-muted-foreground mt-1">{set.cards?.length || 0} cards &middot; {new Date(set.createdAt).toLocaleDateString()}</p>
							</button>
						))
					)}
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden">
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2 text-base">
						<Layers className="h-4 w-4 text-pink-400" />
						AI Flashcards
					</CardTitle>
					<Button variant="ghost" size="sm" onClick={() => { setShowSaved(true); loadSavedSets(); }} className="text-xs gap-1">
						<Library className="h-3 w-3" />
						{savedSets.length > 0 ? `${savedSets.length} Sets` : "Saved"}
					</Button>
				</div>
				{cards.length > 0 && (
					<CardDescription className="text-xs">
						Reviewing: &quot;{activeTopic}&quot;
					</CardDescription>
				)}
			</CardHeader>
			<CardContent className="space-y-4">
				{cards.length > 0 ? (
					<>
						<div
							className="perspective-1000 h-40 cursor-pointer relative"
							onClick={() => setIsFlipped(!isFlipped)}
						>
							<motion.div
								initial={false}
								animate={{ rotateY: isFlipped ? 180 : 0 }}
								transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
								className="w-full h-full relative preserve-3d"
								style={{ transformStyle: 'preserve-3d' }}
							>
								<div className="absolute inset-0 backface-hidden bg-background/80 border border-border rounded-xl p-6 flex items-center justify-center text-center shadow-sm">
									<p className="font-medium text-lg">{cards[currentIndex]?.front}</p>
									<span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground uppercase tracking-widest">Question</span>
								</div>
								<div
									className="absolute inset-0 backface-hidden bg-primary/10 border border-primary/20 rounded-xl p-6 flex items-center justify-center text-center shadow-inner"
									style={{ transform: 'rotateY(180deg)' }}
								>
									<p className="font-medium text-primary">{cards[currentIndex]?.back}</p>
									<span className="absolute bottom-2 right-3 text-[10px] text-primary/60 uppercase tracking-widest">Answer</span>
								</div>
							</motion.div>
						</div>

						<div className="flex items-center justify-between">
							<Button variant="ghost" size="icon" onClick={prevCard} disabled={currentIndex === 0}>
								<ArrowLeft className="h-4 w-4" />
							</Button>
							<span className="text-xs text-muted-foreground font-mono">
								{currentIndex + 1} / {cards.length}
							</span>
							<Button variant="ghost" size="icon" onClick={nextCard}>
								<ArrowRight className="h-4 w-4" />
							</Button>
						</div>
					</>
				) : (
					<div className="h-40 flex flex-col items-center justify-center text-center border-2 border-dashed border-border/30 rounded-xl opacity-60">
						<Layers className="h-8 w-8 mb-2 text-muted-foreground/40" />
						<p className="text-sm text-muted-foreground">Enter a topic below to generate flashcards</p>
					</div>
				)}

				<div className="flex gap-2">
					<Input
						placeholder="e.g. Quantum Physics, French Revolution..."
						value={topic}
						onChange={(e) => setTopic(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && !isGenerating && generateNewSet()}
						className="text-sm"
						disabled={isGenerating}
					/>
					<Button
						size="sm"
						className="shrink-0 gap-1.5"
						onClick={generateNewSet}
						disabled={isGenerating || !topic.trim()}
					>
						{isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
						{isGenerating ? "..." : "Generate"}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
