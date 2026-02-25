"use client";

import { motion } from "framer-motion";
import { Sparkles, Brain, Zap, Send, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatPreviewProps {
	onActivate: () => void;
}

export function ChatPreview({ onActivate }: ChatPreviewProps) {
	return (
		<div className="flex flex-col h-full w-full bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden transition-all duration-500 group/container relative">
			<div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-3xl blur opacity-25 group-hover/container:opacity-40 transition duration-1000" />

			{/* Skeleton Header */}
			<div className="px-6 py-4 border-b border-border/30 flex items-center justify-between bg-card/20 backdrop-blur-3xl z-10">
				<div className="flex items-center gap-4">
					<div className="relative">
						<div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-500 rounded-xl blur opacity-25 group-hover/container:opacity-50 transition duration-500" />
						<div className="relative h-10 w-10 rounded-xl bg-card border border-border/50 flex items-center justify-center text-primary shadow-lg">
							<Sparkles className="h-5 w-5 animate-pulse" />
						</div>
					</div>
					<div>
						<div className="h-4 w-24 bg-primary/20 rounded-md animate-pulse mb-1.5" />
						<div className="h-2 w-16 bg-green-500/20 rounded-md animate-pulse" />
					</div>
				</div>
				<div className="flex gap-2 opacity-50">
					<div className="h-9 w-9 rounded-lg border border-border/30 bg-card/40" />
					<div className="h-9 w-9 rounded-lg border border-border/30 bg-card/40" />
				</div>
			</div>

			{/* Preview Content */}
			<div className="flex-1 flex flex-col items-center justify-center p-4 text-center relative z-10">
				<motion.div
					initial={{ scale: 0.9, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ duration: 0.5 }}
					className="relative mb-4"
				>
					<div className="absolute -inset-6 bg-primary/5 rounded-full blur-3xl animate-pulse" />
					<div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/20 flex items-center justify-center text-primary shadow-2xl">
						<Brain className="h-8 w-8" />
					</div>
					<div className="absolute -bottom-1.5 -right-1.5 h-8 w-8 rounded-xl bg-card border border-border/50 flex items-center justify-center text-primary shadow-xl">
						<Zap className="h-4 w-4" />
					</div>
				</motion.div>

				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.1 }}
					className="space-y-2 max-w-sm"
				>
					<h2 className="text-xl font-bold tracking-tight">
						Ready to <span className="text-primary">Supercharge</span> your learning?
					</h2>
					<p className="text-xs text-muted-foreground leading-relaxed px-4">
						Your Academic AI is ready to help you summarize notes, solve problems, and master your courses.
					</p>
				</motion.div>

				<motion.div
					initial={{ y: 20, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.2 }}
					className="mt-4"
				>
					<Button
						onClick={onActivate}
						size="default"
						className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xl shadow-primary/20 group/btn relative overflow-hidden active:scale-95 transition-all"
					>
						<div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite] transition-transform" />
						<MessageSquareText className="mr-3 h-5 w-5" />
						Start AI Study Session
					</Button>
					<p className="mt-4 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
						Zero Latency Initialization
					</p>
				</motion.div>

				{/* Suggestion Chips */}
				<div className="mt-6 flex flex-wrap justify-center gap-2 max-w-md opacity-60">
					{["Summarize PDF", "Explain Concept", "Practice Quiz"].map((text, i) => (
						<motion.div
							key={text}
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ delay: 0.3 + (i * 0.1) }}
							className="px-4 py-2 rounded-xl bg-card/40 border border-border/50 text-[10px] font-bold uppercase tracking-wider"
						>
							{text}
						</motion.div>
					))}
				</div>
			</div>

			{/* Skeleton Input */}
			<div className="p-4 bg-card/20 border-t border-border/30 backdrop-blur-3xl relative z-10">
				<div className="relative flex items-center bg-card/60 backdrop-blur-md border border-border/50 rounded-2xl p-1.5 opacity-40">
					<div className="h-10 w-10 rounded-xl bg-muted/20" />
					<div className="flex-1 ml-3 h-4 w-32 bg-muted/20 rounded-md" />
					<div className="h-10 w-10 rounded-xl bg-primary/20 ml-2" />
				</div>
			</div>

			<style jsx global>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
		</div>
	);
}
