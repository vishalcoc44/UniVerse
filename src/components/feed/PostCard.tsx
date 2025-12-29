import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Trash2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner"; // Assuming sonner is installed as per summary, if not standard alert

interface PostCardProps {
  id: string;
  author: {
    id: string; // Needed for author check
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
  scope?: "campus" | "universe";
  category?: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
  currentUserId?: string; // To check ownership
  onLike?: (id: string) => void;
  onBookmark?: (id: string) => void;
  onDelete?: (id: string) => void;
  onComment?: (id: string) => void;
  onConnect?: (userId: string) => void;
}

export function PostCard({
  id,
  author,
  content,
  image,
  timestamp,
  stats,
  tags,
  scope = "campus",
  category = "General",
  isLiked,
  isBookmarked,
  currentUserId,
  onLike,
  onBookmark,
  onDelete,
  onComment,
  onConnect
}: PostCardProps) {

  const isAuthor = currentUserId === author.id;

  const handleShare = () => {
    // For now, copy simplistic text or a dummy link
    const textToShare = `${author.name} posted: "${content}"`;
    navigator.clipboard.writeText(textToShare).then(() => {
      // You might want to use a toast here
      alert("Post copied to clipboard!");
    });
  };

  return (
    <Card className="p-0 overflow-hidden shadow-card border-none bg-card/40 backdrop-blur-sm mb-4 hover:bg-card/60 transition-colors group/card">
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted/50 transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" /> Share
                </DropdownMenuItem>
                {isAuthor && onDelete && (
                  <DropdownMenuItem onClick={() => onDelete(id)} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                )}
                {!isAuthor && onConnect && (
                  <DropdownMenuItem onClick={() => onConnect(author.id)}>
                    <UserPlus className="mr-2 h-4 w-4" /> Connect
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {author.role && (
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-muted/50 text-muted-foreground">
                {author.role}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] h-5 px-1.5 font-medium border-none",
                category === "Academic" ? "bg-pastel-sky/30 text-pastel-sky-dark" :
                  category === "Events" ? "bg-pastel-rose/30 text-pastel-rose-dark" :
                    category === "Marketplace" ? "bg-pastel-amber/30 text-pastel-amber-dark" :
                      category === "Career" ? "bg-pastel-mint/30 text-pastel-mint-dark" :
                        category === "Social" ? "bg-purple-500/10 text-purple-600" :
                          "bg-muted/50 text-muted-foreground"
              )}
            >
              {category}
            </Badge>
          </div>
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
          <Button
            variant="ghost"
            size="sm"
            className={cn("group gap-1.5 h-8", isLiked ? "text-pastel-rose-dark" : "text-muted-foreground hover:text-pastel-rose-dark")}
            onClick={() => onLike && onLike(id)}
          >
            <div className={cn("p-1.5 rounded-full transition-colors", isLiked ? "bg-pastel-rose/20" : "group-hover:bg-pastel-rose/20")}>
              <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
            </div>
            <span className="text-xs">{stats.likes}</span>
          </Button>

          <Button variant="ghost" size="sm" className="group text-muted-foreground hover:text-pastel-sky-dark gap-1.5 h-8" onClick={() => onComment && onComment(id)}>
            <div className="p-1.5 rounded-full group-hover:bg-pastel-sky/20 transition-colors">
              <MessageCircle className="h-4 w-4" />
            </div>
            <span className="text-xs">{stats.comments}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="group text-muted-foreground hover:text-pastel-mint-dark gap-1.5 h-8"
            onClick={handleShare}
          >
            <div className="p-1.5 rounded-full group-hover:bg-pastel-mint/20 transition-colors">
              <Share2 className="h-4 w-4" />
            </div>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn("group gap-1.5 h-8", isBookmarked ? "text-primary" : "text-muted-foreground hover:text-primary")}
            onClick={() => onBookmark && onBookmark(id)}
          >
            <div className={cn("p-1.5 rounded-full transition-colors", isBookmarked ? "bg-primary/10" : "group-hover:bg-primary/10")}>
              <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
            </div>
          </Button>
        </div>
      </div>
    </Card>
  );
}
