import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Github, Music, Coffee, Monitor } from "lucide-react";

interface Discount {
    id: string;
    title: string;
    brand: string;
    icon: React.ElementType;
    offer: string;
    code?: string;
    category: string;
    link: string;
    color: string;
}

const discounts: Discount[] = [
    {
        id: "1",
        title: "Student Developer Pack",
        brand: "GitHub",
        icon: Github,
        offer: "Free Pro tier + $200 credits",
        category: "Software",
        link: "#",
        color: "bg-slate-900 border-slate-800"
    },
    {
        id: "2",
        title: "Premium Student",
        brand: "Spotify + Hulu",
        icon: Music,
        offer: "$4.99/mo for both",
        category: "Entertainment",
        link: "#",
        color: "bg-green-500/10 text-green-600 border-green-500/20"
    },
    {
        id: "3",
        title: "Education Store",
        brand: "Apple",
        icon: Monitor,
        offer: "$100 Gift Card + 10% Off",
        category: "Tech",
        link: "#",
        color: "bg-neutral-100 dark:bg-neutral-800 border-neutral-200"
    },
    {
        id: "4",
        title: "Student Coffee Club",
        brand: "Campus Brew",
        icon: Coffee,
        offer: "20% Off all drinks",
        code: "UNIVERSE24",
        category: "Food",
        link: "#",
        color: "bg-orange-950/10 text-orange-700 border-orange-900/10"
    }
];

export function DiscountHub() {
    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    Discounts & Perks
                </CardTitle>
                <CardDescription>Exclusive deals with your university email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {discounts.map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/40 hover:bg-background/60 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${deal.color}`}>
                                <deal.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">{deal.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{deal.brand}</span>
                                    <span className="text-primary font-medium">• {deal.offer}</span>
                                </div>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
