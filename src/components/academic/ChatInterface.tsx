import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Copy, FileText, Mic, Paperclip, RefreshCw, Send, Sparkles, User, MoreVertical } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
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
      content: "Hello! I'm your Academic AI assistant. I can help you with course material, research papers, or explaining complex topics. What are we studying today?",
      timestamp: "Just now",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const { universityId } = useUserUniversity();
  const scrollRef = useRef<HTMLDivElement>(null);
  const EndOfMessagesRef = useRef<HTMLDivElement>(null);

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
      EndOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
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
      const { success, response, error } = await chatAction(historyItems);

      if (!success || !response) throw new Error(error || "Failed to get AI response");

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

  return (
    <div className="flex flex-col h-[600px] w-full bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between bg-card/60 backdrop-blur-xl z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-500 shadow-inner">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground tracking-tight">Academic Compass</h3>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Online • Gemini 2.5 Flash
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-6 px-2 pb-4">
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground mt-20">Start a conversation...</div>
            )}
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn(
                  "flex gap-4 max-w-[85%]",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <Avatar className="h-8 w-8 mt-1 border border-border shadow-sm">
                  {msg.role === "assistant" ? (
                    <AvatarFallback className="bg-indigo-500/10 text-indigo-500"><Bot className="h-4 w-4" /></AvatarFallback>
                  ) : (
                    <AvatarFallback className="bg-muted text-muted-foreground"><User className="h-4 w-4" /></AvatarFallback>
                  )}
                </Avatar>

                <div className={cn(
                  "space-y-1.5",
                  msg.role === "user" ? "items-end flex flex-col" : "items-start"
                )}>
                  <div
                    className={cn(
                      "p-4 rounded-2xl text-[14px] leading-relaxed shadow-sm dark:shadow-none",
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none shadow-indigo-500/20"
                        : "bg-white dark:bg-muted/80 backdrop-blur-sm rounded-tl-none border border-border/50 text-foreground"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none
                        prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:text-foreground prose-pre:border prose-pre:border-border
                        prose-code:text-primary prose-code:bg-primary/10 prose-code:rounded-md prose-code:px-1 prose-code:py-0.5
                        prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:underline
                        prose-ul:my-2 prose-li:my-0.5"
                      >
                        <ReactMarkdown>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>

                  <span className="text-[10px] text-muted-foreground/60 px-1 font-medium">{msg.timestamp}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 max-w-[85%]"
            >
              <Avatar className="h-8 w-8 mt-1 border border-border">
                <AvatarFallback className="bg-indigo-500/10 text-indigo-500"><Sparkles className="h-4 w-4 animate-pulse" /></AvatarFallback>
              </Avatar>
              <div className="bg-white/50 dark:bg-muted/30 p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5 h-[52px]">
                <span className="w-1.5 h-1.5 bg-indigo-500/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-indigo-500/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-indigo-500/50 rounded-full animate-bounce"></span>
              </div>
            </motion.div>
          )}
          <div ref={EndOfMessagesRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-card/60 border-t border-border/40 backdrop-blur-xl">
        <motion.div
          layout
          className="relative flex items-end bg-background/80 border border-input rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/50 shadow-sm transition-all duration-200"
        >
          <Button variant="ghost" size="icon" className="h-10 w-10 mb-1 ml-1 text-muted-foreground hover:text-indigo-500 rounded-xl">
            <Paperclip className="h-5 w-5" />
          </Button>

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask anything..."
            className="border-none shadow-none focus-visible:ring-0 bg-transparent min-h-[48px] py-3 px-2 resize-none text-[15px]"
          />

          <div className="flex items-center gap-1 mb-1 mr-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-indigo-500 rounded-lg">
              <Mic className="h-5 w-5" />
            </Button>
            <Button
              onClick={handleSend}
              size="icon"
              className={cn(
                "h-9 w-9 rounded-lg transition-all duration-200",
                input.trim()
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 scale-100"
                  : "bg-muted text-muted-foreground scale-95 opacity-50"
              )}
              disabled={!input.trim() && !isTyping}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        <p className="text-[10px] text-center text-muted-foreground/50 mt-3 font-medium tracking-wide">
          AI can make mistakes. Please verify important information.
        </p>
      </div>
    </div>
  );
}
