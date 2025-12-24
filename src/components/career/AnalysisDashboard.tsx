import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, CheckCircle2, XCircle, Zap, AlertCircle } from "lucide-react";

export function AnalysisDashboard() {
	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

			{/* Top Scores */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card className="p-6 md:col-span-1 bg-gradient-to-br from-card to-secondary/5 border-border/50 flex flex-col items-center justify-center text-center">
					<div className="relative w-32 h-32 mb-4 flex items-center justify-center">
						<svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
							<circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
							<circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="283" strokeDashoffset="42" className="text-amber-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
						</svg>
						<div className="absolute inset-0 flex flex-col items-center justify-center">
							<span className="text-4xl font-bold tracking-tighter text-foreground">85</span>
							<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Score</span>
						</div>
					</div>
					<h3 className="font-semibold text-lg mb-1">Strong Resume</h3>
					<p className="text-xs text-muted-foreground max-w-[200px]">Top 15% of candidates. Good use of action verbs.</p>
				</Card>

				<Card className="p-6 md:col-span-2 border-border/50 bg-card/60">
					<h3 className="font-semibold mb-4 flex items-center gap-2">
						<Zap className="h-4 w-4 text-amber-500 fill-current" />
						Quick Fixes
					</h3>
					<div className="space-y-4">
						<div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
							<XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
							<div className="flex-1">
								<p className="text-sm font-medium text-foreground">Missing Contact Info</p>
								<p className="text-xs text-muted-foreground mt-0.5">Your LinkedIn profile URL was not found. 87% of recruiters check it.</p>
							</div>
							<Button size="sm" variant="outline" className="text-xs h-7">Fix</Button>
						</div>
						<div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
							<AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
							<div className="flex-1">
								<p className="text-sm font-medium text-foreground">Weak Bullet Points</p>
								<p className="text-xs text-muted-foreground mt-0.5">3 bullet points lack quantifiable metrics (e.g., "Increased sales by 20%").</p>
							</div>
							<Button size="sm" variant="outline" className="text-xs h-7">Rewrite</Button>
						</div>
					</div>
				</Card>
			</div>

			{/* Detailed Feedback Tabs */}
			<Tabs defaultValue="impact" className="w-full">
				<TabsList className="grid w-full grid-cols-4 bg-muted/30">
					<TabsTrigger value="impact">Impact</TabsTrigger>
					<TabsTrigger value="keywords">Keywords</TabsTrigger>
					<TabsTrigger value="formatting">Style</TabsTrigger>
					<TabsTrigger value="ats">ATS Check</TabsTrigger>
				</TabsList>
				<div className="mt-4">
					<Card className="p-5 border-border/50 min-h-[200px]">
						<TabsContent value="impact" className="mt-0 space-y-4">
							<div className="flex justify-between items-center mb-2">
								<h4 className="font-medium">Action Verb Usage</h4>
								<span className="text-sm text-green-600 font-medium">9/10</span>
							</div>
							<Progress value={90} className="h-2 bg-muted text-green-500" />
							<p className="text-sm text-muted-foreground pt-2">
								Great job using strong verbs like "Spearheaded", "Developed", and "Optimized". Avoid passive voice in the "Experience" section.
							</p>
						</TabsContent>
						<TabsContent value="keywords" className="mt-0">
							<p className="text-sm text-muted-foreground mb-4">Keywords detected for <strong>Software Engineer</strong> role:</p>
							<div className="flex flex-wrap gap-2">
								<Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">TypeScript</Badge>
								<Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">React</Badge>
								<Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">Node.js</Badge>
								<Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-200">Docker (Missing)</Badge>
								<Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-200">AWS (Missing)</Badge>
								<Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">System Design</Badge>
							</div>
						</TabsContent>
						<TabsContent value="formatting" className="mt-0">
							<p className="text-center text-muted-foreground py-8">Formatting analysis content...</p>
						</TabsContent>
						<TabsContent value="ats" className="mt-0">
							<p className="text-center text-muted-foreground py-8">ATS compatibility check...</p>
						</TabsContent>
					</Card>
				</div>
			</Tabs>
		</div>
	);
}

