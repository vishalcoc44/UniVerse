'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ResumeUploader } from "@/components/career/ResumeUploader";
import { AnalysisDashboard } from "@/components/career/AnalysisDashboard";
import { MockInterviewer } from "@/components/career/tools/MockInterviewer";
import { AlumniDirectory } from "@/components/career/tools/AlumniDirectory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	FileText,
	Users,
	Mic,
	Sparkles,
	Briefcase,
	GraduationCap,
	TrendingUp,
	Search,
	ChevronRight,
	Target,
	Award
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Career() {
	const [refreshKey, setRefreshKey] = useState(0);
	const [activeTab, setActiveTab] = useState("resume");

	return (
		<DashboardLayout
			title={
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
						<Briefcase className="h-6 w-6" />
					</div>
					<h1 className="text-3xl md:text-4xl font-bold tracking-tight">
						Career <span className="text-primary">Hub</span>
					</h1>
				</div>
			}
			subtitle="AI-powered tools to accelerate your professional journey."
			breadcrumb={["UniVerse", "Career"]}
		>
			<div className="max-w-7xl mx-auto pb-20 w-full overflow-x-hidden">
				<div className="flex flex-col lg:flex-row gap-8">
					{/* Left Sidebar - Navigation & Quick Stats */}
					<div className="w-full lg:w-[280px] shrink-0 space-y-6">
						<div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-6 sticky top-6">
							<div className="space-y-2">
								<button
									onClick={() => setActiveTab("resume")}
									className={cn(
										"w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group",
										activeTab === "resume"
											? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
											: "text-muted-foreground hover:bg-primary/5 hover:text-primary"
									)}
								>
									<FileText className={cn("h-5 w-5 transition-transform duration-500", activeTab === "resume" ? "scale-110" : "group-hover:scale-110")} />
									<span className="font-bold tracking-tight italic">Resume AI</span>
								</button>
								<button
									onClick={() => setActiveTab("interview")}
									className={cn(
										"w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group",
										activeTab === "interview"
											? "bg-violet-500 text-white shadow-lg shadow-violet-500/20 scale-[1.02]"
											: "text-muted-foreground hover:bg-violet-500/5 hover:text-violet-500"
									)}
								>
									<Mic className={cn("h-5 w-5 transition-transform duration-500", activeTab === "interview" ? "scale-110" : "group-hover:scale-110")} />
									<span className="font-bold tracking-tight italic">Mock Interview</span>
								</button>
								<button
									onClick={() => setActiveTab("network")}
									className={cn(
										"w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group",
										activeTab === "network"
											? "bg-amber-500 text-white shadow-lg shadow-amber-500/20 scale-[1.02]"
											: "text-muted-foreground hover:bg-amber-500/5 hover:text-amber-500"
									)}
								>
									<Users className={cn("h-5 w-5 transition-transform duration-500", activeTab === "network" ? "scale-110" : "group-hover:scale-110")} />
									<span className="font-bold tracking-tight italic">Alumni Network</span>
								</button>
							</div>

							<div className="mt-10 pt-8 border-t border-border/10 space-y-6">
								<div>
									<h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-4 px-2">Market Pulse</h4>
									<div className="space-y-3">
										{[
											{ label: "Tech Hiring", trend: "+12%", color: "text-green-500" },
											{ label: "Internships", trend: "+8%", color: "text-blue-500" },
											{ label: "AI Roles", trend: "+24%", color: "text-violet-500" }
										].map((insight) => (
											<div key={insight.label} className="flex items-center justify-between px-2 group cursor-default">
												<span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">{insight.label}</span>
												<span className={cn("text-[10px] font-black italic", insight.color)}>{insight.trend}</span>
											</div>
										))}
									</div>
								</div>

								<div className="bg-gradient-to-br from-primary/10 to-transparent rounded-3xl p-5 border border-primary/5">
									<Target className="h-6 w-6 text-primary mb-3" />
									<p className="text-xs font-bold italic tracking-tight leading-relaxed">
										Next Milestone: <span className="block text-primary">Technical Mock Interview</span>
									</p>
									<div className="mt-3 h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
										<div className="h-full w-[65%] bg-primary" />
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Main Content Area */}
					<div className="flex-1 min-w-0">
						<AnimatePresence mode="wait">
							{activeTab === "resume" && (
								<motion.div
									key="resume"
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -20 }}
									className="space-y-8"
								>
									<div className="grid grid-cols-1 xl:grid-cols-[1fr_minmax(0,400px)] gap-8">
										<div className="space-y-8">
											<div className="relative group">
												<div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-violet-500/20 to-primary/20 rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
												<ResumeUploader onUploadComplete={() => setRefreshKey(prev => prev + 1)} />
											</div>

											{/* Recommended Skills / Keywords */}
											<div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-8">
												<div className="flex items-center justify-between mb-6">
													<div className="flex items-center gap-3">
														<div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
															<Sparkles className="h-5 w-5" />
														</div>
														<h3 className="font-black text-xl italic tracking-tight uppercase">Trending Keywords</h3>
													</div>
													<Badge variant="outline" className="border-green-500/20 text-green-500 bg-green-500/5 font-black uppercase tracking-widest text-[9px] py-1">Live Updates</Badge>
												</div>
												<div className="flex flex-wrap gap-3">
													{["React Native", "PostgreSQL", "Next.js 15", "System Design", "AWS Lambda", "Tails", "TensorFlow", "Kubernetes"].map((skill, idx) => (
														<span
															key={skill}
															className={cn(
																"px-5 py-2.5 rounded-2xl text-xs font-black italic tracking-tight transition-all duration-300 cursor-default border border-border/30",
																idx < 3 ? "bg-primary text-white shadow-lg shadow-primary/10 border-transparent" : "bg-card/60 text-muted-foreground hover:bg-muted/50"
															)}
														>
															{skill}
														</span>
													))}
												</div>
											</div>
										</div>

										<div className="space-y-6">
											<div className="flex items-center gap-3 mb-2 px-2">
												<TrendingUp className="h-5 w-5 text-primary" />
												<h3 className="font-black text-lg italic tracking-tighter uppercase">ATS Analysis</h3>
											</div>
											<AnalysisDashboard key={refreshKey} />
										</div>
									</div>
								</motion.div>
							)}

							{activeTab === "interview" && (
								<motion.div
									key="interview"
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -20 }}
									className="grid grid-cols-1 xl:grid-cols-3 gap-8"
								>
									<div className="xl:col-span-2">
										<MockInterviewer />
									</div>
									<div className="space-y-6">
										<div className="bg-gradient-to-br from-violet-500/10 via-card/40 to-card/40 backdrop-blur-xl border border-violet-500/20 rounded-[2.5rem] p-8">
											<div className="flex items-center gap-3 mb-6">
												<div className="p-2.5 rounded-2xl bg-violet-500/10 text-violet-500">
													<Award className="h-5 w-5" />
												</div>
												<h4 className="font-black text-lg italic tracking-tight uppercase">Preparation Guide</h4>
											</div>
											<ul className="space-y-5">
												{[
													{ title: "Eye Contact", desc: "Keep your gaze focused towards the camera module.", icon: Search },
													{ title: "STAR Method", desc: "Structure your answers: Situation, Task, Action, Result.", icon: Target },
													{ title: "Clarity & Pace", desc: "Avoid filler words and maintain a steady rhythm.", icon: Mic }
												].map((tip, idx) => (
													<li key={idx} className="flex gap-4 group">
														<div className="shrink-0 w-8 h-8 rounded-xl bg-card border border-border/50 flex items-center justify-center text-violet-500 group-hover:scale-110 transition-transform">
															<tip.icon className="h-4 w-4" />
														</div>
														<div>
															<p className="text-sm font-black italic text-foreground tracking-tight">{tip.title}</p>
															<p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{tip.desc}</p>
														</div>
													</li>
												))}
											</ul>
											<Button className="w-full mt-8 h-12 rounded-2xl bg-violet-500 hover:bg-violet-600 font-black italic tracking-tighter shadow-lg shadow-violet-500/20">
												View Mastery Roadmap
											</Button>
										</div>
									</div>
								</motion.div>
							)}

							{activeTab === "network" && (
								<motion.div
									key="network"
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -20 }}
									className="grid grid-cols-1 xl:grid-cols-3 gap-8"
								>
									<div className="xl:col-span-2">
										<AlumniDirectory />
									</div>
									<div className="space-y-6">
										<div className="bg-gradient-to-br from-amber-500/10 via-card/40 to-card/40 backdrop-blur-xl border border-amber-500/20 rounded-[2.5rem] p-8 text-center relative overflow-hidden group">
											<div className="absolute top-0 right-0 p-8 opacity-5">
												<GraduationCap className="h-32 w-32" />
											</div>
											<div className="relative">
												<div className="bg-amber-500/10 p-5 rounded-[2rem] text-amber-500 w-fit mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
													<Users className="h-10 w-10" />
												</div>
												<h4 className="font-black text-2xl italic tracking-tighter uppercase mb-2">Elite Mentorship</h4>
												<p className="text-sm text-muted-foreground leading-relaxed italic mb-8">
													Accelerate your career by connecting with seniors at top-tier organizations.
												</p>
												<Button className="w-full h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 font-black italic tracking-tighter shadow-xl shadow-amber-500/20 flex gap-2 items-center justify-center">
													Apply as Mentee <ChevronRight className="h-4 w-4" />
												</Button>
											</div>
										</div>

										<div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-8">
											<h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-6">Recent Placements</h4>
											<div className="space-y-5">
												{[
													{ name: "John Wick", company: "Google", role: "SWE II" },
													{ name: "Jane Smith", company: "Meta", role: "Product Manager" },
													{ name: "Mike Ross", company: "Stripe", role: "Backend Lead" }
												].map((alum, idx) => (
													<div key={idx} className="flex items-center gap-4 group cursor-pointer">
														<div className="h-10 w-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center font-black italic text-primary text-xs">
															{alum.name[0]}
														</div>
														<div className="flex-1">
															<p className="text-xs font-black italic text-foreground tracking-tight group-hover:text-primary transition-colors">{alum.name}</p>
															<p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{alum.company} • {alum.role}</p>
														</div>
													</div>
												))}
											</div>
										</div>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}
