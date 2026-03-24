'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ResumeUploader } from "@/components/career/ResumeUploader";
import { AnalysisDashboard } from "@/components/career/AnalysisDashboard";
import { MockInterviewerAI } from "@/components/career/tools/MockInterviewerAI";
import { AlumniDirectory } from "@/components/career/mentorship/AlumniDirectory";
import { JobBoard } from "@/components/career/jobs/JobBoard";
import { ApplicationTracker } from "@/components/career/applications/ApplicationTracker";
import { CompanyCard } from "@/components/career/companies/CompanyCard";
import { SkillGapAnalysis } from "@/components/career/tools/SkillGapAnalysis";
import { ResumeHistory } from "@/components/career/tools/ResumeHistory";
import { CareerEvents } from "@/components/career/events/CareerEvents";
import { InterviewQuestionBank } from "@/components/career/tools/InterviewQuestionBank";
import { SalaryInsights } from "@/components/career/salary/SalaryInsights";
import { Achievements } from "@/components/career/achievements/Achievements";
import { EmployerPortal } from "@/components/career/employer/EmployerPortal";
import { CareerProfile } from "@/components/career/profile/CareerProfile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	FileText,
	Users,
	Mic,
	Sparkles,
	Briefcase,
	TrendingUp,
	Search,
	ChevronRight,
	Target,
	Award,
	Kanban,
	Building2,
	Calendar,
	BookOpen,
	DollarSign,
	Trophy,
	UserCircle,
	LayoutGrid,
	Loader2,
	Plus,
	X,
	Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface Company {
	id: string;
	name: string;
	logoUrl?: string;
	industry?: string;
	location?: string;
	size?: string;
	description?: string;
	website?: string;
	verified: boolean;
	headquarters?: string;
}

const NAV_ITEMS = [
	{ id: "jobs",        label: "Job Board",       icon: Briefcase,   color: "primary"  },
	{ id: "tracker",     label: "Applications",     icon: Kanban,      color: "violet"   },
	{ id: "companies",   label: "Companies",        icon: Building2,   color: "blue"     },
	{ id: "resume",      label: "Resume AI",        icon: FileText,    color: "green"    },
	{ id: "interview",   label: "Mock Interview",   icon: Mic,         color: "purple"   },
	{ id: "questions",   label: "Question Bank",    icon: BookOpen,    color: "amber"    },
	{ id: "network",     label: "Alumni Network",   icon: Users,       color: "orange"   },
	{ id: "events",      label: "Career Events",    icon: Calendar,    color: "pink"     },
	{ id: "salary",      label: "Salary Insights",  icon: DollarSign,  color: "teal"     },
	{ id: "profile",     label: "Career Profile",   icon: UserCircle,  color: "indigo"   },
	{ id: "achieve",     label: "Achievements",     icon: Trophy,      color: "yellow"   },
	{ id: "employer",    label: "Employer Portal",  icon: LayoutGrid,  color: "red"      },
] as const;

type TabId = typeof NAV_ITEMS[number]["id"];

const LINKED_FLOWS: Record<TabId, { to: TabId; label: string }[]> = {
	jobs: [
		{ to: "tracker", label: "Track applied jobs" },
		{ to: "companies", label: "Explore companies" },
	],
	tracker: [
		{ to: "resume", label: "Tune resume for pipeline" },
		{ to: "events", label: "Find hiring events" },
	],
	companies: [
		{ to: "jobs", label: "See open roles" },
		{ to: "employer", label: "Post as employer" },
	],
	resume: [
		{ to: "questions", label: "Prepare interview answers" },
		{ to: "tracker", label: "Apply and track" },
	],
	interview: [
		{ to: "questions", label: "Practice question bank" },
		{ to: "tracker", label: "Track interview stages" },
	],
	questions: [
		{ to: "interview", label: "Run mock interview" },
		{ to: "tracker", label: "Update outcomes" },
	],
	network: [
		{ to: "events", label: "Join networking events" },
		{ to: "jobs", label: "Find referrals" },
	],
	events: [
		{ to: "network", label: "Connect with alumni" },
		{ to: "jobs", label: "Apply after event" },
	],
	salary: [
		{ to: "profile", label: "Update compensation target" },
		{ to: "jobs", label: "Filter by pay" },
	],
	profile: [
		{ to: "jobs", label: "Get matched jobs" },
		{ to: "salary", label: "Compare market pay" },
	],
	achieve: [
		{ to: "tracker", label: "Complete milestones" },
		{ to: "interview", label: "Boost score" },
	],
	employer: [
		{ to: "companies", label: "Manage company profile" },
		{ to: "events", label: "Host career event" },
	],
};

