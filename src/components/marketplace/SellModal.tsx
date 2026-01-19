
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
import { ImagePlus, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { createListing } from "@/app/marketplace/actions";
import { toast } from "sonner";

interface SellModalProps {
	onListingCreated?: () => void;
}

export function SellModal({ onListingCreated }: SellModalProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		title: "",
		price: "",
		category: "", // Currently this field isn't in schema, schema has 'type'. We'll put category in description or ignore for now.
		description: "",
	});

	const handleChange = (field: string, value: string) => {
		setFormData(prev => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async () => {
		if (!formData.title || !formData.price || !formData.description) {
			toast.error("Please fill in all required fields.");
			return;
		}

		setLoading(true);
		try {
			const result = await createListing({
				title: formData.title,
				price: parseFloat(formData.price),
				description: formData.description,
				type: 'SELL',
				category: formData.category,
				// imageUrl: ... // Handle image upload if implemented
			});

			if (!result.success) {
				throw new Error(result.error);
			}

			toast.success("Listing created successfully!");
			setOpen(false);
			setFormData({ title: "", price: "", category: "", description: "" });
			if (onListingCreated) onListingCreated();

		} catch (error) {
			console.error("Error creating listing:", error);
			toast.error("Failed to create listing.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="gap-2">
					<Plus className="h-4 w-4" />
					List Item
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl">
				<DialogHeader>
					<DialogTitle>List an Item for Sale</DialogTitle>
					<DialogDescription>
						Add details about what you're selling. Verified students get priority listing.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="title">Title</Label>
						<Input
							id="title"
							placeholder="e.g., Calculus Textbook (8th Ed)"
							value={formData.title}
							onChange={(e) => handleChange('title', e.target.value)}
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="grid gap-2">
							<Label htmlFor="price">Price ($)</Label>
							<Input
								id="price"
								type="number"
								placeholder="0.00"
								value={formData.price}
								onChange={(e) => handleChange('price', e.target.value)}
							/>
						</div>
						<div className="grid gap-2">
							<Label>Category</Label>
							<Select onValueChange={(val) => handleChange('category', val)}>
								<SelectTrigger>
									<SelectValue placeholder="Select" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="textbooks">Textbooks</SelectItem>
									<SelectItem value="electronics">Electronics</SelectItem>
									<SelectItem value="furniture">Furniture</SelectItem>
									<SelectItem value="clothing">Clothing</SelectItem>
									<SelectItem value="other">Other</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							placeholder="Describe condition, pickup location, etc."
							value={formData.description}
							onChange={(e) => handleChange('description', e.target.value)}
						/>
					</div>

					<div className="grid gap-2">
						<Label>Photos</Label>
						<div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors">
							<div className="h-10 w-10 text-muted-foreground mb-2 flex items-center justify-center bg-muted rounded-full">
								<ImagePlus className="h-5 w-5" />
							</div>
							<p className="text-sm text-muted-foreground">Click to upload images (Not implemented)</p>
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button type="submit" className="w-full" onClick={handleSubmit} disabled={loading}>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Post Listing
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
