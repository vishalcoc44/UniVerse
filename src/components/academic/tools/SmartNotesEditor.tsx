"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Save, Sparkles, Wand2, Loader2, History, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { saveNoteAction, summarizeTextAction, explainConceptAction } from "@/app/academic/noteActions";

export function SmartNotesEditor() {
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [noteId, setNoteId] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [isProcessingAI, setIsProcessingAI] = useState(false);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);

	// Auto-save logic
	useEffect(() => {
		const timer = setTimeout(() => {
			if (content && title && !isSaving && (noteId || content.length > 50)) {
				handleSave(true);
			}
		}, 5000); // Auto save after 5 seconds of inactivity

		return () => clearTimeout(timer);
	}, [content, title]);

	const handleSave = async (silent = false) => {
		if (!title.trim() && !content.trim()) return;

		setIsSaving(true);
		try {
			const result = await saveNoteAction(title || "Untitled Note", content, noteId || undefined);
			if (result.success) {
				setNoteId(result.noteId || null);
				setLastSaved(new Date());
				if (!silent) {
					void import("@/lib/analytics").then(({ track }) => track("save_note", { isNew: !noteId }));
					toast.success("Note saved successfully");
				}
			} else {
				if (!silent) toast.error(result.error || "Failed to save note");
			}
		} catch (error) {
			if (!silent) toast.error("An unexpected error occurred");
		} finally {
			setIsSaving(false);
		}
	};

	const handleSummarize = async () => {
		if (!content.trim()) {
			toast.error("Please add some content to summarize");
			return;
		}

		setIsProcessingAI(true);
		try {
			const result = await summarizeTextAction(content);
			if (result.success && result.summary) {
				setContent(content + "\n\n--- AI Summary ---\n" + result.summary);
				void import("@/lib/analytics").then(({ track }) => track("ai_summarize_note"));
				toast.success("Summary generated!");
			} else {
				toast.error(result.error || "Failed to summarize");
			}
		} catch (error) {
			toast.error("Error generating summary");
		} finally {
			setIsProcessingAI(false);
		}
	};

	const handleExplain = async () => {
		// Find selected text if possible, otherwise use full content (simplified for this component)
		const selectedText = window.getSelection()?.toString() || content.trim();

		if (!selectedText) {
			toast.error("Please select some text or add content to explain");
			return;
		}

		setIsProcessingAI(true);
		try {
			const result = await explainConceptAction(selectedText.slice(0, 1000)); // Limit to first 1000 chars for explanation
			if (result.success && result.explanation) {
				setContent(content + "\n\n--- AI Explanation ---\n" + result.explanation);
				void import("@/lib/analytics").then(({ track }) => track("ai_explain_concept"));
				toast.success("Explanation generated!");
			} else {
				toast.error(result.error || "Failed to explain");
			}
		} catch (error) {
			toast.error("Error generating explanation");
		} finally {
			setIsProcessingAI(false);
		}
	};

	return (
		<Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-lg relative overflow-hidden group min-h-[500px] flex flex-col">
			<div className="absolute top-0 left-0 w-full h-1 pointer-events-none bg-gradient-to-r from-blue-500 to-indigo-500" />
			<CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-border/30">
				<div className="flex-1 mr-4">
					<Input
						placeholder="Untitled Note"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="text-lg font-semibold bg-transparent border-none focus-visible:ring-0 px-0 shadow-none h-auto placeholder:text-muted-foreground/50"
					/>
				</div>
				<div className="flex items-center gap-2">
					{lastSaved && (
						<span className="text-xs text-muted-foreground hidden md:inline-flex items-center gap-1">
							{isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <History className="h-3 w-3" />}
							{isSaving ? "Saving..." : `Saved ${lastSaved.toLocaleTimeString()}`}
						</span>
					)}
					<Button size="sm" variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>
						<Save className="h-4 w-4 mr-2" />
						Save
					</Button>
				</div>
			</CardHeader>
			<CardContent className="flex-1 p-0 flex flex-col relative">
				<Textarea
					placeholder="Start taking notes... highlight text to use AI features."
					value={content}
					onChange={(e) => setContent(e.target.value)}
					className="flex-1 resize-none bg-transparent border-none focus-visible:ring-0 p-4 min-h-[300px]"
				/>
			</CardContent>
			<CardFooter className="pt-3 border-t border-border/30 flex justify-between bg-muted/10">
				<div className="flex gap-2">
					<Button size="sm" variant="secondary" onClick={handleSummarize} disabled={isProcessingAI || !content.trim()}>
						{isProcessingAI ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2 text-indigo-400" />}
						Summarize
					</Button>
					<Button size="sm" variant="secondary" onClick={handleExplain} disabled={isProcessingAI || !content.trim()}>
						{isProcessingAI ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2 text-blue-400" />}
						Explain Concept
					</Button>
				</div>
				<div className="text-xs text-muted-foreground hidden md:block">
					{content.length} characters
				</div>
			</CardFooter>
		</Card>
	);
}