const COLOR_ACTIVE: Record<string, string> = {
	primary: "bg-primary text-white shadow-primary/20",
	violet:  "bg-violet-500 text-white shadow-violet-500/20",
	blue:    "bg-blue-500 text-white shadow-blue-500/20",
	green:   "bg-green-600 text-white shadow-green-600/20",
	purple:  "bg-purple-500 text-white shadow-purple-500/20",
	amber:   "bg-amber-500 text-white shadow-amber-500/20",
	orange:  "bg-orange-500 text-white shadow-orange-500/20",
	pink:    "bg-pink-500 text-white shadow-pink-500/20",
	teal:    "bg-teal-500 text-white shadow-teal-500/20",
	indigo:  "bg-indigo-500 text-white shadow-indigo-500/20",
	yellow:  "bg-yellow-500 text-white shadow-yellow-500/20",
	red:     "bg-red-500 text-white shadow-red-500/20",
};

const COLOR_HOVER: Record<string, string> = {
	primary: "hover:bg-primary/5 hover:text-primary",
	violet:  "hover:bg-violet-500/5 hover:text-violet-500",
	blue:    "hover:bg-blue-500/5 hover:text-blue-500",
	green:   "hover:bg-green-600/5 hover:text-green-500",
	purple:  "hover:bg-purple-500/5 hover:text-purple-500",
	amber:   "hover:bg-amber-500/5 hover:text-amber-500",
	orange:  "hover:bg-orange-500/5 hover:text-orange-500",
	pink:    "hover:bg-pink-500/5 hover:text-pink-500",
	teal:    "hover:bg-teal-500/5 hover:text-teal-500",
	indigo:  "hover:bg-indigo-500/5 hover:text-indigo-500",
	yellow:  "hover:bg-yellow-500/5 hover:text-yellow-500",
	red:     "hover:bg-red-500/5 hover:text-red-500",
};

