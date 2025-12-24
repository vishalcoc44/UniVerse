import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowBigDown, ArrowBigUp, Flag, MessageSquare, Share2, ShieldCheck, User } from "lucide-react";

const threads = [
  {
    id: 1,
    title: "Best resources for Advanced Algorithms (CS302)?",
    content: "I'm struggling with Dynamic Programming. Any YouTube channels or notes?",
    author: "Anonymous",
    flair: "Computer Science",
    votes: 45,
    comments: 12,
    time: "2h ago",
    verified: true,
  },
  {
    id: 2,
    title: "Is the cafeteria open on weekends?",
    content: "Just need to know if I can grab lunch there tomorrow.",
    author: "Campus Life",
    flair: "Question",
    votes: 12,
    comments: 3,
    time: "5h ago",
    verified: false,
  },
  {
    id: 3,
    title: "Confession: I haven't started my final project yet.",
    content: "It's due in 3 days. Am I cooked?",
    author: "Anonymous",
    flair: "Rant",
    votes: 156,
    comments: 42,
    time: "1d ago",
    verified: false,
  },
];

export function ThreadList() {
  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <Card key={thread.id} className="flex overflow-hidden transition-all hover:border-primary/20 bg-card/60 backdrop-blur-sm border-border/50">
          {/* Voting Column */}
          <div className="w-12 bg-muted/20 flex flex-col items-center p-2 gap-1 border-r border-border/50">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10">
              <ArrowBigUp className="h-6 w-6" />
            </Button>
            <span className="text-sm font-bold">{thread.votes}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10">
              <ArrowBigDown className="h-6 w-6" />
            </Button>
          </div>

          {/* Content Column */}
          <div className="flex-1 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
              <Badge variant="outline" className="bg-secondary/50 font-normal border-border">
                {thread.flair}
              </Badge>
              <span>• Posted by {thread.author}</span>
              <span>• {thread.time}</span>
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-1 leading-snug">
              {thread.title}
            </h3>
            <p className="text-sm text-muted-foreground/90 line-clamp-2 mb-3">
              {thread.content}
            </p>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground gap-1.5 hover:text-foreground">
                <MessageSquare className="h-4 w-4" />
                {thread.comments} Comments
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground gap-1.5 hover:text-foreground">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground gap-1.5 hover:text-red-500 hover:bg-red-500/10 ml-auto">
                <Flag className="h-3 w-3" />
                Report
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
