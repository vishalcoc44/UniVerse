
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
import { ImagePlus, Plus, Loader2, X, School, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createListing, updateListing } from "@/app/marketplace/actions";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface ListingToEdit {
	id: string;
	title: string;
	price: number;
	category: string;
	description: string;
	scope?: 'CAMPUS' | 'UNIVERSE';
	imageUrl?: string;
}

interface SellModalProps {
	onListingCreated?: () => void;
	listingToEdit?: ListingToEdit;
	activeScope?: 'campus' | 'universe';
	isOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function SellModal({ onListingCreated, listingToEdit, activeScope = 'campus', isOpen, onOpenChange }: SellModalProps) {
	const isEditMode = !!listingToEdit;
	const [internalOpen, setInternalOpen] = useState(false);
	const open = isOpen !== undefined ? isOpen : internalOpen;
	const setOpen = onOpenChange ?? setInternalOpen;

	const [loading, setLoading] = useState(false);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [formData, setFormData] = useState({
		title: "",
		price: "",
		category: "",
		description: "",
		imageUrl: "",
		scope: (activeScope?.toUpperCase() as 'CAMPUS' | 'UNIVERSE') || 'CAMPUS',
	});

	useEffect(() => {
		if (listingToEdit) {
			setFormData({
				title: listingToEdit.title,
				price: String(listingToEdit.price),
				category: listingToEdit.category,
				description: listingToEdit.description,
				imageUrl: listingToEdit.imageUrl || "",
				scope: listingToEdit.scope || "CAMPUS",
			});
			setImagePreview(listingToEdit.imageUrl || null);
		} else {
			setFormData(prev => ({
				...prev,
				scope: (activeScope?.toUpperCase() as 'CAMPUS' | 'UNIVERSE') || 'CAMPUS'
			}));
		}
	}, [listingToEdit, activeScope]);

	const handleChange = (field: string, value: string) => {
		setFormData(prev => ({ ...prev, [field]: value }));
	};

	const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setImageFile(file);
		setImagePreview(URL.createObjectURL(file));
	};

	const uploadImage = async (): Promise<string | undefined> => {
		if (!imageFile) return formData.imageUrl || undefined;
		const ext = imageFile.name.split('.').pop();
		const path = `marketplace/${crypto.randomUUID()}.${ext}`;
		const { error } = await supabase.storage.from('post-images').upload(path, imageFile, { upsert: true });
		if (error) throw new Error(`Image upload failed: ${error.message}`);
		const { data } = supabase.storage.from('post-images').getPublicUrl(path);
		return data.publicUrl;
	};

	const handleSubmit = async () => {
		if (!formData.title || !formData.price || !formData.description) {
			toast.error("Please fill in all required fields.");
			return;
		}

		setLoading(true);
		try {
			const imageUrl = await uploadImage();

			if (isEditMode && listingToEdit) {
				const result = await updateListing(listingToEdit.id, {
					title: formData.title,
					price: parseFloat(formData.price),
					description: formData.description,
					category: formData.category,
					scope: formData.scope,
					imageUrl,
				});
				if (!result.success) throw new Error(result.error);
				toast.success("Listing updated successfully!");
			} else {
				const result = await createListing({
					title: formData.title,
					price: parseFloat(formData.price),
					description: formData.description,
					type: 'SELL',
					category: formData.category,
					scope: formData.scope,
					imageUrl,
				});
				if (!result.success) throw new Error(result.error);
				toast.success("Listing created successfully!");
			}

			setOpen(false);
			setFormData({ title: "", price: "", category: "", description: "", imageUrl: "", scope: "CAMPUS" });
			setImageFile(null);
			setImagePreview(null);
			if (onListingCreated) onListingCreated();

		} catch (error: any) {
			console.error("Error saving listing:", error);
			toast.error(error?.message || "Failed to save listing.");
		} finally {
			setLoading(false);
		}
	};

