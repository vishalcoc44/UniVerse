"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Bug, Lightbulb } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function FeedbackWidget() {
	const [feedbackType, setFeedbackType] = useState<"feature" | "bug">("feature");
	const [description, setDescription] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		const cleanDescription = description.trim();
		if (cleanDescription.length < 10) {
			toast.error("Please provide at least 10 characters of feedback.");
			return;
		}

		setIsSubmitting(true);
		try {
			const response = await fetch("/api/updates/feedback", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					type: feedbackType,
					description: cleanDescription,
				}),
			});

			const payload = await response.json();
			if (!response.ok) {
				throw new Error(payload?.error || "Could not submit feedback.");
			}

			void import("@/lib/analytics").then(({ track }) => track("submit_feedback", { type: feedbackType }));
			setDescription("");
			setFeedbackType("feature");
			toast.success("Feedback submitted. Thank you!");
		} catch (error: any) {
			toast.error(error?.message || "Failed to submit feedback.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card className="p-6 border-border/50 bg-card/60 backdrop-blur-sm sticky top-6">
			<div className="flex items-center gap-3 mb-4">
				<div className="p-2 bg-primary/10 rounded-lg text-primary">
					<Lightbulb className="h-5 w-5" />
				</div>
				<div>
					<h3 className="font-semibold">Help us improve</h3>
					<p className="text-xs text-muted-foreground">Share your ideas or report bugs.</p>
				</div>
			</div>

			<div className="space-y-4">
				<div className="space-y-3">
					<Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Feedback Type</Label>
					<RadioGroup
						value={feedbackType}
						onValueChange={(value) => setFeedbackType(value as "feature" | "bug")}
						className="grid grid-cols-2 gap-2"
					>
						<div className="flex items-center space-x-2 border rounded-md p-2 hover:bg-muted/50 transition-colors">
							<RadioGroupItem value="feature" id="feature" />
							<Label htmlFor="feature" className="flex items-center gap-2 cursor-pointer font-normal text-sm">
								<Lightbulb className="h-3 w-3" /> Feature
							</Label>
						</div>
						<div className="flex items-center space-x-2 border rounded-md p-2 hover:bg-muted/50 transition-colors">
							<RadioGroupItem value="bug" id="bug" />
							<Label htmlFor="bug" className="flex items-center gap-2 cursor-pointer font-normal text-sm">
								<Bug className="h-3 w-3" /> Bug
							</Label>
						</div>
					</RadioGroup>
				</div>

				<div className="space-y-2">
					<Label htmlFor="description" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</Label>
					<Textarea
						id="description"
						placeholder="Describe your idea or the issue you faced..."
						className="min-h-[100px] bg-background/50 resize-none"
						value={description}
						onChange={(event) => setDescription(event.target.value)}
					/>
				</div>

				<Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
					{isSubmitting ? "Submitting..." : "Submit Feedback"}
				</Button>
			</div>
		</Card>
	);
}
