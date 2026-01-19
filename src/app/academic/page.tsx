'use client';

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatInterface } from "@/components/academic/ChatInterface";
import { ResourceGrid } from "@/components/academic/ResourceGrid";
import { FocusTimer } from "@/components/academic/tools/FocusTimer";
import { StudyCircles } from "@/components/academic/StudyCircles";
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
					<StudyCircles />

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
