'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatInterface } from "@/components/academic/ChatInterface";
import { ChatPreview } from "@/components/academic/ChatPreview";
import { ResourceGrid } from "@/components/academic/ResourceGrid";
import { FocusTimer } from "@/components/academic/tools/FocusTimer";
import { StudyCircles } from "@/components/academic/StudyCircles";
import { GPACalculator } from "@/components/academic/tools/GPACalculator";
import { FlashcardGenerator } from "@/components/academic/tools/FlashcardGenerator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Sparkles, Brain, GraduationCap, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.1 }
	}
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function Academic() {
	const [isChatActive, setIsChatActive] = useState(false);

	return (
		<DashboardLayout
			title={
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
							<Brain className="h-6 w-6" />
						</div>
						<h1 className="text-3xl md:text-4xl font-bold tracking-tight">
							Academic <span className="text-primary">Hub</span>
						</h1>
					</div>
					<div className="flex items-center gap-2 px-1">
						<span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
						<span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">AI Assistant Online</span>
					</div>
				</div>
			}
			subtitle="Intelligent study companion for accelerated learning."
			breadcrumb={["UniVerse", "Academic"]}
		>
			<motion.div
				variants={containerVariants}
				initial="hidden"
				animate="visible"
				className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
			>
				{/* Left Column: Chat Interface */}
				<motion.div variants={itemVariants} className="lg:col-span-7 flex flex-col gap-4 h-[450px] relative group">
					<div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
					<div className="relative h-full">
						<AnimatePresence mode="wait">
							{!isChatActive ? (
								<motion.div
									key="preview"
									initial={{ opacity: 0, scale: 0.98 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 1.02 }}
									transition={{ duration: 0.3 }}
									className="h-full"
								>
									<ChatPreview onActivate={() => setIsChatActive(true)} />
								</motion.div>
							) : (
								<motion.div
									key="chat"
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ type: "spring" as const, stiffness: 300, damping: 24 }}
									className="h-full"
								>
									<ChatInterface />
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</motion.div>

				{/* Right Column: Academic Tools */}
				<motion.div variants={itemVariants} className="lg:col-span-5 flex flex-col gap-4">
					{/* Study Circles */}
					<div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-1 overflow-hidden shadow-lg">
						<div className="p-3 border-b border-border/30 bg-card/40">
							<h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
								<GraduationCap className="h-4 w-4 text-primary" />
								Active Study Circles
							</h3>
						</div>
						<div className="max-h-[220px] overflow-y-auto custom-scrollbar p-2">
							<StudyCircles />
						</div>
					</div>

					{/* Resources & Tools */}
					<div className="flex-1 bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl flex flex-col overflow-hidden shadow-lg">
						<Tabs defaultValue="tools" className="flex-1 flex flex-col">
							<div className="px-3 pt-3 pb-2">
								<TabsList className="grid w-full grid-cols-2 h-10 bg-muted/30 p-1 rounded-lg border border-border/30">
									<TabsTrigger
										value="resources"
										className="rounded-md font-bold uppercase tracking-wider text-[9px] data-[state=active]:bg-card data-[state=active]:shadow-sm"
									>
										Library
									</TabsTrigger>
									<TabsTrigger
										value="tools"
										className="rounded-md font-bold uppercase tracking-wider text-[9px] data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2"
									>
										<Zap className="h-3 w-3" /> Tools
									</TabsTrigger>
								</TabsList>
							</div>

							<TabsContent value="resources" className="flex-1 px-3 pb-3 mt-0 overflow-y-auto custom-scrollbar">
								<div className="space-y-2">
									<div className="flex items-center justify-between px-1">
										<p className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">Research Materials</p>
										<Sparkles className="h-2.5 w-2.5 text-primary animate-pulse" />
									</div>
									<ResourceGrid />
								</div>
							</TabsContent>

							<TabsContent value="tools" className="flex-1 px-3 pb-3 mt-0 space-y-3 overflow-y-auto custom-scrollbar">
								<div className="space-y-2">
									<div className="flex items-center justify-between px-1">
										<p className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">Study Modules</p>
										<Wrench className="h-2.5 w-2.5 text-primary" />
									</div>
									<div className="space-y-3">
										<FocusTimer />
										<GPACalculator />
										<FlashcardGenerator />
									</div>
								</div>
							</TabsContent>
						</Tabs>
					</div>
				</motion.div>
			</motion.div>
		</DashboardLayout>
	);
};
