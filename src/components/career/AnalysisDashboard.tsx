'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
CheckCircle2, 
XCircle, 
Zap, 
AlertCircle, 
Loader2, 
Target, 
Sparkles, 
TrendingUp, 
ShieldCheck, 
Search,
ArrowUpRight,
History
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function AnalysisDashboard() {
const [resume, setResume] = useState<any>(null);
const [loading, setLoading] = useState(true);
const [activeTab, setActiveTab] = useState("overview");

const fetchLatestResume = async () => {
setLoading(true);
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
setLoading(false);
return;
}

const { data, error } = await supabase
.from('Resume')
.select('*')
.eq('userId', user.id)
.order('createdAt', { ascending: false })
.limit(1);

if (!error && data && data.length > 0) {
setResume(data[0]);
}
setLoading(false);
};

useEffect(() => {
fetchLatestResume();
}, []);

if (loading) return (
<div className="flex flex-col items-center justify-center p-20 space-y-4 bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem]">
<div className="relative">
<Loader2 className="h-10 w-10 animate-spin text-primary" />
<div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
</div>
<p className="text-xs font-black italic uppercase tracking-widest text-muted-foreground">Synthesizing Report...</p>
</div>
);

if (!resume) return (
<div className="flex flex-col items-center justify-center p-16 text-center space-y-6 bg-card/40 backdrop-blur-xl border border-border/50 rounded-[2.5rem]">
<div className="p-4 rounded-3xl bg-muted/50 text-muted-foreground">
<History className="h-8 w-8" />
</div>
<div className="space-y-2">
<h3 className="font-black text-xl italic tracking-tight uppercase">No Analysis Found</h3>
<p className="text-sm text-muted-foreground italic leading-relaxed max-w-[240px] mx-auto">
Upload your latest resume to generate an AI-powered professional report.
</p>
</div>
<Button variant="outline" onClick={fetchLatestResume} className="h-10 rounded-xl font-bold italic tracking-tight">
Check Again
</Button>
</div>
);

const feedback = resume.feedback || { quickFixes: [], keywords: { found: [], missing: [] } };
const score = resume.score || 0;
const summary = typeof feedback.summary === 'string' ? feedback.summary : '';

const getScoreColor = (s: number) => {
if (s >= 80) return "text-green-500";
if (s >= 60) return "text-amber-500";
return "text-rose-500";
};

const getScoreLabel = (s: number) => {
if (s >= 80) return "Elite";
if (s >= 60) return "Competitive";
return "Needs Review";
};

return (
<div className="space-y-6">
{/* Hero Score Card */}
<Card className="bg-card/40 backdrop-blur-xl border-border/50 rounded-[2.5rem] overflow-hidden group shadow-2xl shadow-primary/5">
<CardContent className="p-8">
<div className="flex flex-col items-center text-center space-y-6">
<div className="relative w-40 h-40 flex items-center justify-center">
<svg className="w-full h-full -rotate-90 drop-shadow-2xl" viewBox="0 0 100 100">
<circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/10" />
<motion.circle 
cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="8" 
strokeDasharray="276.5" 
initial={{ strokeDashoffset: 276.5 }}
animate={{ strokeDashoffset: 276.5 - (276.5 * score) / 100 }}
transition={{ duration: 1.5, ease: "easeOut" }}
className={cn("transition-all duration-1000 ease-out", getScoreColor(score))} 
strokeLinecap="round" 
/>
</svg>
<div className="absolute inset-0 flex flex-col items-center justify-center">
<motion.span 
initial={{ opacity: 0, scale: 0.5 }}
animate={{ opacity: 1, scale: 1 }}
className="text-5xl font-black tracking-tighter italic"
>
{score}
</motion.span>
<span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">ATS Score</span>
</div>
</div>

<div className="space-y-2">
<div className="flex items-center justify-center gap-2">
<Badge className={cn("rounded-lg px-3 py-1 font-black italic tracking-widest text-[10px] uppercase border-none", 
score >= 80 ? "bg-green-500/10 text-green-500" : 
score >= 60 ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"
)}>
{getScoreLabel(score)}
</Badge>
<Badge variant="outline" className="rounded-lg px-3 py-1 font-black italic tracking-widest text-[10px] uppercase border-border/50 text-muted-foreground/60">
V1.2 Engine
</Badge>
</div>
<p className="text-sm font-bold italic tracking-tight text-foreground/80 leading-relaxed px-4">
{score >= 80 
? "Your resume is in the top 5% of candidates for Technology roles." 
: "Small adjustments could significantly boost your recruiter visibility."}
</p>
</div>
</div>
</CardContent>
</Card>

{/* Navigation Tabs */}
<div className="flex gap-2 p-1.5 bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl overflow-x-auto no-scrollbar">
{[
{ id: 'overview', label: 'Summary', icon: Target },
{ id: 'fixes', label: 'Quick Fixes', icon: Zap },
{ id: 'keywords', label: 'Keywords', icon: Search }
].map((tab) => (
<button
key={tab.id}
onClick={() => setActiveTab(tab.id)}
className={cn(
"flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 min-w-fit",
activeTab === tab.id 
? "bg-primary text-white shadow-lg shadow-primary/20" 
: "text-muted-foreground hover:bg-primary/5 hover:text-primary"
)}
>
<tab.icon className="h-4 w-4" />
<span className="text-xs font-black italic tracking-tight uppercase whitespace-nowrap">{tab.label}</span>
</button>
))}
</div>

{/* Tab Content */}
<AnimatePresence mode="wait">
<motion.div
key={activeTab}
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -10 }}
className="space-y-4"
>
{activeTab === 'overview' && (
<div className="grid gap-4">
<Card className="bg-card/40 border-border/30 rounded-3xl overflow-hidden p-6 hover:shadow-xl hover:shadow-primary/5 transition-all">
<div className="flex items-center gap-3 mb-4">
<div className="p-2 rounded-xl bg-violet-500/10 text-violet-500">
<TrendingUp className="h-4 w-4" />
</div>
<h4 className="font-black text-sm italic tracking-tight uppercase">Professional Impact</h4>
</div>
<p className="text-xs font-medium text-muted-foreground leading-relaxed italic">
{summary || "Our AI engine is processing the deep structure of your resume. This section highlights how your experiences bridge current market gaps."}
</p>
</Card>
</div>
)}

