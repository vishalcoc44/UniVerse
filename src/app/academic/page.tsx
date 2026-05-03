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
import { Wrench, Sparkles, Brain, GraduationCap, Zap, BookOpen, Clock, Calculator, Layout, MessageSquare, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Submodule = 'chat' | 'community' | 'library' | 'notes' | 'plan' | 'quiz' | 'timer' | 'gpa' | 'flashcards';

interface SubmoduleConfig {
	id: Submodule;
	label: string;
	icon: any;
	color: string;
	description: string;
}

const submodules: SubmoduleConfig[] = [
	{ id: 'chat', label: 'AI Assistant', icon: Brain, color: 'text-blue-500', description: 'Intelligent study companion' },
	{ id: 'community', label: 'Study Circles', icon: GraduationCap, color: 'text-purple-500', description: 'Collaborative learning groups' },
	{ id: 'library', label: 'Neuro Library', icon: BookOpen, color: 'text-emerald-500', description: 'Shared academic resources' },
	{ id: 'notes', label: 'Smart Notes', icon: Sparkles, color: 'text-amber-500', description: 'AI-powered note taking' },
	{ id: 'plan', label: 'Study Planner', icon: Layout, color: 'text-pink-500', description: 'Custom curriculum design' },
	{ id: 'quiz', label: 'Assessment', icon: Zap, color: 'text-indigo-500', description: 'Dynamic quiz generation' },
	{ id: 'timer', label: 'Focus Flow', icon: Clock, color: 'text-orange-500', description: 'Deep work management' },
	{ id: 'gpa', label: 'GPA Oracle', icon: Calculator, color: 'text-cyan-500', description: 'Grade tracking & prediction' },
	{ id: 'flashcards', label: 'Flashcards', icon: MessageSquare, color: 'text-rose-500', description: 'Spaced repetition system' },
];

export default function Academic() {
	const [activeSubmodule, setActiveSubmodule] = useState<Submodule>('chat');
	const [isChatActive, setIsChatActive] = useState(false);

	const renderContent = () => {
		switch (activeSubmodule) {
			case 'chat':
				return (
					<div className="h-full relative group">
						<div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 rounded-[2rem] blur-xl opacity-25 group-hover:opacity-50 transition duration-1000" />
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
					</div>
				);
			case 'community':
				return <StudyCircles />;
			case 'library':
				return <ResourceGrid />;
			case 'notes':
				return <SmartNotesEditor />;
			case 'plan':
				return <StudyPlanGenerator />;
			case 'quiz':
				return <QuizGenerator />;
			case 'timer':
				return <FocusTimer />;
			case 'gpa':
				return <GPACalculator />;
			case 'flashcards':
				return <FlashcardGenerator />;
			default:
				return null;
		}
	};

	return (
		<DashboardLayout
			title={<>Academic <span className="text-primary">Hub</span></>}
			icon={Brain}
			subtitle="Next-generation academic intelligence and collaborative research hive."
			breadcrumb={["UniVerse", "Academic"]}
		>
			<div className="relative flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-200px)]">
				{/* Background Glows */}
				<div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
					<div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
					<div className="absolute bottom-[20%] -right-[10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px] animate-pulse delay-700" />
				</div>

				{/* Sidebar Navigation */}
				<div className="w-full lg:w-80 flex flex-col gap-6 relative z-10">
					<div className="bg-card/40 backdrop-blur-2xl border border-border/40 rounded-[2rem] p-4 shadow-2xl">
						<div className="px-3 py-2 mb-4">
							<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Submodules</p>
						</div>
						<div className="space-y-1">
							{submodules.map((sub) => {
								const Icon = sub.icon;
								const isActive = activeSubmodule === sub.id;
								return (
									<button
										key={sub.id}
										onClick={() => setActiveSubmodule(sub.id)}
										className={cn(
											"w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden",
											isActive 
												? "bg-primary/10 text-primary shadow-lg shadow-primary/5" 
												: "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
										)}
									>
										{isActive && (
											<motion.div 
												layoutId="activeSub"
												className="absolute inset-0 bg-primary/5 border border-primary/20 rounded-2xl"
												initial={false}
												transition={{ type: "spring", stiffness: 300, damping: 30 }}
											/>
										)}
										<div className={cn(
											"relative h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300",
											isActive ? "bg-primary text-primary-foreground shadow-lg" : "bg-muted/50 group-hover:bg-muted"
										)}>
											<Icon className="h-5 w-5" />
										</div>
										<div className="flex-1 text-left relative z-10">
											<p className={cn("text-sm font-bold tracking-tight", isActive ? "text-primary" : "text-foreground/80")}>
												{sub.label}
											</p>
											<p className="text-[10px] text-muted-foreground font-medium line-clamp-1">
												{sub.description}
											</p>
										</div>
										<ChevronRight className={cn("h-4 w-4 transition-transform", isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0")} />
									</button>
								);
							})}
						</div>
					</div>

					{/* Quick Stats or Promo Card */}
					<div className="bg-gradient-to-br from-primary to-purple-600 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden group">
						<div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 blur-3xl rounded-full transition-transform group-hover:scale-150 duration-700" />
						<div className="relative z-10">
							<Sparkles className="h-8 w-8 mb-4 opacity-80" />
							<h4 className="font-black text-lg leading-tight mb-2">Academic Mastery</h4>
							<p className="text-xs text-white/70 leading-relaxed mb-4">Leverage our AI tools to boost your research efficiency by up to 40%.</p>
							<div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
								<motion.div 
									className="h-full bg-white" 
									initial={{ width: 0 }}
									animate={{ width: "75%" }}
									transition={{ duration: 2, ease: "easeOut" }}
								/>
							</div>
							<p className="text-[10px] font-bold uppercase tracking-widest mt-3 opacity-60">Engine Load: Optimized</p>
						</div>
					</div>
				</div>

				{/* Main Content Area */}
				<div className="flex-1 min-w-0 relative z-10">
					<motion.div
						key={activeSubmodule}
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.4, ease: "easeOut" }}
						className="h-full"
					>
						<div className={cn(
							"bg-card/30 backdrop-blur-3xl border border-border/40 rounded-[2rem] p-4 md:p-8 shadow-2xl min-h-[600px] ring-1 ring-white/5 relative overflow-hidden",
							activeSubmodule === 'chat' && "p-0 bg-transparent border-none shadow-none backdrop-blur-none ring-0 h-[600px]"
						)}>
							{activeSubmodule !== 'chat' && (
								<div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] -mr-32 -mt-32 rounded-full" />
							)}
							{renderContent()}
						</div>
					</motion.div>
				</div>
			</div>
		</DashboardLayout>
	);
}
