import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Bookmark,
  Trash2,
  UserPlus,
  Globe,
  School,
  Eye,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { useMemo } from "react";

interface PostCardProps {
  id: string;
  author: { id: string; name: string; handle: string; avatar: string; role?: string };
  content: string;
  image?: string;
  timestamp: string;
  stats: { likes: number; comments: number; shares: number };
  tags?: string[];
  scope?: "campus" | "universe";
  category?: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
  currentUserId?: string;
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
  onConnect,
}: PostCardProps) {
  const isAuthor = currentUserId === author.id;

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const textToShare = `${author.name} posted: "${content}"`;
    navigator.clipboard.writeText(textToShare).then(() => alert("Post content copied to clipboard!"));
  };

  const categoryStyles = useMemo(() => {
    switch (category) {
      case "Academic":
        return "bg-pastel-sky/20 text-pastel-sky-dark border-pastel-sky/30 shadow-pastel-sky/5";
      case "Events":
        return "bg-pastel-rose/20 text-pastel-rose-dark border-pastel-rose/30 shadow-pastel-rose/5";
      case "Marketplace":
        return "bg-pastel-amber/20 text-pastel-amber-dark border-pastel-amber/30 shadow-pastel-amber/5";
      case "Career":
        return "bg-pastel-mint/20 text-pastel-mint-dark border-pastel-mint/30 shadow-pastel-mint/5";
      case "Social":
        return "bg-purple-500/10 text-purple-600 border-purple-200/50";
      default:
        return "bg-muted/50 text-muted-foreground border-border/50";
    }
  }, [category]);

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="group/card">
      <Card className="p-0 overflow-hidden shadow-sm border-border/40 bg-card/40 backdrop-blur-xl mb-3 hover:bg-card/60 transition-all duration-300 rounded-xl group-hover/card:shadow-md">
        <div className="p-3 pb-2 flex gap-3">
          <div className="relative">
            <Avatar className="h-8 w-8 border border-background shadow-sm transition-transform duration-300">
              <AvatarImage src={author.avatar} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary font-bold uppercase text-[10px]">{author.name[0]}</AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border border-background flex items-center justify-center text-[7px] shadow-md",
                scope === "campus" ? "bg-primary text-white" : "bg-violet-500 text-white"
              )}
            >
              {scope === "campus" ? <School className="h-2 w-2" /> : <Globe className="h-2 w-2" />}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-[13px] font-bold tracking-tight hover:text-primary transition-colors cursor-pointer leading-tight">{author.name}</h4>
                  <span className="text-muted-foreground/50 text-[10px] font-medium tracking-tight">@{author.handle}</span>
                  {isAuthor && <Badge variant="outline" className="text-[7px] font-bold uppercase py-0 h-3 border-primary/20 text-primary bg-primary/5 px-1">You</Badge>}
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  {author.role && <p className="text-[9px] font-medium text-muted-foreground/40 uppercase tracking-widest">{author.role}</p>}
                  <span className="text-muted-foreground/30 text-[9px] font-bold tracking-widest">{timestamp}</span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-primary/5 text-muted-foreground/40 hover:text-primary transition-colors">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 p-1 rounded-lg border-border/50 backdrop-blur-xl bg-background/95 shadow-lg">
                  <DropdownMenuItem onClick={handleShare} className="rounded-md py-1.5 focus:bg-primary/10 cursor-pointer">
                    <Share2 className="h-3 w-3 mr-2" /> <span className="font-semibold text-[11px] tracking-tight">Share</span>
                  </DropdownMenuItem>
                  {isAuthor && onDelete && (
                    <>
                      <div className="h-px bg-border/50 my-1 mx-1" />
                      <DropdownMenuItem onClick={() => onDelete(id)} className="rounded-md py-1.5 focus:bg-destructive/10 text-destructive focus:text-destructive cursor-pointer group/item">
                        <Trash2 className="h-3 w-3 mr-2 group-hover/item:scale-110 transition-all font-bold" /> <span className="font-bold text-[11px] tracking-tight">Delete</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="px-3 pb-3 pl-3">
          <p
            className="text-foreground/90 leading-snug font-medium text-[13px] whitespace-pre-wrap mb-2 tracking-tight"
            dangerouslySetInnerHTML={{ __html: content.replace(/(#[a-z0-9]+)/gi, '<span class="text-primary font-bold hover:underline cursor-pointer">$1</span>') }}
          />

          {image && (
            <div className="mt-2 rounded-lg overflow-hidden border border-border/50 group/img relative bg-muted/20">
              <img src={image} alt="Post content" className="w-full h-auto object-cover max-h-[300px] transition-all duration-700 group-hover/img:scale-105" />
            </div>
          )}

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 my-2">
              {tags.map((tag) => (
                <span key={tag} className="text-[9px] font-bold tracking-tight text-primary hover:text-primary/70 cursor-pointer transition-colors uppercase">#{tag}</span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/5">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn("group h-8 px-2.5 rounded-lg transition-all duration-300 font-bold", isLiked ? "bg-pastel-rose/20 text-pastel-rose-dark" : "text-muted-foreground/60 hover:text-pastel-rose-dark hover:bg-pastel-rose/10")}
                onClick={() => onLike && onLike(id)}
              >
                <Heart className={cn("h-3.5 w-3.5 mr-1.5 transition-transform duration-300", isLiked && "fill-current scale-110")} />
                <span className="text-[11px]">{stats.likes}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="group h-8 px-2.5 rounded-lg text-muted-foreground/60 hover:text-pastel-sky-dark hover:bg-pastel-sky/10 transition-all font-bold"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onComment?.(id);
                }}
              >
                <MessageCircle className="h-4 w-4 mr-1.5" />
                <span className="text-xs">{stats.comments}</span>
              </Button>

              <Button variant="ghost" size="sm" className="group h-8 w-8 p-0 rounded-full text-muted-foreground/60 hover:text-pastel-mint-dark hover:bg-pastel-mint/10 transition-all" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className={cn("h-9 w-9 rounded-full transition-all duration-300", isBookmarked ? "text-primary bg-primary/10" : "text-muted-foreground/60 hover:text-primary hover:bg-primary/5")}
              onClick={() => onBookmark && onBookmark(id)}
            >
              <Bookmark className={cn("h-4 w-4 transition-transform duration-300", isBookmarked && "fill-current scale-110")} />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
