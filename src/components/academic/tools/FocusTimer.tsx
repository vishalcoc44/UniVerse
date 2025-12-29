import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function FocusTimer() {
	const [timeLeft, setTimeLeft] = useState(25 * 60);
	const [isActive, setIsActive] = useState(false);
	const [mode, setMode] = useState<"focus" | "break">("focus");

	useEffect(() => {
		let interval: NodeJS.Timeout;
		if (isActive && timeLeft > 0) {
			interval = setInterval(() => {
				setTimeLeft((time) => time - 1);
			}, 1000);
		} else if (timeLeft === 0 && isActive) {
			setIsActive(false);
			handleSessionComplete();
		}
		return () => clearInterval(interval);
	}, [isActive, timeLeft]);

	const handleSessionComplete = async () => {
		// Play sound or show notification
		toast.success(mode === "focus" ? "Focus session complete! Take a break." : "Break over! Ready to focus?");

		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (user) {
				const duration = mode === "focus" ? 25 * 60 : 5 * 60;
				const { error } = await supabase.from('StudySession').insert({
					userId: user.id,
					duration,
					mode
				});
				if (error) throw error;
			}
		} catch (error) {
			console.error("Error saving study session:", error);
		}
	};

	const toggleTimer = () => setIsActive(!isActive);

	const resetTimer = () => {
		setIsActive(false);
		setTimeLeft(mode === "focus" ? 25 * 60 : 5 * 60);
	};

	const switchMode = (newMode: "focus" | "break") => {
		setMode(newMode);
		setIsActive(false);
		setTimeLeft(newMode === "focus" ? 25 * 60 : 5 * 60);
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

	return (
		<Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden relative">
			{/* Ambient Background Glow */}
			<div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[60px] transition-colors duration-1000 ${isActive ? (mode === 'focus' ? 'bg-indigo-500/20' : 'bg-green-500/20') : 'bg-transparent'}`} />

			<CardHeader className="pb-2">
				<CardTitle className="flex items-center justify-between text-base">
					<span className="flex items-center gap-2">
						{mode === 'focus' ? <Brain className="h-4 w-4 text-indigo-400" /> : <Coffee className="h-4 w-4 text-green-400" />}
						Focus Timer
					</span>
					<Badge variant="outline" className={`text-xs ${isActive ? 'animate-pulse' : ''} ${mode === 'focus' ? 'border-indigo-500/30 text-indigo-400' : 'border-green-500/30 text-green-400'}`}>
						{mode === 'focus' ? 'Flow State' : 'Chill Mode'}
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="text-5xl font-bold text-center font-mono tracking-wider tabular-nums">
					{formatTime(timeLeft)}
				</div>

				<div className="flex items-center justify-center gap-2">
					<Button size="icon" className={mode === 'focus' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-600 hover:bg-green-700'} onClick={toggleTimer}>
						{isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-1" />}
					</Button>
					<Button size="icon" variant="secondary" onClick={resetTimer}>
						<RotateCcw className="h-4 w-4" />
					</Button>
				</div>

				<div className="grid grid-cols-2 gap-2">
					<Button
						variant="ghost"
						size="sm"
						className={`text-xs ${mode === 'focus' ? 'bg-secondary' : ''}`}
						onClick={() => switchMode('focus')}
					>
						Focus (25m)
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className={`text-xs ${mode === 'break' ? 'bg-secondary' : ''}`}
						onClick={() => switchMode('break')}
					>
						Break (5m)
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
