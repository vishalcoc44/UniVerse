'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
Mic, 
MicOff, 
Play, 
Square, 
Volume2, 
Sparkles, 
History, 
Settings, 
ChevronRight,
Timer,
BrainCircuit,
Video,
VideoOff
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const questions = [
"Tell me about a time you faced a challenge and how you overcame it.",
"What are your greatest strengths as a developer?",
"Where do you see yourself in 5 years?",
"Why do you want to work for this company?",
"Explain a complex technical concept to a non-technical person.",
"How do you handle conflict within a team environment?",
"Describe your ideal work environment and culture."
];

export function MockInterviewer() {
const [isRecording, setIsRecording] = useState(false);
const [currentQuestion, setCurrentQuestion] = useState(0);
const [timer, setTimer] = useState(0);
const [bars, setBars] = useState<number[]>(new Array(40).fill(10));
const [mode, setMode] = useState<"practice" | "review">("practice");
const [videoEnabled, setVideoEnabled] = useState(true);

// Mock volume visualiser & timer
useEffect(() => {
let interval: NodeJS.Timeout;
let timerInterval: NodeJS.Timeout;

if (isRecording) {
interval = setInterval(() => {
setBars(new Array(40).fill(0).map(() => Math.random() * 80 + 10));
}, 80);
timerInterval = setInterval(() => {
setTimer(prev => prev + 1);
}, 1000);
} else {
setBars(new Array(40).fill(10));
}

return () => {
clearInterval(interval);
clearInterval(timerInterval);
};
}, [isRecording]);

const toggleRecording = () => {
if (isRecording) {
setIsRecording(false);
} else {
setTimer(0);
setIsRecording(true);
}
};

const formatTime = (seconds: number) => {
const mins = Math.floor(seconds / 60);
const secs = seconds % 60;
return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const nextQuestion = () => {
setIsRecording(false);
setTimer(0);
setCurrentQuestion((prev) => (prev + 1) % questions.length);
};

return (
<Card className="bg-card/40 backdrop-blur-xl border-border/50 rounded-[2.5rem] overflow-hidden group shadow-2xl shadow-violet-500/5 h-full flex flex-col">
<CardContent className="p-10 flex-1 flex flex-col gap-8">
{/* Top Header Section */}
<div className="flex items-center justify-between">
<div className="flex items-center gap-4">
<div className="p-3 rounded-2xl bg-violet-500/10 text-violet-500 shadow-inner">
<BrainCircuit className="h-6 w-6" />
</div>
<div>
<h3 className="font-black text-xl italic tracking-tight uppercase">AI Interview Suite</h3>
<div className="flex items-center gap-2">
<span className="relative flex h-2 w-2">
<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
<span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
</span>
<p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Practice Mode Active</p>
</div>
</div>
</div>

<div className="flex items-center gap-2 bg-card/60 p-1.5 rounded-2xl border border-border/30">
<button 
onClick={() => setVideoEnabled(!videoEnabled)}
className={cn("p-2 rounded-xl transition-all", videoEnabled ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20" : "text-muted-foreground hover:bg-muted")}
>
{videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
</button>
<button className="p-2 rounded-xl text-muted-foreground hover:bg-muted">
<Settings className="h-4 w-4" />
</button>
</div>
</div>

{/* Primary Interaction Area */}
<div className="flex-1 min-h-[400px] bg-card/60 rounded-[3rem] border border-border/30 relative overflow-hidden group/stage shadow-inner">
{/* Video Mock Placeholder */}
<div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/20 to-transparent">
{!videoEnabled && (
<div className="text-center space-y-4">
<div className="w-24 h-24 rounded-full bg-muted/50 mx-auto flex items-center justify-center text-muted-foreground">
<VideoOff className="h-10 w-10" />
</div>
<p className="text-xs font-black italic tracking-tight text-muted-foreground uppercase">Camera Disabled</p>
</div>
)}
</div>

{/* Question Overlay */}
<div className="absolute inset-x-8 top-8">
<AnimatePresence mode="wait">
<motion.div 
key={currentQuestion}
initial={{ opacity: 0, y: -20 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: 20 }}
className="bg-card/80 backdrop-blur-xl border border-border/50 p-8 rounded-[2rem] text-center shadow-2xl"
>
<div className="flex items-center justify-center gap-2 mb-4">
<Badge variant="outline" className="border-violet-500/20 text-violet-500 bg-violet-500/5 font-black uppercase tracking-widest text-[9px] py-1">
Behavioral Round
</Badge>
<span className="text-[10px] font-black text-muted-foreground italic tracking-tight">Q{currentQuestion + 1}/{questions.length}</span>
</div>
<h3 className="text-2xl font-black italic tracking-tighter text-foreground leading-tight">
"{questions[currentQuestion]}"
</h3>
</motion.div>
</AnimatePresence>
</div>

{/* Bottom Visualizer / Timer Overlay */}
<div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-card/90 to-transparent pt-32">
<div className="flex flex-col items-center gap-8">
{/* Visualizer */}
<div className="flex items-center justify-center gap-1 h-12 w-full max-w-sm px-4">
{bars.map((height, i) => (
<motion.div
key={i}
animate={{ height: `${height}%` }}
transition={{ type: "spring", stiffness: 300, damping: 20 }}
className={cn(
"w-1 rounded-full bg-violet-500/80 shadow-[0_0_15px_rgba(139,92,246,0.3)]",
!isRecording && "bg-muted-foreground/30 shadow-none h-1"
)}
/>
))}
</div>

{/* Recording Controls */}
<div className="flex items-center gap-8">
<div className="text-right min-w-[60px]">
<p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Elapsed</p>
<p className={cn("text-lg font-black italic tracking-tighter font-mono", isRecording ? "text-violet-500" : "text-muted-foreground")}>
{formatTime(timer)}
</p>
</div>

<button
onClick={toggleRecording}
className={cn(
"h-24 w-24 rounded-full shadow-2xl transition-all duration-500 flex items-center justify-center group/btn relative",
isRecording 
? "bg-rose-500 scale-110 shadow-rose-500/20" 
: "bg-violet-500 hover:scale-105 shadow-violet-500/20"
)}
>
<div className="absolute inset-0 rounded-full animate-pulse-slow bg-inherit opacity-20 scale-125 pointer-events-none" />
{isRecording ? (
<Square className="h-8 w-8 text-white fill-current" />
) : (
<Mic className="h-10 w-10 text-white" />
)}
</button>

<div className="min-w-[60px]">
<p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</p>
<p className={cn("text-xs font-black italic tracking-tight uppercase", isRecording ? "text-rose-500" : "text-muted-foreground")}>
{isRecording ? "Live" : "Standby"}
</p>
</div>
</div>
</div>
</div>
</div>

{/* Bottom Navigation */}
<div className="flex items-center justify-between px-6 pt-2">
<div className="flex gap-4">
<Button variant="ghost" className="rounded-xl font-black italic text-muted-foreground hover:text-foreground">
<History className="h-4 w-4 mr-2" />
Previous Attempt
</Button>
<Button variant="ghost" className="rounded-xl font-black italic text-muted-foreground hover:text-foreground">
<Sparkles className="h-4 w-4 mr-2" />
AI Analysis
</Button>
</div>

<div className="flex gap-3">
<Button 
variant="outline" 
className="h-12 px-6 rounded-2xl font-black italic tracking-tighter border-border/50"
onClick={() => setCurrentQuestion(0)}
>
Restart Session
</Button>
<Button 
className="h-12 px-8 rounded-2xl bg-violet-500 hover:bg-violet-600 font-black italic tracking-tighter group/next text-white shadow-xl shadow-violet-500/10"
onClick={nextQuestion}
>
Skip Question
<ChevronRight className="h-5 w-5 ml-2 group-hover/next:translate-x-1 transition-transform" />
</Button>
</div>
</div>
</CardContent>
</Card>
);
}
