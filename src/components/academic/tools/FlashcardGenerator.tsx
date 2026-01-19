import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Layers, ArrowLeft, ArrowRight, RotateCw } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { aiService } from "@/lib/ai";
import { Loader2 } from "lucide-react";

const defaultFlashcards = [
	{ id: 1, front: "What is React?", back: "A JavaScript library for building user interfaces." },
	{ id: 2, front: "What is a component?", back: "Independent and reusable bits of code." },
	{ id: 3, front: "What is State?", back: "An object that determines how that component renders & behaves." },
];

export function FlashcardGenerator() {
	const [cards, setCards] = useState(defaultFlashcards);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isFlipped, setIsFlipped] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [topic, setTopic] = useState("React Basics");

	const nextCard = () => {
		setIsFlipped(false);
		setCurrentIndex((prev) => (prev + 1) % cards.length);
	};

	const prevCard = () => {
		setIsFlipped(false);
		setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
	};

	const generateNewSet = async () => {
		const newTopic = prompt("Enter a topic for flashcards (e.g., Quantum Physics, French Revolution):");
		if (!newTopic) return;

		setIsGenerating(true);
		try {
			// Use Server Action instead of Client-side Edge Function call
			const { generateFlashcardsAction } = await import("@/app/academic/actions");
			const { success, flashcards } = await generateFlashcardsAction(newTopic);

			if (success && flashcards && flashcards.length > 0) {
				setCards(flashcards.map((c: any, i: number) => ({ ...c, id: Date.now() + i })));
				setCurrentIndex(0);
				setIsFlipped(false);
				setTopic(newTopic);
			}
		} catch (error) {
			console.error("Error generating flashcards:", error);
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<Card className="border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden">
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-base">
					<Layers className="h-4 w-4 text-pink-400" />
					AI Flashcards
				</CardTitle>
				<CardDescription className="text-xs">
					Reviewing set: "{topic}"
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">

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
						{/* Front */}
						<div className="absolute inset-0 backface-hidden bg-background/80 border border-border rounded-xl p-6 flex items-center justify-center text-center shadow-sm">
							<p className="font-medium text-lg">{cards[currentIndex]?.front}</p>
							<span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground uppercase tracking-widest">Question</span>
						</div>

						{/* Back */}
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

				<Button
					variant="outline"
					size="sm"
					className="w-full gap-2"
					onClick={generateNewSet}
					disabled={isGenerating}
				>
					{isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-pink-500" />}
					{isGenerating ? "Generating..." : "Generate New Set"}
				</Button>

			</CardContent>
		</Card>
	);
}
