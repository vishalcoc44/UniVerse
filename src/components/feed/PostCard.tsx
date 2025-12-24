import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostCardProps {
  author: {
    name: string;
    handle: string;
    avatar: string;
    role?: string;
  };
  content: string;
  image?: string;
  timestamp: string;
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  tags?: string[];
  feedType?: "campus" | "universe";
}

export function PostCard({ author, content, image, timestamp, stats, tags, feedType = "campus" }: PostCardProps) {
  return (
    <Card className="p-0 overflow-hidden shadow-card border-none bg-card/40 backdrop-blur-sm mb-4 hover:bg-card/60 transition-colors">
      <div className="p-4 pb-2 flex gap-3">
        <Avatar className="h-10 w-10 border border-border">
          <AvatarImage src={author.avatar} />
          <AvatarFallback>{author.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm text-foreground">{author.name}</h4>
              <span className="text-muted-foreground text-xs">@{author.handle}</span>
              <span className="text-muted-foreground text-[10px]">•</span>
              <span className="text-muted-foreground text-xs">{timestamp}</span>
            </div>
            <button className="text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
          {author.role && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal mt-0.5 bg-muted/50 text-muted-foreground">
              {author.role}
            </Badge>
          )}
        </div>
      </div>

      <div className="px-4 pb-3 pl-[4.25rem]">
        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap mb-3">
          {content}
        </p>

        {image && (
          <div className="rounded-xl overflow-hidden mb-3 border border-border/50">
            <img src={image} alt="Post content" className="w-full h-auto object-cover max-h-[400px]" />
          </div>
        )}

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map(tag => (
              <span key={tag} className="text-xs text-primary hover:underline cursor-pointer">#{tag}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border/30 -ml-2">
          <Button variant="ghost" size="sm" className="group text-muted-foreground hover:text-pastel-rose-dark gap-1.5 h-8">
            <div className="p-1.5 rounded-full group-hover:bg-pastel-rose/20 transition-colors">
              <Heart className="h-4 w-4" />
            </div>
            <span className="text-xs">{stats.likes}</span>
          </Button>

          <Button variant="ghost" size="sm" className="group text-muted-foreground hover:text-pastel-sky-dark gap-1.5 h-8">
            <div className="p-1.5 rounded-full group-hover:bg-pastel-sky/20 transition-colors">
              <MessageCircle className="h-4 w-4" />
            </div>
            <span className="text-xs">{stats.comments}</span>
          </Button>

          <Button variant="ghost" size="sm" className="group text-muted-foreground hover:text-pastel-mint-dark gap-1.5 h-8">
            <div className="p-1.5 rounded-full group-hover:bg-pastel-mint/20 transition-colors">
              <Share2 className="h-4 w-4" />
            </div>
            <span className="text-xs">{stats.shares}</span>
          </Button>

          <Button variant="ghost" size="sm" className="group text-muted-foreground hover:text-primary gap-1.5 h-8">
            <div className="p-1.5 rounded-full group-hover:bg-primary/10 transition-colors">
              <Bookmark className="h-4 w-4" />
            </div>
          </Button>
        </div>
      </div>
    </Card>
  );
}
