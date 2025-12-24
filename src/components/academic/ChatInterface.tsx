import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bot, Copy, FileText, Mic, Paperclip, RefreshCw, Send, Sparkles, User } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  attachments?: string[];
}

export function ChatInterface() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your Academic AI assistant. I can help you with course material, research papers, or explaining complex topics. What are we studying today?",
      timestamp: "10:00 AM",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setIsTyping(true);

    // Mock AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "That's an interesting question about " + newMessage.content + ". Here is a detailed explanation based on your course syllabus...",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[600px] w-full bg-card/40 backdrop-blur-sm border border-border/50 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/40 flex items-center justify-between bg-card/60">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Academic Compass</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Online • Powered by Gemini
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2 text-xs">
          <FileText className="h-3.5 w-3.5" />
          Export Chat
        </Button>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 space-y-6">
        <div className="space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-4 max-w-[85%]",
                msg.role === "user" ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <Avatar className="h-8 w-8 mt-1 border border-border">
                {msg.role === "assistant" ? (
                  <AvatarFallback className="bg-primary/10 text-primary"><Bot className="h-4 w-4" /></AvatarFallback>
                ) : (
                  <AvatarFallback className="bg-muted text-muted-foreground"><User className="h-4 w-4" /></AvatarFallback>
                )}
              </Avatar>

              <div className={cn(
                "space-y-2",
                msg.role === "user" ? "items-end flex flex-col" : "items-start"
              )}>
                <div
                  className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-white/80 dark:bg-muted/50 backdrop-blur-md rounded-tl-none border border-border/50"
                  )}
                >
                  {msg.content}
                </div>

                <div className="flex items-center gap-2 px-1">
                  <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                  {msg.role === "assistant" && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground">
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground">
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-4 max-w-[85%]">
              <Avatar className="h-8 w-8 mt-1 border border-border">
                <AvatarFallback className="bg-primary/10 text-primary"><Sparkles className="h-4 w-4 animate-pulse" /></AvatarFallback>
              </Avatar>
              <div className="bg-white/50 dark:bg-muted/30 p-4 rounded-2xl rounded-tl-none flex items-center gap-1">
                <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"></span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-card/60 border-t border-border/40">
        <div className="relative flex items-center bg-background/50 border border-input rounded-xl focus-within:ring-1 focus-within:ring-ring shadow-sm transition-all focus-within:shadow-md">
          <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary rounded-l-xl">
            <Paperclip className="h-5 w-5" />
          </Button>

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask anything..."
            className="border-none shadow-none focus-visible:ring-0 bg-transparent h-12 px-2"
          />

          <div className="flex items-center gap-1 pr-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary">
              <Mic className="h-5 w-5" />
            </Button>
            <Button
              onClick={handleSend}
              size="icon"
              className="h-9 w-9 m-1 rounded-lg transition-all active:scale-95"
              disabled={!input.trim() && !isTyping}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-2 opacity-70">
          AI can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