	const dialogContent = (
		<DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl">
			<DialogHeader className="space-y-1">
				<DialogTitle>{isEditMode ? "Edit Listing" : "List an Item for Sale"}</DialogTitle>
				<DialogDescription className="text-xs">
					{isEditMode ? "Update your listing details." : "Add details about what you're selling."}
				</DialogDescription>
			</DialogHeader>
			<div className="grid gap-3 py-2">
				<div className="flex gap-3">
					<div className="flex-1 space-y-1.5">
						<Label htmlFor="title" className="text-sm">Title</Label>
						<Input
							id="title"
							placeholder="Calculus Textbook"
							className="h-9"
							value={formData.title}
							onChange={(e) => handleChange('title', e.target.value)}
						/>
					</div>
					<div className="w-24 space-y-1.5">
						<Label htmlFor="price" className="text-sm">Price ($)</Label>
						<Input
							id="price"
							type="number"
							placeholder="0.00"
							className="h-9"
							value={formData.price}
							onChange={(e) => handleChange('price', e.target.value)}
						/>
					</div>
				</div>
				<div className="grid grid-cols-1 gap-1.5">
					<Label className="text-sm">Category</Label>
					<Select value={formData.category} onValueChange={(val) => handleChange('category', val)}>
						<SelectTrigger className="h-9">
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
				<div className="grid gap-1.5">
					<Label htmlFor="description" className="text-sm">Description</Label>
					<Textarea
						id="description"
						placeholder="Condition, pickup location..."
						className="min-h-[70px] resize-none py-2"
						value={formData.description}
						onChange={(e) => handleChange('description', e.target.value)}
					/>
				</div>

				<div className="grid gap-1.5">
					<Label className="text-sm">Photo</Label>
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						className="hidden"
						onChange={handleImageSelect}
					/>
					{imagePreview ? (
						<div className="relative rounded-lg overflow-hidden aspect-[16/6] bg-muted">
							<img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
							<Button
								size="icon"
								variant="secondary"
								className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 text-white"
								onClick={() => { setImageFile(null); setImagePreview(null); handleChange('imageUrl', ''); }}
							>
								<X className="h-3 w-3" />
							</Button>
						</div>
					) : (
						<div
							className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
							onClick={() => fileInputRef.current?.click()}
						>
							<div className="h-8 w-8 text-muted-foreground mb-1 flex items-center justify-center bg-muted rounded-full">
								<ImagePlus className="h-4 w-4" />
							</div>
							<p className="text-[10px] text-muted-foreground">Click to upload photo</p>
						</div>
					)}
				</div>

				<div className="grid gap-1.5 pt-1">
					<Label className="text-sm">Visibility Scope</Label>
					<div className="grid grid-cols-2 gap-2 bg-muted/30 p-1 rounded-lg border border-border/50">
						<button
							type="button"
							onClick={() => setFormData(p => ({ ...p, scope: 'CAMPUS' }))}
							className={cn(
								"flex items-center justify-center gap-2 py-1.5 px-3 text-xs font-medium rounded-md transition-all",
								formData.scope === 'CAMPUS' 
									? "bg-background text-primary shadow-sm"
									: "text-muted-foreground hover:text-foreground"
							)}
						>
							<School className="h-3.5 w-3.5" />
							My Campus
						</button>
						<button
							type="button"
							onClick={() => setFormData(p => ({ ...p, scope: 'UNIVERSE' }))}
							className={cn(
								"flex items-center justify-center gap-2 py-1.5 px-3 text-xs font-medium rounded-md transition-all",
								formData.scope === 'UNIVERSE'
									? "bg-background text-primary shadow-sm"
									: "text-muted-foreground hover:text-foreground"
							)}
						>
							<Globe className="h-3.5 w-3.5" />
							Across Universe
						</button>
					</div>
				</div>
			</div>
			<DialogFooter className="pt-2">
				<Button type="submit" className="w-full h-10" onClick={handleSubmit} disabled={loading}>
					{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					{isEditMode ? "Save Changes" : "Post Listing"}
				</Button>
			</DialogFooter>
		</DialogContent>
	);

	if (isEditMode) {
		return (
			<Dialog open={open} onOpenChange={setOpen}>
				{dialogContent}
			</Dialog>
		);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="gap-2">
					<Plus className="h-4 w-4" />
					List Item
				</Button>
			</DialogTrigger>
			{dialogContent}
		</Dialog>
	);
}
