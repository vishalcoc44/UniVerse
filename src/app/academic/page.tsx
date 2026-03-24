'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatInterface } from "@/components/academic/ChatInterface";
import { ChatPreview } from "@/components/academic/ChatPreview";
import { ResourceGrid } from "@/components/academic/ResourceGrid";
import { FocusTimer } from "@/components/academic/tools/FocusTimer";
import { StudyCircles } from "@/components/academic/StudyCircles";
import { GPACalculator } from "@/components/academic/tools/GPACalculator";
import { FlashcardGenerator } from "@/components/academic/tools/FlashcardGenerator";
import { QuizGenerator } from "@/components/academic/tools/QuizGenerator";
import { StudyPlanGenerator } from "@/components/academic/tools/StudyPlanGenerator";
import { SmartNotesEditor } from "@/components/academic/tools/SmartNotesEditor";
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
	const [activeTab, setActiveTab] = useState("chat");
	const [activeToolTab, setActiveToolTab] = useState("notes");

	return (
		<DashboardLayout
			title={
				<div className="flex flex-col gap-1.5">
					<div className="flex items-center gap-4">
						<div className="relative group">
							<div className="absolute -inset-1.5 bg-gradient-to-tr from-primary/40 to-purple-500/40 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition duration-500" />
							<div className="relative h-11 w-11 rounded-xl bg-background/80 backdrop-blur-md flex items-center justify-center text-primary border border-primary/20 shadow-xl overflow-hidden">
								<div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
								<Brain className="h-6 w-6 relative z-10" />
							</div>
						</div>
						<h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
							<span className="bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">Academic</span>
							<span className="text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]">Hub</span>
						</h1>
					</div>
					<div className="flex items-center gap-2.5 px-0.5">
						<div className="relative flex items-center justify-center">
							<span className="h-2 w-2 rounded-full bg-green-500" />
							<span className="absolute h-2 w-2 rounded-full bg-green-500 animate-ping opacity-75" />
						</div>
						<span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">AI Synthesis Engine • Stable</span>
					</div>
				</div>
			}
			subtitle="Next-generation academic intelligence and collaborative research hive."
			breadcrumb={["UniVerse", "Academic"]}
		>
			<div className="relative flex flex-col gap-8">
				{/* Background Glows */}
				<div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
					<div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
					<div className="absolute bottom-[20%] -right-[10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px] animate-pulse delay-700" />
				</div>

				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full focus-visible:outline-none relative z-10">
					<motion.div variants={itemVariants}>
					<TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1.5 bg-card/40 backdrop-blur-2xl border border-border/40 rounded-2xl md:rounded-3xl shadow-2xl mb-4 md:mb-8 relative z-20 overflow-hidden">
						<div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-30" />
						<TabsTrigger value="chat" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_20px_rgba(var(--primary),0.1)] rounded-xl md:rounded-2xl py-2.5 md:py-4 text-[10px] md:text-xs font-black tracking-[0.1em] uppercase flex gap-1.5 md:gap-3 items-center transition-all duration-500 z-10"><Brain className="h-3.5 w-3.5 md:h-4 md:w-4" /> AI Interface</TabsTrigger>
						<TabsTrigger value="community" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_20px_rgba(var(--primary),0.1)] rounded-xl md:rounded-2xl py-2.5 md:py-4 text-[10px] md:text-xs font-black tracking-[0.1em] uppercase flex gap-1.5 md:gap-3 items-center transition-all duration-500 z-10"><GraduationCap className="h-3.5 w-3.5 md:h-4 md:w-4" /> <span className="hidden sm:inline">Study </span>Circles</TabsTrigger>
						<TabsTrigger value="library" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_20px_rgba(var(--primary),0.1)] rounded-xl md:rounded-2xl py-2.5 md:py-4 text-[10px] md:text-xs font-black tracking-[0.1em] uppercase flex gap-1.5 md:gap-3 items-center transition-all duration-500 z-10"><Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4" /> <span className="hidden sm:inline">Neuro </span>Library</TabsTrigger>
						<TabsTrigger value="tools" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_20px_rgba(var(--primary),0.1)] rounded-xl md:rounded-2xl py-2.5 md:py-4 text-[10px] md:text-xs font-black tracking-[0.1em] uppercase flex gap-1.5 md:gap-3 items-center transition-all duration-500 z-10"><Wrench className="h-3.5 w-3.5 md:h-4 md:w-4" /> <span className="hidden sm:inline">Logic </span>Tools</TabsTrigger>
					</TabsList>
					</motion.div>

					<TabsContent value="chat" className="mt-0 focus-visible:outline-none flex justify-center">
					<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="w-full max-w-5xl h-[calc(100vh-280px)] md:h-[600px] relative group">
							<div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 rounded-[2rem] blur-xl opacity-25 group-hover:opacity-50 transition duration-1000 shadow-[0_0_50px_rgba(var(--primary),0.1)]" />
							<div className="relative h-full bg-card/30 backdrop-blur-3xl border border-border/40 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/5">
								<AnimatePresence mode="wait">
									{!isChatActive ? (
										<motion.div
											key="preview"
											initial={{ opacity: 0, filter: "blur(10px)" }}
											animate={{ opacity: 1, filter: "blur(0px)" }}
											exit={{ opacity: 0, filter: "blur(10px)" }}
											transition={{ duration: 0.5 }}
											className="h-full rounded-2xl overflow-hidden"
										>
											<ChatPreview onActivate={() => setIsChatActive(true)} />
										</motion.div>
									) : (
										<motion.div
											key="chat"
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ type: "spring", stiffness: 260, damping: 20 }}
											className="h-full rounded-2xl overflow-hidden"
										>
											<ChatInterface />
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						</motion.div>
					</TabsContent>

					<TabsContent value="community" className="mt-0 focus-visible:outline-none">
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-card/30 backdrop-blur-3xl border border-border/40 rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-2xl min-h-[400px] md:min-h-[600px] ring-1 ring-white/5 relative overflow-hidden">
							<div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] -mr-32 -mt-32 rounded-full" />
							<StudyCircles />
						</motion.div>
					</TabsContent>

					<TabsContent value="library" className="mt-0 focus-visible:outline-none">
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-card/30 backdrop-blur-3xl border border-border/40 rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-2xl min-h-[400px] md:min-h-[600px] ring-1 ring-white/5 relative overflow-hidden">
							<div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-[80px] -ml-32 -mb-32 rounded-full" />
							<ResourceGrid />
						</motion.div>
					</TabsContent>

					<TabsContent value="tools" className="mt-0 focus-visible:outline-none">
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-card/30 backdrop-blur-3xl border border-border/40 rounded-2xl md:rounded-[2rem] p-4 md:p-8 shadow-2xl min-h-[400px] md:min-h-[600px] flex flex-col ring-1 ring-white/5">
						<Tabs value={activeToolTab} onValueChange={setActiveToolTab} className="flex-1 flex flex-col h-full">
							<TabsList className="grid grid-cols-3 md:grid-cols-6 gap-1.5 md:gap-3 bg-muted/20 p-1 md:p-1.5 h-auto mb-4 md:mb-8 rounded-xl md:rounded-2xl border border-border/20 backdrop-blur-md">
								<TabsTrigger value="notes" className="text-[10px] font-black uppercase tracking-[0.15em] py-2.5 md:py-4 data-[state=active]:bg-primary/20 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 rounded-lg md:rounded-xl shadow-xl transition-all duration-300">Notes</TabsTrigger>
								<TabsTrigger value="plan" className="text-[10px] font-black uppercase tracking-[0.15em] py-2.5 md:py-4 data-[state=active]:bg-primary/20 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 rounded-lg md:rounded-xl shadow-xl transition-all duration-300">Plan</TabsTrigger>
								<TabsTrigger value="quiz" className="text-[10px] font-black uppercase tracking-[0.15em] py-2.5 md:py-4 data-[state=active]:bg-primary/20 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 rounded-lg md:rounded-xl shadow-xl transition-all duration-300">Quiz</TabsTrigger>
								<TabsTrigger value="timer" className="text-[10px] font-black uppercase tracking-[0.15em] py-2.5 md:py-4 data-[state=active]:bg-primary/20 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 rounded-lg md:rounded-xl shadow-xl transition-all duration-300">Focus</TabsTrigger>
								<TabsTrigger value="gpa" className="text-[10px] font-black uppercase tracking-[0.15em] py-2.5 md:py-4 data-[state=active]:bg-primary/20 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 rounded-lg md:rounded-xl shadow-xl transition-all duration-300">GPA</TabsTrigger>
								<TabsTrigger value="flashcards" className="text-[10px] font-black uppercase tracking-[0.15em] py-2.5 md:py-4 data-[state=active]:bg-primary/20 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 rounded-lg md:rounded-xl shadow-xl transition-all duration-300">Cards</TabsTrigger>
							</TabsList>
								<div className="flex-1 mt-4 relative">
									<AnimatePresence mode="wait">
										<motion.div
											key={activeToolTab}
											initial={{ opacity: 0, x: 10 }}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0, x: -10 }}
											transition={{ duration: 0.3 }}
											className="h-full"
										>
											<TabsContent value="notes" className="m-0 h-full"><SmartNotesEditor /></TabsContent>
											<TabsContent value="plan" className="m-0 h-full"><StudyPlanGenerator /></TabsContent>
											<TabsContent value="quiz" className="m-0 h-full"><QuizGenerator /></TabsContent>
											<TabsContent value="timer" className="m-0 h-full"><FocusTimer /></TabsContent>
											<TabsContent value="gpa" className="m-0 h-full"><GPACalculator /></TabsContent>
											<TabsContent value="flashcards" className="m-0 h-full"><FlashcardGenerator /></TabsContent>
										</motion.div>
									</AnimatePresence>
								</div>
							</Tabs>
						</motion.div>
					</TabsContent>
				</Tabs>
			</div>
		</DashboardLayout>
	);
};
