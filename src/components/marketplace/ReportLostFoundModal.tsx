
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImagePlus, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { createListing, ListingType } from "@/app/marketplace/actions";
import { toast } from "sonner";

interface ReportLostFoundModalProps {
	onListingCreated?: () => void;
}

export function ReportLostFoundModal({ onListingCreated }: ReportLostFoundModalProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		title: "",
		type: "LOST" as ListingType,
		location: "",
		date: "",
		description: "",
	});

	const handleChange = (field: string, value: string) => {
		setFormData(prev => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async () => {
		if (!formData.title || !formData.location || !formData.description) {
			toast.error("Please fill in all required fields.");
			return;
		}

		setLoading(true);
		try {
			// Encode location and date into description logic for now
			// Schema doesn't have location/date for MarketplaceListing, so we put it in description
			const richDescription = `Location: ${formData.location}\nDate: ${formData.date}\n\n${formData.description}`;

			const result = await createListing({
				title: formData.title,
				price: 0, // Lost/Found items have no price
				description: richDescription,
				type: formData.type,
				// imageUrl: ... 
			});

			if (!result.success) {
				throw new Error(result.error);
			}

			toast.success(`${formData.type === 'LOST' ? 'Lost' : 'Found'} item reported successfully!`);
			setOpen(false);
			setFormData({ title: "", type: "LOST", location: "", date: "", description: "" });
			if (onListingCreated) onListingCreated();

		} catch (error) {
			console.error("Error creating listing:", error);
			toast.error("Failed to report item.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="destructive" className="gap-2">
					<AlertCircle className="h-4 w-4" />
					Report Item
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl">
				<DialogHeader>
					<DialogTitle>Report Lost or Found Item</DialogTitle>
					<DialogDescription>
						Help the community by reporting items you've lost or found around campus.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="grid gap-2">
							<Label>Type</Label>
							<Select
								value={formData.type}
								onValueChange={(val) => handleChange('type', val as ListingType)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select Type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="LOST">Lost Item</SelectItem>
									<SelectItem value="FOUND">Found Item</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="date">Date</Label>
							<Input
								id="date"
								placeholder="e.g. Today, 10 AM"
								value={formData.date}
								onChange={(e) => handleChange('date', e.target.value)}
							/>
						</div>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="title">What is it?</Label>
						<Input
							id="title"
							placeholder="e.g. Blue Hydro Flask"
							value={formData.title}
							onChange={(e) => handleChange('title', e.target.value)}
						/>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="location">Where?</Label>
						<Input
							id="location"
							placeholder="e.g. Library 2nd Floor"
							value={formData.location}
							onChange={(e) => handleChange('location', e.target.value)}
						/>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="description">Description & Contact Info</Label>
						<Textarea
							id="description"
							placeholder="Describe the item and how to contact you..."
							value={formData.description}
							onChange={(e) => handleChange('description', e.target.value)}
						/>
					</div>

					<div className="grid gap-2">
						<Label>Photo (Optional)</Label>
						<div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors">
							<div className="h-8 w-8 text-muted-foreground mb-1 flex items-center justify-center bg-muted rounded-full">
								<ImagePlus className="h-4 w-4" />
							</div>
							<p className="text-xs text-muted-foreground">Upload Image</p>
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button type="submit" className="w-full" onClick={handleSubmit} disabled={loading}>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Submit Report
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
