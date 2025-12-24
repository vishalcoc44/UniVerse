import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Play, Square, Volume2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const questions = [
	"Tell me about a time you faced a challenge and how you overcame it.",
	"What are your greatest strengths as a developer?",
	"Where do you see yourself in 5 years?",
	"Why do you want to work for this company?"
];

export function MockInterviewer() {
	const [isRecording, setIsRecording] = useState(false);
	const [currentQuestion, setCurrentQuestion] = useState(0);
	const [volume, setVolume] = useState(0);

	// Mock volume visualiser
	useEffect(() => {
		if (!isRecording) {
			setVolume(0);
			return;
		}
		const interval = setInterval(() => {
			setVolume(Math.random() * 100);
		}, 100);
		return () => clearInterval(interval);
	}, [isRecording]);

	const toggleRecording = () => {
		setIsRecording(!isRecording);
	};

	const nextQuestion = () => {
		setIsRecording(false);
		setCurrentQuestion((prev) => (prev + 1) % questions.length);
	};

	return (
		<Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full flex flex-col">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Mic className="h-5 w-5 text-primary" />
					AI Mock Interviewer
				</CardTitle>
				<CardDescription>Practice behavioral questions with real-time feedback.</CardDescription>
			</CardHeader>
			<CardContent className="flex-1 flex flex-col gap-6">

				<div className="bg-muted/50 p-6 rounded-xl border border-border/50 text-center flex-1 flex flex-col items-center justify-center relative overflow-hidden">
					{/* Audio Visualizer (Mock) */}
					<div className="absolute inset-0 flex items-center justify-center gap-1 opacity-20 pointer-events-none">
						{[...Array(20)].map((_, i) => (
							<div
								key={i}
								className="w-2 bg-primary transition-all duration-75 rounded-full"
								style={{ height: isRecording ? `${Math.random() * 80 + 20}%` : '10%' }}
							/>
						))}
					</div>

					<Badge variant="secondary" className="mb-4">Question {currentQuestion + 1} of {questions.length}</Badge>
					<h3 className="text-xl font-medium leading-relaxed max-w-md z-10">
						"{questions[currentQuestion]}"
					</h3>
				</div>

				<div className="flex items-center justify-center gap-4">
					<Button
						size="lg"
						variant={isRecording ? "destructive" : "default"}
						className={cn("h-16 w-16 rounded-full shadow-xl transition-all", isRecording && "animate-pulse ring-4 ring-destructive/20")}
						onClick={toggleRecording}
					>
						{isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
					</Button>
				</div>

				<div className="flex items-center justify-between">
					<Button variant="ghost" size="sm" onClick={() => setCurrentQuestion(0)}>Restart</Button>
					<Button variant="outline" size="sm" onClick={nextQuestion} className="gap-2">
						Next Question <Play className="h-3 w-3" />
					</Button>
				</div>

			</CardContent>
		</Card>
	);
}
