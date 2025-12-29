'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatInterface } from "@/components/academic/ChatInterface";
import { ResourceGrid } from "@/components/academic/ResourceGrid";
import { FocusTimer } from "@/components/academic/tools/FocusTimer";
import { GPACalculator } from "@/components/academic/tools/GPACalculator";
import { FlashcardGenerator } from "@/components/academic/tools/FlashcardGenerator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Users, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Academic() {
	return (
		<DashboardLayout
			title="Academic AI"
			subtitle="Your personal intelligent study companion."
			breadcrumb={["UniVerse", "Academic"]}
		>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
				{/* Left Column: Chat Interface */}
				<div className="lg:col-span-2 flex flex-col gap-6 h-full">
					<ChatInterface />
				</div>

				{/* Right Column: Resources & Tools */}
				<div className="flex flex-col gap-4 overflow-y-auto pr-1 h-full">

					{/* Active Study Groups (Persistent) */}
					<Card className="p-4 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/20 shrink-0">
						<div className="flex items-center gap-3 mb-3">
							<div className="p-2 bg-indigo-500/20 text-indigo-600 rounded-lg">
								<Users className="h-5 w-5" />
							</div>
							<div>
								<h3 className="font-semibold text-foreground">Study Circles</h3>
								<p className="text-xs text-muted-foreground">3 groups active now</p>
							</div>
						</div>
						<div className="space-y-2 mb-3">
							<div className="flex items-center justify-between p-2 bg-background/60 rounded-lg text-sm">
								<span className="font-medium">CS301 Algorithm...</span>
								<Badge variant="secondary" className="h-5 text-[10px] bg-green-500/10 text-green-600">4 online</Badge>
							</div>
							<div className="flex items-center justify-between p-2 bg-background/60 rounded-lg text-sm">
								<span className="font-medium">Physics Finals Pr...</span>
								<Badge variant="secondary" className="h-5 text-[10px] bg-amber-500/10 text-amber-600">2 online</Badge>
							</div>
						</div>
						<Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20" size="sm">
							Find a Group <ArrowRight className="h-4 w-4 ml-2" />
						</Button>
					</Card>

					<Tabs defaultValue="tools" className="flex-1 flex flex-col">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="resources">Resources</TabsTrigger>
							<TabsTrigger value="tools" className="gap-2">
								<Wrench className="h-3.5 w-3.5" /> Tools
							</TabsTrigger>
						</TabsList>

						<TabsContent value="resources" className="flex-1 mt-4 overflow-y-auto">
							<ResourceGrid />
						</TabsContent>

						<TabsContent value="tools" className="flex-1 mt-4 space-y-4 overflow-y-auto pr-1">
							<FocusTimer />
							<GPACalculator />
							<FlashcardGenerator />
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</DashboardLayout>
	);
};
