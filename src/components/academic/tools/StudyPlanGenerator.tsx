"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Target, CalendarDays, Loader2, Play, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { generateStudyPlanAction, markSessionCompleteAction } from "@/app/academic/studyPlanActions";

interface StudySession {
	id?: string;
	date: string;
	durationMinutes: number;
	topic: string;
	completed: boolean;
}

interface StudyPlan {
	id: string;
	title: string;
	sessions: StudySession[];
}

export function StudyPlanGenerator() {
	const [title, setTitle] = useState("");
	const [topics, setTopics] = useState("");
	const [examDate, setExamDate] = useState("");
	const [hoursPerDay, setHoursPerDay] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [plan, setPlan] = useState<StudyPlan | null>(null);

	const handleGenerate = async () => {
		if (!title || !topics || !examDate || !hoursPerDay) {
			toast.error("Please fill in all fields");
			return;
		}

		setIsGenerating(true);
		try {
			const result = await generateStudyPlanAction({
				title,
				topics,
				examDate,
				hoursPerDay: parseFloat(hoursPerDay)
			});

			if (result.success && result.plan) {
				setPlan(result.plan as StudyPlan);
				void import("@/lib/analytics").then(({ track }) => track("generate_study_plan", { sessions: result.plan.sessions.length }));
				toast.success("Study plan generated successfully!");
			} else {
				toast.error(result.error || "Failed to generate study plan");
			}
		} catch (error) {
			toast.error("An unexpected error occurred");
			console.error(error);
		} finally {
			setIsGenerating(false);
		}
	};

	const resetPlan = () => {
		setPlan(null);
	};

	const toggleSessionCompletion = async (index: number) => {
		if (!plan) return;

		const sessions = [...plan.sessions];
		const session = sessions[index];
		session.completed = !session.completed;

		// Optimistic UI update
		setPlan({ ...plan, sessions });

		if (session.id) {
			await markSessionCompleteAction(session.id, session.completed);
			if (session.completed) void import("@/lib/analytics").then(({ track }) => track("complete_study_session"));
		}
	};

	if (plan) {
		return (
			<Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-lg relative overflow-hidden flex flex-col group min-h-[400px]">
				<div className="absolute top-0 left-0 w-full h-1 pointer-events-none bg-gradient-to-r from-teal-500 to-emerald-500" />
				<CardHeader className="pb-3 border-b border-border/30">
					<CardTitle className="text-lg flex items-center justify-between">
						<span className="flex items-center gap-2">
							<CalendarDays className="h-5 w-5 text-teal-500" />
							{plan.title}
						</span>
						<Button variant="ghost" size="sm" onClick={resetPlan} className="h-8 px-2 text-xs">
							New Plan
						</Button>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0 overflow-y-auto max-h-[300px] custom-scrollbar">
					<div className="divide-y divide-border/30">
						{plan.sessions.map((session, idx) => {
							const dateObj = new Date(session.date);
							const formattedDate = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

							return (
								<div key={idx} className="p-3 hover:bg-muted/10 transition-colors flex items-start gap-3 group/session">
									<button
										onClick={() => toggleSessionCompletion(idx)}
										className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${session.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-border text-transparent hover:border-emerald-500/50'}`}
									>
										<CheckCircle2 className="h-3.5 w-3.5" />
									</button>
									<div className={`flex-1 min-w-0 ${session.completed ? 'opacity-50 line-through' : ''}`}>
										<div className="flex justify-between items-start mb-1">
											<p className="text-sm font-semibold truncate pr-2" title={session.topic}>{session.topic}</p>
										</div>
										<div className="flex items-center gap-3 text-xs text-muted-foreground">
											<span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formattedDate}</span>
											<span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {session.durationMinutes}m</span>
										</div>
									</div>
									{!session.completed && (
										<Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover/session:opacity-100 -mr-1 transition-opacity" title="Start Timer">
											<Play className="h-3 w-3 text-teal-500" />
										</Button>
									)}
								</div>
							);
						})}
					</div>
				</CardContent >
			</Card >
		);
	}

	return (
		<Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-lg relative overflow-hidden group">
			<div className="absolute -inset-1 pointer-events-none bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
			<CardHeader>
				<CardTitle className="text-lg flex items-center gap-2">
					<CalendarDays className="h-5 w-5 text-teal-500" />
					AI Study Plan Generator
				</CardTitle>
				<CardDescription>Generate a realistic, day-by-day study schedule automatically.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-2 col-span-1 md:col-span-2">
						<label className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Goal Title</label>
						<Input
							placeholder="e.g. Master ReactJS, Passing Midterms"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							disabled={isGenerating}
							className="bg-background/50 border-border/50"
						/>
					</div>
					<div className="space-y-2 col-span-1 md:col-span-2">
						<label className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Topics / Details</label>
						<Input
							placeholder="e.g. Hooks, Context API, Next.js routing"
							value={topics}
							onChange={(e) => setTopics(e.target.value)}
							disabled={isGenerating}
							className="bg-background/50 border-border/50"
						/>
					</div>
					<div className="space-y-2">
						<label className="text-xs font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-1"><Target className="h-3 w-3" /> Exam Date</label>
						<Input
							type="date"
							value={examDate}
							onChange={(e) => setExamDate(e.target.value)}
							disabled={isGenerating}
							className="bg-background/50 border-border/50"
						/>
					</div>
					<div className="space-y-2">
						<label className="text-xs font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Hours/Day</label>
						<Input
							type="number"
							placeholder="e.g. 2"
							min="0.5"
							step="0.5"
							value={hoursPerDay}
							onChange={(e) => setHoursPerDay(e.target.value)}
							disabled={isGenerating}
							className="bg-background/50 border-border/50"
						/>
					</div>
				</div>

				<Button
					onClick={handleGenerate}
					disabled={isGenerating || !title || !topics || !examDate || !hoursPerDay}
					className="w-full shadow-lg shadow-teal-500/20 bg-teal-600 hover:bg-teal-700 text-white transition-all"
				>
					{isGenerating ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Scheduling...
						</>
					) : (
						<>
							<CalendarDays className="mr-2 h-4 w-4" />
							Generate Schedule
						</>
					)}
				</Button>
			</CardContent>
		</Card>
	);
}
