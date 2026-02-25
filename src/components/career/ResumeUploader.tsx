'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
Upload, 
FileText, 
CheckCircle2, 
AlertCircle, 
Loader2, 
X, 
Sparkles, 
ShieldCheck, 
ArrowRight 
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

function getErrorMessage(error: unknown): string {
if (error instanceof Error) return error.message;
if (typeof error === 'object' && error !== null) {
if ('message' in error && typeof (error as { message: unknown }).message === 'string') return (error as { message: string }).message;
if ('error' in error && typeof (error as { error: unknown }).error === 'string') return (error as { error: string }).error;
try { return JSON.stringify(error); } catch { return String(error); }
}
return String(error);
}

interface ResumeUploaderProps {
onUploadComplete: () => void;
}

export function ResumeUploader({ onUploadComplete }: ResumeUploaderProps) {
const [isDragging, setIsDragging] = useState(false);
const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "complete" | "error">("idle");
const [fileName, setFileName] = useState("");
const [errorMessage, setErrorMessage] = useState("");
const [file, setFile] = useState<File | null>(null);

const handleDragOver = (e: React.DragEvent) => {
e.preventDefault();
setIsDragging(true);
};

const handleDragLeave = () => {
setIsDragging(false);
};

const handleDrop = (e: React.DragEvent) => {
e.preventDefault();
setIsDragging(false);
const files = e.dataTransfer.files;
if (files.length > 0) {
const selectedFile = files[0];
if (selectedFile.type === "application/pdf") {
setFile(selectedFile);
setFileName(selectedFile.name);
setUploadStatus("idle");
} else {
setErrorMessage("Please upload a PDF document.");
setUploadStatus("error");
}
}
};

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
if (e.target.files && e.target.files.length > 0) {
const selectedFile = e.target.files[0];
if (selectedFile.type === "application/pdf") {
setFile(selectedFile);
setFileName(selectedFile.name);
setUploadStatus("idle");
} else {
setErrorMessage("Please upload a PDF document.");
setUploadStatus("error");
}
}
};

const handleUpload = async () => {
if (!file) return;

setUploadStatus("uploading");
setErrorMessage("");

try {
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error("Please log in to upload resumes.");

const filePath = `${user.id}/${Date.now()}_${file.name}`;

const { error: uploadError } = await supabase.storage
.from('resumes')
.upload(filePath, file);

if (uploadError) {
throw new Error(`File upload failed: ${getErrorMessage(uploadError)}`);
}

const analysisPayload = new FormData();
analysisPayload.append("file", file);

const analysisResponse = await fetch('/api/career/analyze-resume', {
method: 'POST',
body: analysisPayload
});

const analysisJson = await analysisResponse.json();
if (!analysisResponse.ok) {
throw new Error(`Analysis failed: ${analysisJson?.error || 'Unknown AI error.'}`);
}

const aiFeedback = analysisJson?.feedback;
const aiScore = Number(analysisJson?.score ?? 0);
if (!aiFeedback || !Number.isFinite(aiScore)) {
throw new Error("Analysis failed: invalid response format.");
}

const { error: dbError } = await supabase.from('Resume').insert({
id: crypto.randomUUID(),
userId: user.id,
fileName: file.name,
fileUrl: filePath,
score: aiScore,
feedback: aiFeedback,
satsCheck: aiScore >= 70
});

if (dbError) {
throw new Error(`Database error: ${getErrorMessage(dbError)}`);
}

setUploadStatus("complete");
onUploadComplete();
setFile(null);

} catch (error) {
const msg = getErrorMessage(error);
console.error("Upload error:", msg);
setErrorMessage(msg);
setUploadStatus("error");
}
};

