"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Loader2, CheckCircle2, XCircle, ChevronRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { generateQuizAction, saveQuizAttemptAction } from "@/app/academic/quizActions";

interface Question {
	question: string;
	options: string[];
	correctAnswer: string;
	explanation: string;
}

interface Quiz {
	id: string;
	title: string;
	questions: Question[];
}

export function QuizGenerator() {
	const [topic, setTopic] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [quiz, setQuiz] = useState<Quiz | null>(null);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
	const [score, setScore] = useState(0);
	const [completedScore, setCompletedScore] = useState<number | null>(null);
	const [isFinished, setIsFinished] = useState(false);

	const handleGenerate = async () => {
		if (!topic.trim()) {
			toast.error("Please enter a topic");
			return;
		}

		setIsGenerating(true);
		try {
			const result = await generateQuizAction(topic);

			if (result.success && result.quiz) {
				if (result.quiz.questions && result.quiz.questions.length > 0) {
					setQuiz(result.quiz as Quiz);
					setCurrentQuestionIndex(0);
					setScore(0);
					setCompletedScore(null);
					setSelectedAnswer(null);
					setIsFinished(false);
					toast.success("Quiz generated successfully!");
				} else {
					toast.error("The AI generated an invalid quiz format. Try again.");
				}
			} else {
				toast.error(result.error || "Failed to generate quiz");
			}
		} catch (error) {
			toast.error("An unexpected error occurred");
			console.error(error);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleAnswer = (option: string) => {
		if (selectedAnswer !== null) return;
		setSelectedAnswer(option);

		const isCorrect = option === quiz!.questions[currentQuestionIndex].correctAnswer;
		if (isCorrect) {
			setScore(prev => prev + 1);
		}
	};

	const handleNext = async () => {
		if (!quiz) return;

		if (currentQuestionIndex < quiz.questions.length - 1) {
			setCurrentQuestionIndex(prev => prev + 1);
			setSelectedAnswer(null);
		} else {
			setIsFinished(true);
			const finalScore = score + (selectedAnswer === quiz.questions[currentQuestionIndex].correctAnswer ? 1 : 0);
			setCompletedScore(finalScore);
			const result = await saveQuizAttemptAction(quiz.id, finalScore, quiz.questions.length);
			if (!result.success) {
				toast.error("Could not save your attempt to the database.");
			}
		}
	};

	const resetQuiz = () => {
		setQuiz(null);
		setTopic("");
		setCompletedScore(null);
		setIsFinished(false);
	};

	if (isFinished && quiz) {
		const finalScore = completedScore ?? score;
		const percentage = Math.round((finalScore / quiz.questions.length) * 100);

		return (
			<Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-lg relative overflow-hidden">
				<div className="absolute top-0 left-0 w-full h-1 pointer-events-none bg-gradient-to-r from-blue-500 to-purple-500" />
				<CardHeader className="text-center pb-2">
					<CardTitle className="text-2xl flex items-center justify-center gap-2">
						{percentage >= 80 ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <BrainCircuit className="h-6 w-6 text-primary" />}
						Quiz Complete!
					</CardTitle>
					<CardDescription>{quiz.title}</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col items-center py-6">
					<div className="text-5xl font-bold mb-2 bg-gradient-to-br from-primary to-purple-400 bg-clip-text text-transparent">
						{percentage}%
					</div>
					<p className="text-muted-foreground text-sm">
						You scored {finalScore} out of {quiz.questions.length}
					</p>
				</CardContent>
				<CardFooter className="flex justify-center flex-col gap-2">
					<Button onClick={resetQuiz} className="w-full gap-2">
						<RefreshCw className="h-4 w-4" /> Try Another Topic
					</Button>
				</CardFooter>
			</Card>
		);
	}

	if (quiz) {
		const currentQ = quiz.questions[currentQuestionIndex];
		const isAnswered = selectedAnswer !== null;
		const isCorrect = selectedAnswer === currentQ.correctAnswer;

		// Ensure safe handling for rendering
		const progressPercentage = ((currentQuestionIndex) / quiz.questions.length) * 100;

		return (
			<Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-lg relative overflow-hidden flex flex-col group min-h-[300px]">
				<div className="absolute top-0 left-0 h-1 pointer-events-none bg-primary transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
				<CardHeader className="pb-3 flex flex-row items-center justify-between">
					<div>
						<CardTitle className="text-sm text-primary flex items-center gap-2">
							<BrainCircuit className="h-4 w-4" />
							Question {currentQuestionIndex + 1} of {quiz.questions.length}
						</CardTitle>
						<CardDescription className="text-xs">{quiz.title}</CardDescription>
					</div>
					<div className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-md">
						Score: {score}
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="font-medium text-sm md:text-base leading-relaxed">
						{currentQ.question}
					</p>
					<div className="space-y-2">
						{currentQ.options.map((option, idx) => {
							let buttonVariant: "outline" | "default" | "destructive" | "secondary" = "outline";
							let icon = null;

							if (isAnswered) {
								if (option === currentQ.correctAnswer) {
									buttonVariant = "default";
									icon = <CheckCircle2 className="h-4 w-4" />;
								} else if (option === selectedAnswer) {
									buttonVariant = "destructive";
									icon = <XCircle className="h-4 w-4" />;
								}
							}

							const btnClasses = [
								"w-full justify-start text-left h-auto py-3 px-4",
								!isAnswered ? "hover:bg-primary/5 hover:border-primary/50" : "",
								isAnswered && option === currentQ.correctAnswer ? "bg-green-500/20 text-green-600 border-green-500/50 hover:bg-green-500/20" : ""
							].join(" ");

							return (
								<Button
									key={idx}
									variant={buttonVariant}
									className={btnClasses}
									onClick={() => handleAnswer(option)}
									disabled={isAnswered}
								>
									<div className="flex items-center gap-3 w-full">
										<span className="flex-shrink-0 w-6 h-6 rounded-full bg-background border flex items-center justify-center text-xs text-muted-foreground mr-2 group-hover:border-primary/50 transition-colors">
											{String.fromCharCode(65 + idx)}
										</span>
										<span className="flex-1 font-normal break-words overflow-hidden break-normal whitespace-normal">
											{option}
										</span>
										{icon}
									</div>
								</Button>
							);
						})}
					</div>

					{isAnswered && (
						<div className={`p-3 rounded-xl border text-xs ${isCorrect ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400'}`}>
							<p className="font-semibold mb-1">{isCorrect ? 'Correct!' : 'Incorrect.'}</p>
							<p className="opacity-90 leading-relaxed">{currentQ.explanation}</p>
						</div>
					)}
				</CardContent>
				<CardFooter className="mt-auto pt-4 border-t border-border/30 bg-muted/20">
					<Button
						onClick={handleNext}
						disabled={!isAnswered}
						className="w-full gap-2"
					>
						{currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
						<ChevronRight className="h-4 w-4" />
					</Button>
				</CardFooter>
			</Card>
		);
	}

	return (
		<Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-lg relative overflow-hidden group">
			<div className="absolute -inset-1 pointer-events-none bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
			<CardHeader>
				<CardTitle className="text-lg flex items-center gap-2">
					<BrainCircuit className="h-5 w-5 text-primary" />
					AI Quiz Generator
				</CardTitle>
				<CardDescription>Master any topic by testing your knowledge instantly.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<label className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Study Topic</label>
					<Input
						placeholder="e.g. Cognitive Psychology, Cell Biology, Microeconomics"
						value={topic}
						onChange={(e) => setTopic(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								handleGenerate();
							}
						}}
						disabled={isGenerating}
						className="bg-background/50 border-border/50 focus-visible:ring-primary/50"
					/>
				</div>
				<Button
					onClick={handleGenerate}
					disabled={isGenerating || !topic.trim()}
					className="w-full shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
				>
					{isGenerating ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Generating deeply...
						</>
					) : (
						<>
							<BrainCircuit className="mr-2 h-4 w-4" />
							Generate Smart Quiz
						</>
					)}
				</Button>
			</CardContent>
		</Card>
	);
}
