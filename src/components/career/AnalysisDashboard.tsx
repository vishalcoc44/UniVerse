
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Zap, AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function AnalysisDashboard() {
	const [resume, setResume] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
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

		fetchLatestResume();
	}, []);

	if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>;
	if (!resume) return <div className="text-center text-muted-foreground p-8">Upload a resume to see AI analysis.</div>;

	const feedback = resume.feedback || { quickFixes: [], keywords: { found: [], missing: [] } };
	const score = resume.score || 0;

	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

			{/* Top Scores */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card className="p-6 md:col-span-1 bg-gradient-to-br from-card to-secondary/5 border-border/50 flex flex-col items-center justify-center text-center">
					<div className="relative w-32 h-32 mb-4 flex items-center justify-center">
						<svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
							<circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
							<circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * score) / 100} className="text-amber-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
						</svg>
						<div className="absolute inset-0 flex flex-col items-center justify-center">
							<span className="text-4xl font-bold tracking-tighter text-foreground">{score}</span>
							<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Score</span>
						</div>
					</div>
					<h3 className="font-semibold text-lg mb-1">{score > 80 ? "Strong" : score > 50 ? "Average" : "Weak"} Resume</h3>
					<p className="text-xs text-muted-foreground max-w-[200px]">
						{score > 80 ? "Top 15% of candidates." : "Needs improvement to stand out."}
					</p>
				</Card>

				<Card className="p-6 md:col-span-2 border-border/50 bg-card/60">
					<h3 className="font-semibold mb-4 flex items-center gap-2">
						<Zap className="h-4 w-4 text-amber-500 fill-current" />
						Quick Fixes
					</h3>
					<div className="space-y-4">
						{feedback.quickFixes?.map((fix: any, i: number) => (
							<div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${fix.type === 'critical' ? 'bg-red-500/5 border-red-500/10' : 'bg-amber-500/5 border-amber-500/10'}`}>
								{fix.type === 'critical' ? <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />}
								<div className="flex-1">
									<p className="text-sm font-medium text-foreground">{fix.title}</p>
									<p className="text-xs text-muted-foreground mt-0.5">{fix.description}</p>
								</div>
							</div>
						))}
						{(!feedback.quickFixes || feedback.quickFixes.length === 0) && (
							<p className="text-sm text-muted-foreground">No critical issues found. Great job!</p>
						)}
					</div>
				</Card>
			</div>

			{/* Detailed Feedback Tabs */}
			<Tabs defaultValue="keywords" className="w-full">
				<TabsList className="grid w-full grid-cols-3 bg-muted/30">
					<TabsTrigger value="keywords">Keywords</TabsTrigger>
					<TabsTrigger value="impact">Impact</TabsTrigger>
					<TabsTrigger value="analysis">Detail</TabsTrigger>
				</TabsList>
				<div className="mt-4">
					<Card className="p-5 border-border/50 min-h-[200px]">
						<TabsContent value="keywords" className="mt-0">
							<p className="text-sm text-muted-foreground mb-4">Keywords detected for <strong>Technology</strong> role:</p>
							<div className="flex flex-wrap gap-2">
								{feedback.keywords?.found?.map((k: string) => (
									<Badge key={k} variant="outline" className="bg-green-500/10 text-green-700 border-green-200">{k}</Badge>
								))}
								{feedback.keywords?.missing?.map((k: string) => (
									<Badge key={k} variant="outline" className="bg-red-500/10 text-red-700 border-red-200">{k} (Missing)</Badge>
								))}
							</div>
						</TabsContent>
						<TabsContent value="impact" className="mt-0 space-y-4">
							<div className="flex justify-between items-center mb-2">
								<h4 className="font-medium">Impact Score</h4>
								<span className="text-sm text-green-600 font-medium">{score}/100</span>
							</div>
							<Progress value={score} className="h-2 bg-muted text-green-500" />
							<p className="text-sm text-muted-foreground pt-2">
								Based on quantification of results and action verbs.
							</p>
						</TabsContent>
						<TabsContent value="analysis" className="mt-0">
							<p className="text-center text-muted-foreground py-8">Full AI analysis text would appear here.</p>
						</TabsContent>
					</Card>
				</div>
			</Tabs>
		</div>
	);
}