return (
<Card className="bg-card/40 backdrop-blur-xl border-border/50 rounded-[2.5rem] overflow-hidden group shadow-2xl shadow-primary/5">
<CardContent className="p-10 text-left">
<div className="flex flex-col md:flex-row gap-10">
{/* Left: Interactive Dropzone */}
<div className="flex-1 space-y-6">
<div className="flex items-center gap-3">
<div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
<Upload className="h-5 w-5" />
</div>
<h3 className="font-black text-xl italic tracking-tight uppercase">Resume Upload</h3>
</div>

{!file ? (
<div
onDragOver={handleDragOver}
onDragLeave={handleDragLeave}
onDrop={handleDrop}
className={cn(
"relative h-64 rounded-[2rem] border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center cursor-pointer group/dropzone",
isDragging 
? "border-primary bg-primary/5 scale-[0.98]" 
: "border-border/40 hover:border-primary/40 hover:bg-muted/30"
)}
onClick={() => document.getElementById('resume-input')?.click()}
>
<input 
id="resume-input"
type="file" 
className="hidden" 
accept=".pdf" 
onChange={handleFileChange}
/>
<div className="p-5 rounded-full bg-muted/50 text-muted-foreground group-hover/dropzone:scale-110 group-hover/dropzone:text-primary transition-all duration-500 mb-4">
<FileText className="h-8 w-8" />
</div>
<div className="text-center px-6">
<p className="text-sm font-black italic tracking-tight text-foreground group-hover/dropzone:translate-y-[-2px] transition-transform">
{isDragging ? "Drop the file here" : "Drag & Drop Resume"}
</p>
<p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">
or browse your device
</p>
</div>
<div className="mt-6 flex flex-wrap justify-center gap-2 group-hover/dropzone:opacity-60 transition-opacity">
<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/60 border border-border/50 text-[10px] font-bold text-muted-foreground">
<CheckCircle2 className="h-3 w-3 text-green-500" /> PDF Only
</div>
<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/60 border border-border/50 text-[10px] font-bold text-muted-foreground">
<CheckCircle2 className="h-3 w-3 text-green-500" /> AI Ready
</div>
</div>

<div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover/dropzone:opacity-100 transition-opacity pointer-events-none" />
</div>
) : (
<motion.div 
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
className="relative h-64 rounded-[2rem] bg-muted/30 border border-border/50 flex flex-col items-center justify-center p-8 group/file"
>
<button 
onClick={() => { setFile(null); setUploadStatus("idle"); }}
className="absolute top-4 right-4 p-2 rounded-xl bg-card hover:bg-destructive hover:text-white transition-all duration-300"
>
<X className="h-4 w-4" />
</button>

<div className="w-16 h-16 rounded-[1.25rem] bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover/file:rotate-6 transition-transform">
<FileText className="h-8 w-8" />
</div>

<div className="text-center max-w-full">
<p className="text-sm font-black italic tracking-tight text-foreground truncate px-4">
{fileName}
</p>
<p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest leading-none">
{(file.size / 1024 / 1024).toFixed(2)} MB  Ready for Analysis
</p>
</div>

<Button 
onClick={handleUpload}
disabled={uploadStatus === "uploading"}
className="mt-6 h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black italic tracking-tighter shadow-lg shadow-primary/20 group/btn"
>
{uploadStatus === "uploading" ? (
<>
<Loader2 className="h-5 w-5 mr-3 animate-spin" />
Analyzing...
</>
) : (
<>
Run AI Analysis
<Sparkles className="h-5 w-5 ml-3 group-hover/btn:scale-125 transition-transform" />
</>
)}
</Button>
</motion.div>
)}

<AnimatePresence>
{uploadStatus === "error" && (
<motion.div 
initial={{ opacity: 0, height: 0 }}
animate={{ opacity: 1, height: 'auto' }}
exit={{ opacity: 0, height: 0 }}
className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start gap-3"
>
<AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
<p className="text-xs font-bold text-destructive italic tracking-tight">{errorMessage}</p>
</motion.div>
)}
{uploadStatus === "complete" && (
<motion.div 
initial={{ opacity: 0, height: 0 }}
animate={{ opacity: 1, height: 'auto' }}
exit={{ opacity: 0, height: 0 }}
className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-start gap-3"
>
<CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
<p className="text-xs font-bold text-green-600 italic tracking-tight">Analysis complete! Check your report on the right.</p>
</motion.div>
)}
</AnimatePresence>
</div>

{/* Right: Feature Highlights */}
<div className="md:w-[280px] space-y-6">
<h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2 mt-2">What happens next?</h4>
<div className="space-y-4">
{[
{ title: "ATS Optimization", desc: "Scan for recruiter readability.", color: "bg-blue-500", icon: ShieldCheck },
{ title: "Keyword Extraction", desc: "Identify key skills found.", color: "bg-violet-500", icon: Sparkles },
{ title: "Impact Scoring", desc: "Get a metric for sections.", color: "bg-amber-500", icon: ArrowRight }
].map((feature, idx) => (
<div key={idx} className="flex gap-4 p-4 rounded-3xl bg-card/60 border border-border/30 hover:shadow-xl hover:shadow-primary/5 transition-all">
<div className={cn("shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white", feature.color)}>
<feature.icon className="h-4 w-4" />
</div>
<div className="min-w-0">
<p className="text-xs font-black italic text-foreground tracking-tight leading-none mb-1">{feature.title}</p>
<p className="text-[10px] text-muted-foreground leading-tight line-clamp-1 italic">{feature.desc}</p>
</div>
</div>
))}
</div>

<div className="p-5 rounded-3xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
<div className="flex items-center gap-2 mb-2">
<AlertCircle className="h-3 w-3 text-primary" />
<span className="text-[10px] font-black uppercase tracking-widest text-primary">Pro Tip</span>
</div>
<p className="text-[11px] font-bold italic tracking-tight leading-relaxed text-muted-foreground">
Upload a PDF version for the best analysis results. Scanned images are not yet supported.
</p>
</div>
</div>
</div>
</CardContent>
</Card>
);
}
