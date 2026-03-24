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
  Globe,
  School,
  Repeat2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { PollCard } from "@/components/feed/PollCard";

const EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🔥"];

interface PollData {
  id: string;
  question: string;
  options: { id: string; text: string; displayOrder: number }[];
  votes: { optionId: string; userId?: string }[];
}

interface QuotedPost {
  id: string;
  content: string;
  author: { fullName: string; avatarUrl: string | null; username: string };
}

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
  currentUserRole?: string;
  viewCount?: number;
  reactions?: { emoji: string; count: number; userReacted: boolean }[];
  poll?: PollData | null;
  quotedPost?: QuotedPost | null;
  isPinned?: boolean;
  onLike?: (id: string) => void;
  onBookmark?: (id: string) => void;
  onDelete?: (id: string) => void;
  onComment?: (id: string) => void;
  onConnect?: (userId: string) => void;
  onReact?: (id: string, emoji: string) => void;
  onRepost?: (id: string, quoteText: string) => void;
  onHashtagClick?: (tag: string) => void;
  onPollVoted?: () => void;
  onPin?: (id: string, isPinned: boolean) => void;
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
  currentUserRole,
  viewCount = 0,
  reactions = [],
  poll,
  quotedPost,
  onLike,
  onBookmark,
  onDelete,
  onComment,
  onConnect,
  onReact,
  onRepost,
  onHashtagClick,
  onPollVoted,
  isPinned = false,
  onPin,
}: PostCardProps) {
  const isAuthor = currentUserId === author.id;
  const isAdmin = currentUserRole === "ADMIN";
  const canPin = isAuthor || isAdmin;

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showRepostBox, setShowRepostBox] = useState(false);
  const [quoteText, setQuoteText] = useState("");
  const [carouselIndex, setCarouselIndex] = useState(0);

  const images = useMemo(() => {
    if (!image) return [];
    return image.split(",").map((s) => s.trim()).filter(Boolean);
  }, [image]);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const textToShare = `${author.name} posted: "${content}"`;
    navigator.clipboard.writeText(textToShare).then(() => alert("Post content copied to clipboard!"));
  };

  const handleReactClick = (emoji: string) => {
    setShowEmojiPicker(false);
    onReact?.(id, emoji);
  };

  const handleRepost = () => {
    onRepost?.(id, quoteText);
    setShowRepostBox(false);
    setQuoteText("");
  };

  const categoryStyles = useMemo(() => {
    switch (category) {
      case "Academic": return "bg-pastel-sky/20 text-pastel-sky-dark border-pastel-sky/30";
      case "Events": return "bg-pastel-rose/20 text-pastel-rose-dark border-pastel-rose/30";
      case "Marketplace": return "bg-pastel-amber/20 text-pastel-amber-dark border-pastel-amber/30";
      case "Career": return "bg-pastel-mint/20 text-pastel-mint-dark border-pastel-mint/30";
      case "Social": return "bg-purple-500/10 text-purple-600 border-purple-200/50";
      default: return "bg-muted/50 text-muted-foreground border-border/50";
    }
  }, [category]);

  const topReaction = reactions.sort((a, b) => b.count - a.count)[0];

  const renderContentParts = (text: string) => {
    const parts = text.split(/(#[a-z0-9_]+)/gi);
    return parts.map((part, i) =>
      /^#[a-z0-9_]+$/i.test(part) ? (
        <span
          key={i}
          className="text-primary font-bold hover:underline cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onHashtagClick?.(`#${part.slice(1)}`); }}
        >
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="group/card">
      <Card className="p-0 overflow-hidden shadow-sm border-border/40 bg-card/40 backdrop-blur-xl mb-3 hover:bg-card/60 transition-all duration-300 rounded-xl group-hover/card:shadow-md">
        <div className="p-3 pb-2 flex gap-3">
          <div className="relative">
            <Avatar className="h-8 w-8 border border-background shadow-sm transition-transform duration-300">
              <AvatarImage src={author.avatar} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary font-bold uppercase text-[10px]">{author.name[0]}</AvatarFallback>
            </Avatar>
            <div className={cn("absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border border-background flex items-center justify-center text-[7px] shadow-md", scope === "campus" ? "bg-primary text-white" : "bg-violet-500 text-white")}>
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
                  {isPinned && <span className="text-[9px] text-primary flex items-center gap-0.5 font-bold uppercase"><Bookmark className="h-2.5 w-2.5 fill-current" /> Pinned</span>}
                  {isAuthor && viewCount > 0 && (
                    <span className="text-[9px] text-muted-foreground/40 flex items-center gap-0.5">
                      <Eye className="h-2.5 w-2.5" />{viewCount}
                    </span>
                  )}
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
                    <Share2 className="h-3 w-3 mr-2" /><span className="font-semibold text-[11px]">Share</span>
                  </DropdownMenuItem>
                  {onPin && canPin && (
                    <DropdownMenuItem onClick={() => onPin(id, !isPinned)} className="rounded-md py-1.5 focus:bg-primary/10 cursor-pointer">
                      <Bookmark className={cn("h-3 w-3 mr-2", isPinned && "fill-current")} /><span className="font-semibold text-[11px]">{isPinned ? 'Unpin Post' : 'Pin Post'}</span>
                    </DropdownMenuItem>
                  )}
                  {isAuthor && onDelete && (
                    <>
                      <div className="h-px bg-border/50 my-1 mx-1" />
                      <DropdownMenuItem onClick={() => onDelete(id)} className="rounded-md py-1.5 focus:bg-destructive/10 text-destructive focus:text-destructive cursor-pointer">
                        <Trash2 className="h-3 w-3 mr-2" /><span className="font-bold text-[11px]">Delete</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="px-3 pb-3 pl-3">
          {/* Content with clickable hashtags */}
          <p className="text-foreground/90 leading-snug font-medium text-[13px] whitespace-pre-wrap mb-2 tracking-tight">
            {renderContentParts(content)}
          </p>

          {/* Quoted Post (Repost) */}
          {quotedPost && quotedPost.author && (
            <div className="mt-2 mb-2 border border-border/40 rounded-xl p-3 bg-muted/20 text-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={quotedPost.author.avatarUrl || ''} />
                  <AvatarFallback>{quotedPost.author.fullName?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <span className="font-bold text-[11px]">{quotedPost.author.fullName}</span>
                <span className="text-muted-foreground text-[10px]">@{quotedPost.author.username}</span>
              </div>
              <p className="text-[12px] text-foreground/70 line-clamp-3">{quotedPost.content}</p>
            </div>
          )}

          {/* Image Carousel */}
          {images.length === 1 && (
            <div className="mt-2 rounded-lg overflow-hidden border border-border/50 bg-muted/20">
              <img src={images[0]} alt="Post content" className="w-full h-auto object-cover max-h-[300px] transition-all duration-700 hover:scale-105" />
            </div>
          )}
          {images.length > 1 && (
            <div className="mt-2 relative rounded-lg overflow-hidden border border-border/50 bg-muted/20 group/carousel">
              <div className="relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={carouselIndex}
                    src={images[carouselIndex]}
                    alt={`Slide ${carouselIndex + 1}`}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                    className="w-full h-auto object-cover max-h-[300px]"
                  />
                </AnimatePresence>
                <button onClick={() => setCarouselIndex(i => (i - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover/carousel:opacity-100 transition-opacity">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setCarouselIndex(i => (i + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover/carousel:opacity-100 transition-opacity">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setCarouselIndex(i)} className={cn("h-1.5 w-1.5 rounded-full transition-all", i === carouselIndex ? "bg-white w-3" : "bg-white/50")} />
                ))}
              </div>
            </div>
          )}

          {/* Poll */}
          {poll && (
            <PollCard
              pollId={poll.id}
              question={poll.question}
              options={poll.options}
              votes={poll.votes as any}
              currentUserId={currentUserId}
              postId={id}
              onVoted={onPollVoted}
            />
          )}

          {/* Emoji Reactions summary */}
          {reactions.filter(r => r.count > 0).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {reactions.filter(r => r.count > 0).map(r => (
                <button
                  key={r.emoji}
                  onClick={() => onReact?.(id, r.emoji)}
                  className={cn("flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border transition-all", r.userReacted ? "border-primary/40 bg-primary/10 text-primary" : "border-border/30 bg-muted/30 text-muted-foreground hover:border-primary/30")}
                >
                  {r.emoji} <span>{r.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Repost box */}
          {showRepostBox && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 border border-border/40 rounded-xl p-3 bg-muted/10 space-y-2">
              <textarea
                value={quoteText}
                onChange={e => setQuoteText(e.target.value)}
                placeholder="Add your comment... (optional)"
                className="w-full bg-transparent resize-none text-sm placeholder:text-muted-foreground/40 focus:outline-none min-h-[60px]"
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setShowRepostBox(false)} className="rounded-full text-xs">Cancel</Button>
                <Button size="sm" onClick={handleRepost} className="rounded-full text-xs bg-primary text-white">Repost</Button>
              </div>
            </motion.div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-border/5">
            <div className="flex items-center gap-0.5 relative">
              {/* Emoji Reaction Button */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("group h-8 px-2 rounded-lg transition-all duration-300 font-bold", topReaction?.userReacted ? "bg-pastel-rose/20 text-pastel-rose-dark" : isLiked ? "bg-pastel-rose/20 text-pastel-rose-dark" : "text-muted-foreground/60 hover:text-pastel-rose-dark hover:bg-pastel-rose/10")}
                  onClick={() => setShowEmojiPicker(v => !v)}
                >
                  <Heart className={cn("h-3.5 w-3.5 mr-1.5 transition-transform duration-300", (isLiked || topReaction?.userReacted) && "fill-current scale-110")} />
                  <span className="text-[11px]">{stats.likes + reactions.reduce((acc, r) => acc + r.count, 0)}</span>
                </Button>

                {/* Emoji Picker Float */}
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: 5, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-0 mb-2 bg-card/95 backdrop-blur-xl border border-border/40 rounded-2xl shadow-xl p-2 flex gap-1 z-50"
                    >
                      {EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => handleReactClick(emoji)}
                          className="text-xl hover:scale-125 transition-transform hover:bg-muted/50 rounded-xl p-1"
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="group h-8 px-2 rounded-lg text-muted-foreground/60 hover:text-pastel-sky-dark hover:bg-pastel-sky/10 transition-all font-bold"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onComment?.(id); }}
              >
                <MessageCircle className="h-4 w-4 mr-1.5" />
                <span className="text-xs">{stats.comments}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="group h-8 px-2 rounded-lg text-muted-foreground/60 hover:text-green-600 hover:bg-green-500/10 transition-all font-bold"
                onClick={(e) => { e.stopPropagation(); setShowRepostBox(v => !v); }}
              >
                <Repeat2 className="h-4 w-4" />
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
