import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Copy, FileText, Mic, Paperclip, RefreshCw, Send, Sparkles, User, MoreVertical, Zap, Loader2 } from "lucide-react";
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
          // Prepend welcome message if needed, or just replace
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

    // Optional: Filter common types (PDF, docx, etc.)
    if (!file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.txt')) {
      toast.error("Please upload a PDF or text file for RAG analysis.");
      return;
    }

    setIsUploading(true);
    setIsTyping(true);

    // Temporary optimistic AI message
    const tempId = "uploading-" + Date.now();
    setMessages(prev => [...prev, {
      id: tempId,
      role: "assistant",
      content: `Reading and analyzing **${file.name}**... one moment please.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    try {
      // Check if there are any courses for this university
      const { data: courses } = await supabase
        .from('Course')
        .select('id')
        .eq('universityId', universityId)
        .limit(1);

      if (!courses || courses.length === 0) {
        throw new Error("No courses found. Please add a course to your university first.");
      }

      // 1. Upload to Storage
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

      // 2. Save to Database & Process RAG (Server Action)
      const { createResource } = await import("@/app/academic/actions");

      const { success, error: dbError } = await createResource({
        title: file.name,
        fileUrl: publicUrl,
        type: 'NOTE',
        courseId: courses[0].id,
        universityId
      });

      if (!success) throw new Error(dbError);

      // Replace loading message with success
      setMessages(prev => prev.map(m => m.id === tempId ? {
        ...m,
        content: `I've successfully analyzed **${file.name}**. You can now ask me questions about its content!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      } : m));

      await saveChatMessage(chatId, 'assistant', `I've successfully analyzed ${file.name}.`);

    } catch (error: any) {
      console.error('File upload/processing error:', error);
      toast.error(error.message || "Failed to parse PDF.");
      // Remove temp message
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsUploading(false);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden transition-all duration-500">
      {/* Header: AI Interface */}
      <div className="px-5 py-3 border-b border-border/30 flex items-center justify-between bg-card/20 backdrop-blur-3xl z-10">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500" />
            <div className="relative h-10 w-10 rounded-xl bg-card border border-border/50 flex items-center justify-center text-primary shadow-lg">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
              Academic <span className="text-primary">AI</span>
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
              </span>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Assistant Online
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-border/30 bg-card/40 hover:bg-muted" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-border/30 bg-card/40 hover:bg-muted">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-6 px-1 pb-4">
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-20">
                <Bot className="h-12 w-12" />
                <p className="text-xs font-medium uppercase tracking-wider">Start a conversation</p>
              </div>
            )}
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className={cn(
                  "flex gap-4 max-w-[90%]",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <Avatar className="h-8 w-8 border border-border/50 shadow-sm">
                    {msg.role === "assistant" ? (
                      <AvatarFallback className="bg-primary/10 text-primary"><Sparkles className="h-4 w-4" /></AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-muted text-muted-foreground"><User className="h-4 w-4" /></AvatarFallback>
                    )}
                  </Avatar>
                </div>

                <div className={cn(
                  "relative group space-y-1.5",
                  msg.role === "user" ? "items-end flex flex-col" : "items-start"
                )}>
                  <div
                    className={cn(
                      "p-4 rounded-2xl shadow-sm transition-all duration-300",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none font-medium text-sm"
                        : "bg-card/60 backdrop-blur-xl rounded-tl-none border border-border/50 text-foreground text-sm leading-relaxed"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none
                        prose-p:leading-relaxed prose-pre:bg-black/20 prose-pre:text-foreground prose-pre:border prose-pre:border-border/50 prose-pre:rounded-xl
                        prose-code:text-primary prose-code:bg-primary/10 prose-code:rounded prose-code:px-1
                        prose-headings:text-foreground prose-headings:font-bold prose-headings:tracking-tight
                        prose-strong:text-foreground prose-strong:font-bold prose-a:text-primary hover:prose-a:underline"
                      >
                        <ReactMarkdown>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}

                    {msg.role === "assistant" && (
                      <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary bg-card/80 backdrop-blur-md rounded-lg">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-muted-foreground/40 font-medium uppercase tracking-wider px-2">{msg.timestamp}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-4 max-w-[85%]"
            >
              <div className="h-8 w-8 rounded-full border border-border/30 bg-card/40 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="bg-card/40 backdrop-blur-md px-4 py-3 rounded-2xl rounded-tl-none border border-border/50 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></span>
              </div>
            </motion.div>
          )}
          <div ref={EndOfMessagesRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 bg-card/20 border-t border-border/30 backdrop-blur-3xl">
        <motion.div
          layout
          className="relative flex items-center bg-card/60 backdrop-blur-md border border-border/50 rounded-2xl group p-1.5 shadow-lg focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.txt"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isTyping}
            className="h-10 w-10 text-muted-foreground hover:text-primary rounded-xl hover:bg-primary/10 transition-colors"
          >
            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
          </Button>

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask anything about your studies..."
            className="border-none shadow-none focus-visible:ring-0 bg-transparent min-h-[44px] py-2 px-3 text-sm font-medium placeholder:text-muted-foreground/40 transition-all"
          />

          <div className="flex items-center gap-1 px-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary rounded-lg hidden md:flex">
              <Mic className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 group/send transition-all active:scale-95"
            >
              <Send className="h-5 w-5 text-primary-foreground group-hover/send:translate-x-0.5 group-hover/send:-translate-y-0.5 transition-transform" />
            </Button>
          </div>
        </motion.div>

        <div className="mt-2.5 flex items-center justify-center gap-6 opacity-30">
          <div className="flex items-center gap-1.5">
            <FileText className="h-2.5 w-2.5" />
            <span className="text-[8px] font-bold uppercase tracking-widest">Research Sync</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RefreshCw className="h-2.5 w-2.5" />
            <span className="text-[8px] font-bold uppercase tracking-widest">Knowledge Engine Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
