import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Category {
	id: string;
	label: string;
}

interface NewsCategoryListProps {
	activeCategory: string;
	onSelect: (id: string) => void;
}

export function NewsCategoryList({ activeCategory, onSelect }: NewsCategoryListProps) {
	const categories: Category[] = [
		{ id: "all", label: "All News" },
		{ id: "academic", label: "Academics" },
		{ id: "events", label: "Events" },
		{ id: "social", label: "Social" },
		{ id: "marketplace", label: "Marketplace" },
		{ id: "career", label: "Career" },
		{ id: "general", label: "General" },
	];

	return (
		<div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
			{categories.map((category) => (
				<Button
					key={category.id}
					variant={activeCategory === category.id ? "default" : "outline"}
					className={cn(
						"rounded-full px-6 transition-all whitespace-nowrap",
						activeCategory === category.id
							? "shadow-md scale-105"
							: "bg-card/50 hover:bg-card border-border/50"
					)}
					onClick={() => onSelect(category.id)}
				>
					{category.label}
				</Button>
			))}
		</div>
	);
}
