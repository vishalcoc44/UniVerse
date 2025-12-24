import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileText, MoreVertical, Star, ThumbsUp, UploadCloud } from "lucide-react";

const resources = [
  {
    id: 1,
    title: "Data Structures & Algorithms - Complete Notes",
    author: "Alex Johnson",
    type: "PDF",
    size: "2.4 MB",
    likes: 124,
    downloads: 450,
    tags: ["CS301", "DSA", "Notes"],
    verified: true,
  },
  {
    id: 2,
    title: "Physics I - Midterm 2 Solution Set",
    author: "Maria Garcia",
    type: "PDF",
    size: "1.1 MB",
    likes: 89,
    downloads: 210,
    tags: ["PHY101", "Solutions"],
    verified: true,
  },
  {
    id: 3,
    title: "Calculus III - Cheat Sheet",
    author: "David Kim",
    type: "IMG",
    size: "500 KB",
    likes: 245,
    downloads: 890,
    tags: ["MAT201", "QuickRef"],
    verified: false,
  },
  {
    id: 4,
    title: "Intro to AI - Lecture Slides (Week 1-5)",
    author: "Prof. Smith",
    type: "PPT",
    size: "15 MB",
    likes: 56,
    downloads: 120,
    tags: ["CS405", "Slides"],
    verified: true,
  },
];

export function ResourceGrid() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Top Resources</h3>
          <p className="text-sm text-muted-foreground">Curated notes and papers from the community.</p>
        </div>
        <Button className="gap-2">
          <UploadCloud className="h-4 w-4" />
          Upload
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map((res) => (
          <Card key={res.id} className="p-4 hover:shadow-md transition-all group bg-card/50 backdrop-blur-sm border-border/50">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                  {res.type}
                </div>
                <div>
                  <h4 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {res.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{res.author}</span>
                    <span>•</span>
                    <span>{res.size}</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              {res.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 h-5 bg-muted/50 font-normal text-muted-foreground">
                  #{tag}
                </Badge>
              ))}
              {res.verified && (
                <Badge className="text-[10px] px-1.5 h-5 bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20 gap-1">
                  <Star className="h-2 w-2 fill-current" /> Verified
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  {res.likes}
                </div>
                <div className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
                  <Download className="h-3.5 w-3.5" />
                  {res.downloads}
                </div>
              </div>

              <Button variant="ghost" size="sm" className="h-7 text-xs hover:text-primary -mr-2">
                Download
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
