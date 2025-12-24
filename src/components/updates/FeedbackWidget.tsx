import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Bug, Lightbulb, MessageSquare } from "lucide-react";

export function FeedbackWidget() {
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
					<RadioGroup defaultValue="feature" className="grid grid-cols-2 gap-2">
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
					/>
				</div>

				<Button className="w-full">
					Submit Feedback
				</Button>
			</div>
		</Card>
	);
}