{activeTab === 'fixes' && (
<div className="space-y-3">
{feedback.quickFixes?.length > 0 ? (
feedback.quickFixes.map((fix: any, i: number) => (
<div key={i} className="group relative">
<div className={cn(
"absolute -inset-0.5 rounded-[1.5rem] blur opacity-0 group-hover:opacity-20 transition duration-500",
fix.type === 'critical' ? 'bg-rose-500' : 'bg-amber-500'
)} />
<div className="relative flex items-start gap-4 p-4 rounded-2xl bg-card/60 border border-border/30 group-hover:border-primary/20 transition-all">
<div className={cn(
"shrink-0 w-8 h-8 rounded-xl flex items-center justify-center",
fix.type === 'critical' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
)}>
{fix.type === 'critical' ? <XCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
</div>
<div className="min-w-0">
<p className="text-xs font-black italic text-foreground tracking-tight leading-none mb-1">{fix.title}</p>
<p className="text-[10px] text-muted-foreground leading-relaxed italic">{fix.description}</p>
</div>
</div>
</div>
))
) : (
<div className="p-8 rounded-[2rem] bg-green-500/5 border border-green-500/10 text-center">
<CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-3" />
<p className="text-xs font-black italic text-green-600 uppercase tracking-widest">No Critical Issues</p>
<p className="text-[10px] text-muted-foreground italic mt-1">Your document structure is perfectly optimized.</p>
</div>
)}
</div>
)}

{activeTab === 'keywords' && (
<div className="space-y-6 bg-card/40 border border-border/30 rounded-[2rem] p-6">
<div>
<h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500 mb-4 px-1">Detected Expertise</h4>
<div className="flex flex-wrap gap-2">
{feedback.keywords?.found?.length > 0 ? feedback.keywords.found.map((k: string) => (
<Badge key={k} variant="outline" className="rounded-xl px-4 py-1.5 bg-green-500/5 text-green-600 border-green-500/20 font-bold italic text-[11px] tracking-tight">
{k}
</Badge>
)) : (
<p className="text-[10px] italic text-muted-foreground px-2">No specific keywords identified.</p>
)}
</div>
</div>

<div>
<div className="flex items-center justify-between mb-4 px-1">
<h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Market Missing</h4>
<div className="flex items-center gap-1.5 p-1 rounded-lg bg-rose-500/5 border border-rose-500/10">
<ArrowUpRight className="h-3 w-3 text-rose-500" />
<span className="text-[9px] font-bold text-rose-600">Urgent</span>
</div>
</div>
<div className="flex flex-wrap gap-2">
{feedback.keywords?.missing?.length > 0 ? feedback.keywords.missing.map((k: string) => (
<Badge key={k} variant="outline" className="rounded-xl px-4 py-1.5 bg-rose-500/5 text-rose-600 border-rose-500/20 font-bold italic text-[11px] tracking-tight">
{k}
</Badge>
)) : (
<p className="text-[10px] italic text-muted-foreground px-2">Your skill profile perfectly matches the role.</p>
)}
</div>
</div>
</div>
)}
</motion.div>
</AnimatePresence>

{/* Bottom Tip */}
<div className="p-4 rounded-3xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 flex items-center gap-4 group">
<div className="h-10 w-10 shrink-0 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
<Sparkles className="h-5 w-5" />
</div>
<div className="min-w-0">
<p className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">AI Insights V2</p>
<p className="text-xs font-bold italic tracking-tight text-foreground/70 leading-relaxed truncate">
Add more "Action Verbs" like <span className="text-primary italic">"Spearheaded"</span> or <span className="text-primary italic">"Orchestrated"</span>.
</p>
</div>
</div>
</div>
);
}
