import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Copy, FileText, Mic, Paperclip, RefreshCw, Send, Sparkles, User, MoreVertical, Zap, Loader2, ChevronDown, CheckCircle2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { aiService, ChatMessage as AIChatMessage } from "@/lib/ai";
import { useUserUniversity } from "@/hooks/useUserUniversity";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { getOrCreateChat, saveChatMessage } from "@/app/academic/actions";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function ChatInterface() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your academic assistant. Whether you need help summarizing research, generating practice questions, or explaining complex topics, I'm here to help. What are we studying today?",
      timestamp: "00:01",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const { universityId } = useUserUniversity();
  const scrollRef = useRef<HTMLDivElement>(null);
  const EndOfMessagesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chat history
  useEffect(() => {
    const loadChat = async () => {
      const { success, chatId: id, messages: history } = await getOrCreateChat();
      if (success && id) {
        setChatId(id);
        if (history && history.length > 0) {
          const mapped: Message[] = history.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setMessages(mapped);
        }
      }
    };
    loadChat();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (EndOfMessagesRef.current) {
      EndOfMessagesRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping || !chatId) return;

    const userMsgContent = input;
    setInput(""); // Clear immediately for better UX
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Optimistic Update
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMsgContent,
      timestamp,
    };
    setMessages((prev) => [...prev, newMessage]);
    setIsTyping(true);

    // Save User Message
    saveChatMessage(chatId, 'user', userMsgContent);

    try {
      // Build history for AI context
      const historyItems = messages
        .filter(m => m.id !== "welcome")
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }));
      historyItems.push({ role: 'user', content: userMsgContent });

      // Call Server Action
      const { chatAction } = await import("@/app/academic/actions");
      const { success, response, error: chatError } = await chatAction(historyItems);

      if (!success || !response) throw new Error(chatError || "Failed to get AI response");

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiResponse]);

      // Save AI Message
      await saveChatMessage(chatId, 'assistant', response);

    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !universityId || !chatId) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.txt')) {
      toast.error("Please upload a PDF or text file for RAG analysis.");
      return;
    }

    setIsUploading(true);
    setIsTyping(true);

    const tempId = "uploading-" + Date.now();
    setMessages(prev => [...prev, {
      id: tempId,
      role: "assistant",
      content: `Reading and analyzing **${file.name}**... one moment please.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    try {
      const { data: courses } = await supabase
        .from('Course')
        .select('id')
        .eq('universityId', universityId)
        .limit(1);

      if (!courses || courses.length === 0) {
        throw new Error("No courses found. Please add a course to your university first.");
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `chat-temp/${chatId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('academic-resources')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('academic-resources')
        .getPublicUrl(filePath);

      const { createResource } = await import("@/app/academic/actions");

      const { success, error: dbError } = await createResource({
        title: file.name,
        fileUrl: publicUrl,
        type: 'NOTE',
        courseId: courses[0].id,
        universityId
      });

      if (!success) throw new Error(dbError);

      setMessages(prev => prev.map(m => m.id === tempId ? {
        ...m,
        content: `I've successfully analyzed **${file.name}**. You can now ask me questions about its content!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      } : m));

      await saveChatMessage(chatId, 'assistant', `I've successfully analyzed ${file.name}.`);

    } catch (error: any) {
      console.error('File upload/processing error:', error);
      toast.error(error.message || "Failed to parse PDF.");
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsUploading(false);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-background/50 backdrop-blur-2xl border border-border/40 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ring-1 ring-white/5">
      {/* Header: AI Interface */}
      <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between bg-card/20 backdrop-blur-3xl z-10">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-primary to-purple-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500" />
            <div className="relative h-11 w-11 rounded-xl bg-card border border-border/50 flex items-center justify-center text-primary shadow-lg overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
               <Sparkles className="h-5 w-5 relative z-10" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight flex items-center gap-2">
              Academic <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">Assistant</span>
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
              </span>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.15em]">
                Neural Engine Active
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted/50 text-muted-foreground" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
        <div className="space-y-8 max-w-4xl mx-auto pb-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className={cn(
                  "flex gap-4 sm:gap-6",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className="flex flex-col items-center shrink-0">
                  <Avatar className={cn(
                    "h-9 w-9 sm:h-10 sm:w-10 border-2 shadow-xl",
                    msg.role === "assistant" ? "border-primary/20" : "border-border/40"
                  )}>
                    {msg.role === "assistant" ? (
                      <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white">
                        <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
                      </AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        <User className="h-5 w-5 sm:h-6 sm:w-6" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>

                <div className={cn(
                  "relative flex flex-col max-w-[85%] sm:max-w-[80%]",
                  msg.role === "user" ? "items-end" : "items-start"
                )}>
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                      {msg.role === "assistant" ? "Academic AI" : "You"}
                    </span>
                    <span className="text-[10px] text-muted-foreground/30 font-medium">•</span>
                    <span className="text-[10px] text-muted-foreground/30 font-medium uppercase tracking-tighter">{msg.timestamp}</span>
                  </div>

                  <div
                    className={cn(
                      "group relative p-4 sm:p-5 rounded-3xl transition-all duration-300 shadow-xl overflow-hidden",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none font-medium leading-relaxed"
                        : "bg-card/40 backdrop-blur-xl rounded-tl-none border border-border/50 text-foreground"
                    )}
                  >
                    {/* Background Shine for AI */}
                    {msg.role === "assistant" && (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
                    )}

                    <div className={cn(
                      "relative z-10 text-sm sm:text-base leading-relaxed",
                      msg.role === "assistant" ? "prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-black prose-strong:text-primary prose-code:bg-primary/10 prose-code:text-primary prose-code:px-1.5 prose-code:rounded-md prose-pre:bg-black/40 prose-pre:border prose-pre:border-border/50 prose-pre:rounded-2xl" : ""
                    )}>
                      {msg.role === "assistant" ? (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      ) : (
                        msg.content
                      )}
                    </div>

                    {msg.role === "assistant" && (
                      <div className="mt-4 pt-4 border-t border-border/10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <Button variant="outline" size="sm" className="h-8 px-3 rounded-xl bg-card/60 backdrop-blur-md border-border/40 text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all">
                          <Copy className="h-3 w-3 mr-2" /> Copy Response
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 px-3 rounded-xl bg-card/60 backdrop-blur-md border-border/40 text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all">
                          <CheckCircle2 className="h-3 w-3 mr-2 text-green-500" /> Fact Checked
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-4 sm:gap-6"
            >
              <div className="h-10 w-10 rounded-full border-2 border-primary/20 bg-primary/5 flex items-center justify-center shadow-lg">
                <Zap className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <div className="bg-card/40 backdrop-blur-xl px-6 py-4 rounded-3xl rounded-tl-none border border-border/40 shadow-xl flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-primary/30 rounded-full animate-bounce"></span>
              </div>
            </motion.div>
          )}
          <div ref={EndOfMessagesRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-card/20 border-t border-border/30 backdrop-blur-3xl relative">
        <div className="max-w-4xl mx-auto relative">
          <motion.div
            layout
            className="relative flex flex-col sm:flex-row items-center bg-card/40 backdrop-blur-xl border border-border/40 rounded-[1.5rem] md:rounded-[2rem] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.1)] focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/40 transition-all duration-500 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.txt"
            />
            
            <div className="flex items-center w-full sm:w-auto gap-1 pl-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isTyping}
                className="h-12 w-12 text-muted-foreground hover:text-primary rounded-2xl hover:bg-primary/10 transition-all active:scale-90"
              >
                {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-12 w-12 text-muted-foreground hover:text-primary rounded-2xl hover:bg-primary/10 transition-all hidden md:flex">
                <Mic className="h-5 w-5" />
              </Button>
            </div>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask me anything about your studies or upload a PDF..."
              className="flex-1 border-none shadow-none focus-visible:ring-0 bg-transparent min-h-[56px] py-4 px-4 text-sm sm:text-base font-medium placeholder:text-muted-foreground/40"
            />

            <div className="flex items-center pr-2 w-full sm:w-auto justify-end">
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className={cn(
                  "h-12 px-6 rounded-2xl transition-all duration-500 shadow-xl group/send active:scale-95",
                  input.trim() ? "bg-primary text-white hover:bg-primary/90" : "bg-muted text-muted-foreground"
                )}
              >
                <span className="font-bold uppercase tracking-wider text-[10px] mr-2">Send Message</span>
                <Send className={cn("h-4 w-4 transition-transform duration-300", input.trim() ? "translate-x-0.5 -translate-y-0.5" : "")} />
              </Button>
            </div>
          </motion.div>

          {/* Quick Actions / Tips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 opacity-40 hover:opacity-100 transition-opacity duration-500">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/50 bg-card/20 cursor-help group/tip">
              <FileText className="h-3 w-3 group-hover/tip:text-primary" />
              <span className="text-[9px] font-bold uppercase tracking-widest group-hover/tip:text-primary">Cite Sources</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/50 bg-card/20 cursor-help group/tip">
              <Zap className="h-3 w-3 group-hover/tip:text-primary" />
              <span className="text-[9px] font-bold uppercase tracking-widest group-hover/tip:text-primary">Instant Summaries</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border/50 bg-card/20 cursor-help group/tip">
              <Sparkles className="h-3 w-3 group-hover/tip:text-primary" />
              <span className="text-[9px] font-bold uppercase tracking-widest group-hover/tip:text-primary">AI Reasoning</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
