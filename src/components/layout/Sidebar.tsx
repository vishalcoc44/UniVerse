'use client';

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Users,
  MessageSquare,
  Briefcase,
  Heart,
  Car,
  FlaskConical,
  MessageCircle,
  Newspaper,
  Sparkles,
  ShoppingBag,
  Map,
  Settings,
  Sun,
  Moon,
  ShieldCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useTheme } from "next-themes";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
  isActive?: boolean;
}

interface SidebarProps {
  activeItem?: string;
  onNavigate?: (href: string) => void;
}

export function Sidebar({ activeItem, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<{ fullName: string, username: string, universityAbbr: string, avatarUrl: string, role: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const mainMenuItems: NavItem[] = [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard", isActive: pathname === "/dashboard" },
    { icon: BookOpen, label: "Academic AI", href: "/academic", isActive: pathname === "/academic" },
    { icon: Calendar, label: "Events", href: "/events", isActive: pathname === "/events" },
    { icon: Users, label: "Campus Feed", href: "/feed", isActive: pathname === "/feed" },
    { icon: MessageSquare, label: "Messages", href: "/messages", badge: unreadCount > 0 ? unreadCount : undefined, isActive: pathname === "/messages" },
    { icon: Briefcase, label: "Career Hub", href: "/career", isActive: pathname === "/career" },
    { icon: Heart, label: "Wellness", href: "/wellness", isActive: pathname === "/wellness" },
    { icon: Map, label: "Utilities", href: "/utilities", isActive: pathname === "/utilities" },
  ];

  const collaborationItems: NavItem[] = [
    { icon: Car, label: "Cab Pooling", href: "/travel", isActive: pathname === "/travel" },
    { icon: FlaskConical, label: "Research Hub", href: "/research", isActive: pathname === "/research" },
    { icon: MessageCircle, label: "Anonymous Forums", href: "/forums", isActive: pathname === "/forums" },
    { icon: Users, label: "Clubs & Societies", href: "/clubs", isActive: pathname === "/clubs" },
  ];

  const settingsItems: NavItem[] = [
    { icon: Newspaper, label: "Campus News", href: "/news", isActive: pathname === "/news" },
    { icon: ShoppingBag, label: "Marketplace", href: "/marketplace", isActive: pathname === "/marketplace" },
    { icon: Sparkles, label: "What's New", href: "/updates", isActive: pathname === "/updates" },
    ...(profile?.role === "ADMIN" ? [{ icon: ShieldCheck, label: "Admin Panel", href: "/admin", isActive: pathname === "/admin" }] : []),
    { icon: Settings, label: "Settings", href: "/settings", isActive: pathname === "/settings" },
  ];

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get all conversations the user is in
      const { data: participants } = await supabase
        .from('ConversationParticipant')
        .select('conversationId')
        .eq('userId', user.id);

      if (!participants || participants.length === 0) {
        setUnreadCount(0);
        return;
      }

      const conversationIds = participants.map(p => p.conversationId);

      // 2. Count unread messages in those conversations, excluding messages
      //    that the current user deleted for themselves or were deleted for everyone
      const { data: messages, error } = await supabase
        .from('Message')
        .select('id, readBy, senderId, isDeleted, deletedFor')
        .in('conversationId', conversationIds);

      if (messages) {
        const count = messages.filter(m =>
          m.senderId !== user.id &&
          (!m.readBy || !m.readBy.includes(user.id)) &&
          !(m.isDeleted) &&
          !((m.deletedFor || []).includes(user.id))
        ).length;
        setUnreadCount(count);
      }
    };

    fetchUnreadCount();

    // Subscribe to message updates to keep count in sync
    const channel = supabase
      .channel('sidebar-unread-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Message' }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Use passed activeItem or derive from URL
  const currentPath = activeItem || pathname;

  const handleNavigate = (href: string) => {
    if (onNavigate) {
      onNavigate(href);
    } else {
      router.push(href);
    }
  };


  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Capitalize University to match table name if lowercase fails
        const { data } = await supabase.from('Profile').select('fullName, username, avatarUrl, role, University(abbreviation)').eq('id', user.id).single();
        if (data) {
          // Supabase join query return key matches the select capitalization
          const uni: any = data.University;
          const uniAbbr = Array.isArray(uni) ? uni[0]?.abbreviation : uni?.abbreviation;

          setProfile({
            fullName: data.fullName || "Student",
            username: data.username || "",
            universityAbbr: uniAbbr || "Uni",
            avatarUrl: data.avatarUrl || "",
            role: data.role || "STUDENT",
          });
        }
      }
    };
    fetchProfile();

    const timer = setTimeout(() => {
      setCollapsed(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // The sidebar is visually collapsed only if it's pinned closed AND not hovered
  const isDisplayCollapsed = collapsed && !isHovered;

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    // Exact match or starts with (for nested routes) - simplified for now
    const isActive = item.href === currentPath;
    const Icon = item.icon;

    return (
      <button
        onClick={() => handleNavigate(item.href)}
        className={cn(
          "sidebar-item w-full group",
          isDisplayCollapsed ? "justify-start px-4" : "",
          isActive && "sidebar-item-active"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className={cn(
          "flex-1 text-left text-sm transition-all duration-300 overflow-hidden whitespace-nowrap",
          isDisplayCollapsed ? "w-0 opacity-0 min-w-0" : "w-auto opacity-100 min-w-auto"
        )}>
          {item.label}
        </span>
        {item.badge && (
          <div className={cn(
            "transition-all duration-300 overflow-hidden",
            isDisplayCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            <Badge
              className="h-5 w-5 flex items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-[10px] p-0 shadow-sm"
            >
              {item.badge}
            </Badge>
          </div>
        )}
      </button>
    );
  };

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "flex flex-col h-screen bg-sidebar transition-all duration-300 ease-in-out relative z-20",
        isDisplayCollapsed ? "w-[85px]" : "w-[280px]"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 h-20 mb-2 transition-all duration-300 ease-in-out",
        isDisplayCollapsed ? "pl-5" : "px-6"
      )}>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 overflow-hidden">
          <img src="/universe_logo.png" alt="UniVerse Logo" className="w-full h-full object-cover" />
        </div>
        <div className={cn(
          "flex flex-col transition-all duration-300 overflow-hidden whitespace-nowrap",
          isDisplayCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        )}>
          <span className="inline-block font-bold text-xl tracking-tight bg-gradient-to-r from-gray-500 via-gray-950 to-gray-500 dark:from-gray-200 dark:via-gray-500 dark:to-gray-200 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
            UniVerse
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div>
          <div className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            isDisplayCollapsed ? "max-h-0 opacity-0 mb-0" : "max-h-10 opacity-100 mb-2"
          )}>
            <h3 className="px-3 text-xs font-medium text-sidebar-muted uppercase tracking-wider">
              Main Menu
            </h3>
          </div>
          <div className="space-y-1">
            {mainMenuItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
          </div>
        </div>

        <div>
          <div className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            isDisplayCollapsed ? "max-h-0 opacity-0 mb-0" : "max-h-10 opacity-100 mb-2"
          )}>
            <h3 className="px-3 text-xs font-medium text-sidebar-muted uppercase tracking-wider">
              Collaboration
            </h3>
          </div>
          <div className="space-y-1">
            {collaborationItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
          </div>
        </div>

        <div>
          <div className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            isDisplayCollapsed ? "max-h-0 opacity-0 mb-0" : "max-h-10 opacity-100 mb-2"
          )}>
            <h3 className="px-3 text-xs font-medium text-sidebar-muted uppercase tracking-wider">
              Settings & News
            </h3>
          </div>
          <div className="space-y-1">
            {settingsItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="border-t border-sidebar-border p-3">
        <div
          onClick={() => handleNavigate('/settings')}
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer",
            isDisplayCollapsed && "justify-center"
          )}
        >
          <Avatar className="h-9 w-9 border-2 border-sidebar-border">
            <AvatarImage src={profile?.avatarUrl} />
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
              {profile?.fullName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className={cn(
            "flex-1 min-w-0 transition-all duration-300 overflow-hidden whitespace-nowrap",
            isDisplayCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            <p className="text-sm font-medium text-sidebar-primary truncate">
              {profile?.fullName || "Loading..."}
            </p>
            {profile?.username && (
              <p className="text-[10px] text-primary/60 font-medium italic -mt-0.5 truncate uppercase tracking-tighter">
                @{profile.username}
              </p>
            )}
            <p className="text-[10px] text-sidebar-muted truncate">
              Student • {profile?.universityAbbr || "Univ"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={cn(
            "relative mt-2 w-full flex items-center gap-2 p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-primary",
            isDisplayCollapsed && "justify-center"
          )}
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {mounted && (
            <>
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </>
          )}
          <span className={cn(
            "text-xs font-medium transition-all duration-300 overflow-hidden whitespace-nowrap",
            isDisplayCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            Dark mode
          </span>
        </button>
      </div>
    </aside>
  );
}
