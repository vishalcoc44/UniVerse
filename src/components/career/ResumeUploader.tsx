import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ResumeUploaderProps {
	onUploadComplete: () => void;
}

export function ResumeUploader({ onUploadComplete }: ResumeUploaderProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "complete">("idle");
	const [fileName, setFileName] = useState("");

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
			handleFile(files[0]);
		}
	};

	const handleFile = (file: File) => {
		setFileName(file.name);
		setUploadStatus("uploading");
		// Simulate upload
		setTimeout(() => {
			setUploadStatus("complete");
			onUploadComplete();
		}, 2000);
	};

	return (
		<Card
			className={cn(
				"relative overflow-hidden border-2 border-dashed transition-all duration-300 p-8 text-center",
				isDragging ? "border-primary bg-primary/5" : "border-border/50 bg-card/50",
				uploadStatus === "complete" ? "border-green-500/50 bg-green-500/5" : ""
			)}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			<div className="flex flex-col items-center justify-center gap-4">
				<div className={cn(
					"w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500",
					uploadStatus === "complete" ? "bg-green-500/20 text-green-600" : "bg-primary/10 text-primary"
				)}>
					{uploadStatus === "complete" ? (
						<CheckCircle2 className="w-8 h-8" />
					) : (
						<UploadCloud className="w-8 h-8" />
					)}
				</div>

				<div className="space-y-2">
					<h3 className="font-semibold text-lg text-foreground">
						{uploadStatus === "complete" ? "Analysis Complete!" : "Upload your Resume"}
					</h3>
					<p className="text-sm text-muted-foreground max-w-xs mx-auto">
						{uploadStatus === "uploading"
							? "Analyzing keywords, formatting, and impact..."
							: uploadStatus === "complete"
								? `Successfully analyzed ${fileName}`
								: "Drag & drop your PDF here, or click to browse"}
					</p>
				</div>

				{uploadStatus === "idle" && (
					<Button variant="outline" className="mt-2">
						Browse Files
					</Button>
				)}
			</div>

			{uploadStatus === "uploading" && (
				<div className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-[2000ms] ease-out w-full" />
			)}
		</Card>
	);
}
