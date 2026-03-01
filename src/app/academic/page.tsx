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
				className="flex flex-col gap-6"
			>
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full focus-visible:outline-none">
					<motion.div variants={itemVariants}>
						<TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1.5 bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl shadow-sm mb-6 relative z-10">
							<TabsTrigger value="chat" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-xl py-3 text-sm font-bold tracking-wider uppercase flex gap-2 items-center transition-all"><Brain className="h-4 w-4" /> AI Assistant</TabsTrigger>
							<TabsTrigger value="community" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-xl py-3 text-sm font-bold tracking-wider uppercase flex gap-2 items-center transition-all"><GraduationCap className="h-4 w-4" /> Study Circles</TabsTrigger>
							<TabsTrigger value="library" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-xl py-3 text-sm font-bold tracking-wider uppercase flex gap-2 items-center transition-all"><Sparkles className="h-4 w-4" /> Library</TabsTrigger>
							<TabsTrigger value="tools" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-xl py-3 text-sm font-bold tracking-wider uppercase flex gap-2 items-center transition-all"><Wrench className="h-4 w-4" /> Tools</TabsTrigger>
						</TabsList>
					</motion.div>

					<TabsContent value="chat" className="mt-0 focus-visible:outline-none flex justify-center">
						<motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-4xl h-[500px] relative group">
							<div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
							<div className="relative h-full bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg flex flex-col">
								<AnimatePresence mode="wait">
									{!isChatActive ? (
										<motion.div
											key="preview"
											initial={{ opacity: 0, scale: 0.98 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 1.02 }}
											transition={{ duration: 0.3 }}
											className="h-full rounded-2xl overflow-hidden"
										>
											<ChatPreview onActivate={() => setIsChatActive(true)} />
										</motion.div>
									) : (
										<motion.div
											key="chat"
											initial={{ opacity: 0, scale: 0.98 }}
											animate={{ opacity: 1, scale: 1 }}
											transition={{ type: "spring" as const, stiffness: 300, damping: 24 }}
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
						<motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-lg min-h-[500px]">
							<StudyCircles />
						</motion.div>
					</TabsContent>

					<TabsContent value="library" className="mt-0 focus-visible:outline-none">
						<motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-lg min-h-[500px]">
							<ResourceGrid />
						</motion.div>
					</TabsContent>

					<TabsContent value="tools" className="mt-0 focus-visible:outline-none">
						<motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-lg min-h-[500px] flex flex-col">
							<Tabs value={activeToolTab} onValueChange={setActiveToolTab} className="flex-1 flex flex-col h-full">
								<TabsList className="grid grid-cols-3 md:grid-cols-6 gap-2 bg-transparent p-0 h-auto mb-4">
									<TabsTrigger value="notes" className="text-xs font-bold uppercase tracking-wider py-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/30 rounded-xl shadow-sm data-[state=inactive]:bg-muted/50 transition-all">Notes</TabsTrigger>
									<TabsTrigger value="plan" className="text-xs font-bold uppercase tracking-wider py-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/30 rounded-xl shadow-sm data-[state=inactive]:bg-muted/50 transition-all">Plan</TabsTrigger>
									<TabsTrigger value="quiz" className="text-xs font-bold uppercase tracking-wider py-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/30 rounded-xl shadow-sm data-[state=inactive]:bg-muted/50 transition-all">Quiz</TabsTrigger>
									<TabsTrigger value="timer" className="text-xs font-bold uppercase tracking-wider py-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/30 rounded-xl shadow-sm data-[state=inactive]:bg-muted/50 transition-all">Focus</TabsTrigger>
									<TabsTrigger value="gpa" className="text-xs font-bold uppercase tracking-wider py-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/30 rounded-xl shadow-sm data-[state=inactive]:bg-muted/50 transition-all">GPA</TabsTrigger>
									<TabsTrigger value="flashcards" className="text-xs font-bold uppercase tracking-wider py-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/30 rounded-xl shadow-sm data-[state=inactive]:bg-muted/50 transition-all">Cards</TabsTrigger>
								</TabsList>
								<div className="flex-1 mt-2">
									<TabsContent value="notes" className="m-0 h-full"><SmartNotesEditor /></TabsContent>
									<TabsContent value="plan" className="m-0 h-full"><StudyPlanGenerator /></TabsContent>
									<TabsContent value="quiz" className="m-0 h-full"><QuizGenerator /></TabsContent>
									<TabsContent value="timer" className="m-0 h-full"><FocusTimer /></TabsContent>
									<TabsContent value="gpa" className="m-0 h-full"><GPACalculator /></TabsContent>
									<TabsContent value="flashcards" className="m-0 h-full"><FlashcardGenerator /></TabsContent>
								</div>
							</Tabs>
						</motion.div>
					</TabsContent>
				</Tabs>
			</motion.div>
		</DashboardLayout>
	);
};