export default function Career() {
	const [refreshKey, setRefreshKey] = useState(0);
	const [activeTab, setActiveTab] = useState<TabId>("jobs");
	const [companies, setCompanies] = useState<Company[]>([]);
	const [companiesLoaded, setCompaniesLoaded] = useState(false);
	const [achieveCount, setAchieveCount] = useState(0);
	const [isAdmin, setIsAdmin] = useState(false);
	const [showCompanyForm, setShowCompanyForm] = useState(false);
	const [addingCompany, setAddingCompany] = useState(false);
	const [companyForm, setCompanyForm] = useState({
		name: '', industry: '', description: '', website: '',
		headquarters: '', size: 'STARTUP', logoUrl: '',
	});

	const submitCompany = async () => {
		if (!companyForm.name) return;
		setAddingCompany(true);
		const { error } = await supabase.from('Company').insert({
			name: companyForm.name,
			industry: companyForm.industry || null,
			description: companyForm.description || null,
			website: companyForm.website || null,
			headquarters: companyForm.headquarters || null,
			size: companyForm.size || 'STARTUP',
			logoUrl: companyForm.logoUrl || null,
			verified: true,
		});
		if (error) {
			alert(error.message);
			setAddingCompany(false);
			return;
		}
		setCompanyForm({ name: '', industry: '', description: '', website: '', headquarters: '', size: 'STARTUP', logoUrl: '' });
		setShowCompanyForm(false);
		// Reload companies
		const { data } = await supabase.from('Company').select('id, name, logoUrl, industry, size, description, website, verified, headquarters').order('name').limit(30);
		setCompanies((data as Company[]) ?? []);
		setAddingCompany(false);
	};

	const deleteCompany = async (id: string) => {
		if (!confirm('Delete this company and all its jobs/reviews?')) return;
		await supabase.from('Company').delete().eq('id', id);
		setCompanies(prev => prev.filter(c => c.id !== id));
	};

	useEffect(() => {
		(async () => {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;
			const [{ count }, { data: profile }] = await Promise.all([
				supabase.from('CareerAchievement').select('id', { count: 'exact', head: true }).eq('userId', user.id),
				supabase.from('Profile').select('role').eq('id', user.id).single(),
			]);
			setAchieveCount(count ?? 0);
			setIsAdmin(profile?.role === 'ADMIN');
		})();
	}, []);

	useEffect(() => {
		if (activeTab === "companies" && !companiesLoaded) {
			(async () => {
				const { data } = await supabase.from('Company').select('id, name, logoUrl, industry, size, description, website, verified, headquarters').order('name').limit(30);
				setCompanies((data as Company[]) ?? []);
				setCompaniesLoaded(true);
			})();
		}
	}, [activeTab, companiesLoaded]);

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
					{/* Left Sidebar */}
					<div className="w-full lg:w-[260px] shrink-0 space-y-4">
						<div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-5 sticky top-6">
							<p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-3 px-2">Navigation</p>
							<div className="space-y-1">
								{NAV_ITEMS.map(item => (
									<button
										key={item.id}
										onClick={() => setActiveTab(item.id)}
										className={cn(
											"w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all duration-300 group text-left",
											activeTab === item.id
												? `${COLOR_ACTIVE[item.color]} shadow-lg scale-[1.02]`
												: `text-muted-foreground ${COLOR_HOVER[item.color]}`
										)}
									>
										<item.icon className={cn("h-4 w-4 shrink-0 transition-transform duration-500", activeTab === item.id ? "scale-110" : "group-hover:scale-110")} />
										<span className="font-bold tracking-tight italic text-sm">{item.label}</span>
										{item.id === "achieve" && achieveCount > 0 && (
											<span className="ml-auto text-[8px] font-black bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full">
												{achieveCount}
											</span>
										)}
									</button>
								))}
							</div>

							<div className="mt-6 pt-5 border-t border-border/10 space-y-4">
								<div>
									<h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-3 px-1">Market Pulse</h4>
									<div className="space-y-2">
										{[
											{ label: "Tech Hiring", trend: "+12%", color: "text-green-500" },
											{ label: "Internships", trend: "+8%",  color: "text-blue-500" },
											{ label: "AI Roles",    trend: "+24%", color: "text-violet-500" },
										].map(insight => (
											<div key={insight.label} className="flex items-center justify-between px-1">
												<span className="text-xs font-bold text-muted-foreground">{insight.label}</span>
												<span className={cn("text-[10px] font-black italic", insight.color)}>{insight.trend}</span>
											</div>
										))}
									</div>
								</div>

								<div className="bg-gradient-to-br from-primary/10 to-transparent rounded-2xl p-4 border border-primary/5">
									<Target className="h-5 w-5 text-primary mb-2" />
									<p className="text-[10px] font-bold italic tracking-tight leading-relaxed">
										Next: <span className="text-primary block">Land your first interview</span>
									</p>
									<div className="mt-2 h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
										<div className="h-full w-[45%] bg-primary rounded-full" />
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Main Content */}
					<div className="flex-1 min-w-0">
						<div className="mb-4 flex flex-wrap items-center gap-2">
							<p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground/60 mr-1">Linked Flow</p>
							{(LINKED_FLOWS[activeTab] ?? []).map(flow => {
								const target = NAV_ITEMS.find(i => i.id === flow.to);
								if (!target) return null;
								return (
									<button
										key={`${activeTab}-${flow.to}`}
										onClick={() => setActiveTab(flow.to)}
										className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/40 bg-card/30 text-[10px] font-black tracking-wide text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
									>
										{flow.label}
										<ChevronRight className="h-3 w-3" />
									</button>
								);
							})}
						</div>
						<AnimatePresence mode="wait">

							{/* â”€â”€ Jobs â”€â”€ */}
							{activeTab === "jobs" && (
								<motion.div key="jobs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
									<JobBoard />
								</motion.div>
							)}

							{/* â”€â”€ Tracker â”€â”€ */}
							{activeTab === "tracker" && (
								<motion.div key="tracker" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
									<ApplicationTracker />
								</motion.div>
							)}

							{/* â”€â”€ Companies â”€â”€ */}
								{activeTab === "companies" && (
								<motion.div key="companies" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<h2 className="font-black text-xl italic tracking-tight">Company Profiles</h2>
											<Badge variant="outline" className="text-[9px] font-black">{companies.length} companies</Badge>
										</div>
										{isAdmin && (
											<Button size="sm" className="h-8 text-[11px] font-black rounded-xl gap-1" onClick={() => setShowCompanyForm(s => !s)}>
												{showCompanyForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
												{showCompanyForm ? 'Cancel' : 'Add Company'}
											</Button>
										)}
									</div>

									<AnimatePresence>
										{showCompanyForm && isAdmin && (
											<motion.div
												initial={{ opacity: 0, height: 0 }}
												animate={{ opacity: 1, height: 'auto' }}
												exit={{ opacity: 0, height: 0 }}
												className="overflow-hidden"
											>
												<div className="bg-card/30 border border-blue-500/30 rounded-2xl p-4 space-y-3">
													<p className="text-[10px] font-black uppercase tracking-widest text-blue-400">New Company</p>
												<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
													<input placeholder="Company name *" value={companyForm.name} onChange={e => setCompanyForm(p => ({ ...p, name: e.target.value }))}
														className="sm:col-span-2 h-9 bg-card/40 border border-border/40 rounded-xl px-3 text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none focus:border-blue-500/50" />
													<input placeholder="Industry" value={companyForm.industry} onChange={e => setCompanyForm(p => ({ ...p, industry: e.target.value }))}
														className="h-9 bg-card/40 border border-border/40 rounded-xl px-3 text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none focus:border-blue-500/50" />
													<input placeholder="Headquarters (city)" value={companyForm.headquarters} onChange={e => setCompanyForm(p => ({ ...p, headquarters: e.target.value }))}
														className="h-9 bg-card/40 border border-border/40 rounded-xl px-3 text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none focus:border-blue-500/50" />
													<input placeholder="Website URL" value={companyForm.website} onChange={e => setCompanyForm(p => ({ ...p, website: e.target.value }))}
														className="h-9 bg-card/40 border border-border/40 rounded-xl px-3 text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none focus:border-blue-500/50" />
													<input placeholder="Logo URL" value={companyForm.logoUrl} onChange={e => setCompanyForm(p => ({ ...p, logoUrl: e.target.value }))}
														className="h-9 bg-card/40 border border-border/40 rounded-xl px-3 text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none focus:border-blue-500/50" />
													<select value={companyForm.size} onChange={e => setCompanyForm(p => ({ ...p, size: e.target.value }))}
														className="h-9 bg-card/40 border border-border/40 rounded-xl px-3 text-xs text-foreground">
														{['STARTUP', 'SME', 'ENTERPRISE'].map(s => <option key={s} value={s}>{s}</option>)}
													</select>
													<textarea placeholder="Description" value={companyForm.description} onChange={e => setCompanyForm(p => ({ ...p, description: e.target.value }))}
														rows={2} className="sm:col-span-2 bg-card/40 border border-border/40 rounded-xl px-3 py-2 text-xs resize-none text-foreground placeholder:text-muted-foreground outline-none focus:border-blue-500/50" />
												</div>
													<Button size="sm" className="h-8 text-[11px] font-black rounded-xl w-full" onClick={submitCompany} disabled={addingCompany || !companyForm.name}>
														{addingCompany ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Company'}
													</Button>
												</div>
											</motion.div>
										)}
									</AnimatePresence>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{companies.map(c => (
											<div key={c.id} className="relative group/card">
												<CompanyCard company={c} />
												{isAdmin && (
													<button
														onClick={() => deleteCompany(c.id)}
														className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/40 backdrop-blur-sm text-muted-foreground hover:bg-red-500/20 hover:text-red-400 transition-all opacity-0 group-hover/card:opacity-100 z-10"
													>
														<Trash2 className="h-3.5 w-3.5" />
													</button>
												)}
											</div>
										))}
										{companies.length === 0 && (
											<div className="col-span-2 text-center py-10 text-muted-foreground">
												<Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
												<p className="text-sm font-bold">{isAdmin ? 'No companies yet. Add the first one above.' : 'No companies yet.'}</p>
											</div>
										)}
									</div>
								</motion.div>
							)}

							{/* â”€â”€ Resume â”€â”€ */}
							{activeTab === "resume" && (
								<motion.div key="resume" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
									<div className="grid grid-cols-1 xl:grid-cols-[1fr_minmax(0,400px)] gap-8">
										<div className="space-y-8">
											<div className="relative group">
												<div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-violet-500/20 to-primary/20 rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000" />
												<ResumeUploader onUploadComplete={() => setRefreshKey(p => p + 1)} />
											</div>
											<div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-6">
												<div className="flex items-center gap-3 mb-4">
													<div className="p-2 rounded-2xl bg-primary/10 text-primary"><Sparkles className="h-4 w-4" /></div>
													<h3 className="font-black text-lg italic tracking-tight uppercase">Trending Keywords</h3>
													<Badge variant="outline" className="border-green-500/20 text-green-500 bg-green-500/5 font-black text-[9px] ml-auto">Live</Badge>
												</div>
												<div className="flex flex-wrap gap-2">
													{["React Native", "PostgreSQL", "Next.js 15", "System Design", "AWS Lambda", "TensorFlow", "Kubernetes", "GraphQL"].map((skill, idx) => (
														<span key={skill} className={cn("px-4 py-2 rounded-xl text-xs font-black italic tracking-tight border border-border/30", idx < 3 ? "bg-primary text-white border-transparent" : "bg-card/60 text-muted-foreground")}>
															{skill}
														</span>
													))}
												</div>
											</div>
											<div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-6">
												<div className="flex items-center gap-3 mb-4">
													<FileText className="h-5 w-5 text-primary" />
													<h3 className="font-black text-lg italic tracking-tight uppercase">Resume History</h3>
												</div>
												<ResumeHistory />
											</div>
										</div>
										<div className="space-y-6">
											<div className="flex items-center gap-3 mb-2 px-2">
												<TrendingUp className="h-5 w-5 text-primary" />
												<h3 className="font-black text-lg italic tracking-tight uppercase">ATS Analysis</h3>
											</div>
											<AnalysisDashboard key={refreshKey} />
										</div>
									</div>
								</motion.div>
							)}

							{/* â”€â”€ Interview â”€â”€ */}
							{activeTab === "interview" && (
								<motion.div key="interview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
									<div className="xl:col-span-2">
										<MockInterviewerAI />
									</div>
									<div className="space-y-6">
										<div className="bg-gradient-to-br from-violet-500/10 via-card/40 to-card/40 backdrop-blur-xl border border-violet-500/20 rounded-[2.5rem] p-6">
											<div className="flex items-center gap-3 mb-5">
												<div className="p-2 rounded-2xl bg-violet-500/10 text-violet-500"><Award className="h-4 w-4" /></div>
												<h4 className="font-black text-base italic tracking-tight uppercase">Prep Guide</h4>
											</div>
											<ul className="space-y-4">
												{[
													{ title: "Eye Contact", desc: "Keep your gaze at the camera.", icon: Search },
													{ title: "STAR Method", desc: "Situation, Task, Action, Result.", icon: Target },
													{ title: "Pace", desc: "Avoid filler words, speak steadily.", icon: Mic },
												].map((tip, idx) => (
													<li key={idx} className="flex gap-3 group">
														<div className="shrink-0 w-7 h-7 rounded-xl bg-card border border-border/50 flex items-center justify-center text-violet-500 group-hover:scale-110 transition-transform">
															<tip.icon className="h-3.5 w-3.5" />
														</div>
														<div>
															<p className="text-xs font-black italic">{tip.title}</p>
															<p className="text-[10px] text-muted-foreground mt-0.5">{tip.desc}</p>
														</div>
													</li>
												))}
											</ul>
										</div>
									</div>
								</motion.div>
							)}

							{/* â”€â”€ Question Bank â”€â”€ */}
							{activeTab === "questions" && (
								<motion.div key="questions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
									<div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-6">
										<div className="flex items-center gap-3 mb-5">
											<div className="p-2 rounded-2xl bg-amber-500/10 text-amber-500"><BookOpen className="h-5 w-5" /></div>
											<h2 className="font-black text-xl italic tracking-tight">Interview Question Bank</h2>
										</div>
										<InterviewQuestionBank />
									</div>
								</motion.div>
							)}

							{/* â”€â”€ Network â”€â”€ */}
							{activeTab === "network" && (
								<motion.div key="network" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
									<AlumniDirectory />
								</motion.div>
							)}

							{/* â”€â”€ Events â”€â”€ */}
							{activeTab === "events" && (
								<motion.div key="events" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
									<div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-6">
										<div className="flex items-center gap-3 mb-5">
											<div className="p-2 rounded-2xl bg-pink-500/10 text-pink-500"><Calendar className="h-5 w-5" /></div>
											<h2 className="font-black text-xl italic tracking-tight">Career Events</h2>
										</div>
										<CareerEvents />
									</div>
								</motion.div>
							)}

							{/* â”€â”€ Salary â”€â”€ */}
							{activeTab === "salary" && (
								<motion.div key="salary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
									<div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-6">
										<SalaryInsights />
									</div>
								</motion.div>
							)}

							{/* â”€â”€ Profile â”€â”€ */}
							{activeTab === "profile" && (
								<motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
									<div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
										<div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-6">
											<div className="flex items-center gap-3 mb-5">
												<div className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-500"><UserCircle className="h-5 w-5" /></div>
												<h2 className="font-black text-xl italic tracking-tight">Career Profile</h2>
											</div>
											<CareerProfile />
										</div>
										<div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-6">
											<div className="flex items-center gap-3 mb-5">
												<div className="p-2 rounded-2xl bg-primary/10 text-primary"><TrendingUp className="h-5 w-5" /></div>
												<h2 className="font-black text-base italic tracking-tight">Skill Gap Analysis</h2>
											</div>
											<SkillGapAnalysis />
										</div>
									</div>
								</motion.div>
							)}

							{/* â”€â”€ Achievements â”€â”€ */}
							{activeTab === "achieve" && (
								<motion.div key="achieve" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
									<div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-6">
										<Achievements />
									</div>
								</motion.div>
							)}

							{/* â”€â”€ Employer Portal â”€â”€ */}
							{activeTab === "employer" && (
								<motion.div key="employer" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
									<div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-6">
										<EmployerPortal />
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
