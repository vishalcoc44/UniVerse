'use client';

import { Menu, MessageSquare, Search, Command, Home, LogOut, Sun, Moon, LucideIcon } from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  breadcrumb?: string[];
  action?: React.ReactNode;
  icon?: LucideIcon;
  onMobileMenuToggle?: () => void;
}

export function Header({ title, subtitle, breadcrumb, action, icon: Icon, onMobileMenuToggle }: HeaderProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessageUnreadCount(0);
        return;
      }

      const { data: participants } = await supabase
        .from('ConversationParticipant')
        .select('conversationId')
        .eq('userId', user.id);

      if (!participants || participants.length === 0) {
        setMessageUnreadCount(0);
        return;
      }

      const conversationIds = participants.map((p) => p.conversationId);
      const { data: messages } = await supabase
        .from('Message')
        .select('id, readBy, senderId, isDeleted, deletedFor')
        .in('conversationId', conversationIds);

      if (!messages) {
        setMessageUnreadCount(0);
        return;
      }

      const count = messages.filter((m: any) =>
        m.senderId !== user.id &&
        (!m.readBy || !m.readBy.includes(user.id)) &&
        !m.isDeleted &&
        !((m.deletedFor || []).includes(user.id))
      ).length;

      setMessageUnreadCount(count);
    };

    fetchUnreadCount();

    const channel = supabase
      .channel('header-unread-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Message' }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-background/98 backdrop-blur-md border-b border-border shadow-sm">
      <div className="flex items-center justify-between h-12 md:h-14 px-3 md:px-6">
        {/* Left: Mobile menu + Breadcrumb */}
        <div className="flex items-center gap-2 md:gap-3">
          {onMobileMenuToggle && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden"
              onClick={onMobileMenuToggle}
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
          {breadcrumb && breadcrumb.length > 0 && (
            <nav className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              {breadcrumb.map((item, index) => (
                <span key={index} className="flex items-center gap-2">
                  {index > 0 && <span className="text-border">/</span>}
                  <span className={index === breadcrumb.length - 1 ? "text-foreground font-medium" : ""}>
                    {item}
                  </span>
                </span>
              ))}
            </nav>
          )}
        </div>

        {/* Right: Search & Actions */}
        <div className="flex items-center gap-1.5 md:gap-2.5">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Home className="h-4 w-4" />
            </Button>
          </Link>

          {/* Search - desktop only */}
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="w-[240px] pl-8 pr-12 h-8 bg-muted/50 border-transparent focus:border-border focus:bg-card text-xs"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground">
              <kbd className="inline-flex h-4 items-center gap-0.5 rounded border border-border bg-muted px-1 text-[9px] font-medium">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </div>
          </div>

          {/* Dark Mode Toggle - hide on mobile since it's in MobileNav */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <NotificationCenter />

          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8"
            onClick={() => router.push("/messages")}
            title="Messages"
          >
            <MessageSquare className="h-4 w-4" />
            {messageUnreadCount > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center text-[9px] px-1">
                {messageUnreadCount > 99 ? "99+" : messageUnreadCount}
              </Badge>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={async () => {
              void import("@/lib/analytics").then(({ track }) => track("logout"));
              await supabase.auth.signOut();
              router.push("/auth");
            }}
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Page Title */}
      {title && (
        <motion.div 
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          className="px-3 md:px-6 pb-2 md:pb-3 flex items-center justify-between"
        >
          <div className="min-w-0 flex-1 flex items-center gap-3">
            {Icon && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                transition={{ delay: 0.25, duration: 0.3 }}
                className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5 shrink-0"
              >
                <Icon className="h-6 w-6" />
              </motion.div>
            )}
            <motion.div 
              initial={{ x: -4, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="min-w-0"
            >
              <h1 className="text-lg md:text-xl font-bold text-foreground truncate leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </motion.div>
          </div>
          {action && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.3 }}
              className="ml-2 shrink-0"
            >
              {action}
            </motion.div>
          )}
        </motion.div>
      )}
    </header>
  );
}
