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
import { ImagePlus, Plus } from "lucide-react";

export function SellModal() {
	return (
		<Dialog>
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
						<Input id="title" placeholder="e.g., Calculus Textbook (8th Ed)" />
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="grid gap-2">
							<Label htmlFor="price">Price ($)</Label>
							<Input id="price" type="number" placeholder="0.00" />
						</div>
						<div className="grid gap-2">
							<Label>Category</Label>
							<Select>
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
						<Textarea id="description" placeholder="Describe condition, pickup location, etc." />
					</div>

					<div className="grid gap-2">
						<Label>Photos</Label>
						<div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors">
							<div className="h-10 w-10 text-muted-foreground mb-2 flex items-center justify-center bg-muted rounded-full">
								<ImagePlus className="h-5 w-5" />
							</div>
							<p className="text-sm text-muted-foreground">Click to upload images</p>
							<p className="text-xs text-muted-foreground/70 mt-1">PNG, JPG up to 5MB</p>
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button type="submit" className="w-full">Post Listing</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
