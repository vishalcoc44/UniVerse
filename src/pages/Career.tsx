import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ResumeUploader } from "@/components/career/ResumeUploader";
import { AnalysisDashboard } from "@/components/career/AnalysisDashboard";
import { MockInterviewer } from "@/components/career/tools/MockInterviewer";
import { AlumniDirectory } from "@/components/career/tools/AlumniDirectory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText, Users, Mic } from "lucide-react";
import { useState } from "react";

const Career = () => {
	const [refreshKey, setRefreshKey] = useState(0);

	return (
		<DashboardLayout
			title="Career Hub"
			subtitle="AI-powered tools to accelerate your professional journey."
			breadcrumb={["UniVerse", "Career"]}
		>
			<div className="max-w-6xl mx-auto h-[calc(100vh-12rem)] min-h-[800px] flex flex-col gap-6">

				<Tabs defaultValue="resume" className="h-full flex flex-col">
					<div className="flex items-center justify-between mb-2">
						<TabsList>
							<TabsTrigger value="resume" className="gap-2">
								<FileText className="h-4 w-4" /> Resume AI
							</TabsTrigger>
							<TabsTrigger value="interview" className="gap-2">
								<Mic className="h-4 w-4" /> Mock Interview
							</TabsTrigger>
							<TabsTrigger value="network" className="gap-2">
								<Users className="h-4 w-4" /> Alumni Network
							</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent value="resume" className="flex-1 mt-0">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
							<div className="space-y-6">
								<section>
									<h3 className="text-lg font-semibold mb-4 text-foreground/80">Upload & Analyze</h3>
									<ResumeUploader onUploadComplete={() => setRefreshKey(prev => prev + 1)} />
								</section>

								{/* Market Pulse Widget (Inline) */}
								<div className="p-4 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm">
									<h4 className="text-sm font-medium mb-3 flex items-center gap-2">
										<span className="relative flex h-2 w-2">
											<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
											<span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
										</span>
										Market Pulse: Top Keywords
									</h4>
									<div className="flex flex-wrap gap-2">
										{["React.js", "TypeScript", "System Design", "AWS", "GraphQL"].map(skill => (
											<span key={skill} className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
												{skill}
											</span>
										))}
									</div>
								</div>
							</div>

							<div>
								<h3 className="text-lg font-semibold mb-4 text-foreground/80">Analysis Report</h3>
								<AnalysisDashboard key={refreshKey} />
							</div>
						</div>
					</TabsContent>

					<TabsContent value="interview" className="flex-1 mt-0">
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
							<div className="lg:col-span-2 h-full">
								<MockInterviewer />
							</div>
							<div className="lg:col-span-1 space-y-4">
								{/* Tips or extra context could go here */}
								<div className="p-6 rounded-xl border border-blue-500/20 bg-blue-500/5 h-full">
									<h4 className="font-semibold text-blue-600 mb-2">Pro Tips</h4>
									<ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
										<li>Maintain eye contact with the camera.</li>
										<li>Use the STAR method (Situation, Task, Action, Result).</li>
										<li>Speak clearly and at a moderate pace.</li>
									</ul>
								</div>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="network" className="flex-1 mt-0">
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
							<div className="lg:col-span-2 h-full">
								<AlumniDirectory />
							</div>
							<div className="lg:col-span-1">
								{/* Potential "My Mentors" section */}
								<div className="p-6 rounded-xl border border-border/50 bg-card/50 h-full flex flex-col items-center justify-center text-center space-y-4">
									<div className="bg-primary/10 p-4 rounded-full text-primary">
										<Users className="h-8 w-8" />
									</div>
									<div>
										<h4 className="font-semibold">Join the Mentorship Program</h4>
										<p className="text-sm text-muted-foreground mt-1">Connect with seniors for guidance.</p>
									</div>
									<Button>Apply as Mentee</Button>
								</div>
							</div>
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</DashboardLayout>
	);
};

export default Career;
