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
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
  isActive?: boolean;
}

const mainMenuItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard", isActive: true },
  { icon: BookOpen, label: "Academic AI", href: "/academic" },
  { icon: Calendar, label: "Events", href: "/events" },
  { icon: Users, label: "Campus Feed", href: "/feed" },
  { icon: MessageSquare, label: "Messages", href: "/messages", badge: 3 },
  { icon: Briefcase, label: "Career Hub", href: "/career" },
  { icon: Heart, label: "Wellness", href: "/wellness" },
  { icon: Map, label: "Utilities", href: "/utilities" },
];

const collaborationItems: NavItem[] = [
  { icon: Car, label: "Cab Pooling", href: "/travel" },
  { icon: FlaskConical, label: "Research Hub", href: "/research" },
  { icon: MessageCircle, label: "Anonymous Forums", href: "/forums" },
  { icon: Users, label: "Clubs & Societies", href: "/clubs" },
];

const settingsItems: NavItem[] = [
  { icon: Newspaper, label: "Campus News", href: "/news" },
  { icon: ShoppingBag, label: "Marketplace", href: "/marketplace" },
  { icon: Sparkles, label: "What's New", href: "/updates" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

interface SidebarProps {
  activeItem?: string;
  onNavigate?: (href: string) => void;
}

export function Sidebar({ activeItem, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [profile, setProfile] = useState<{ fullName: string, universityAbbr: string, avatarUrl: string } | null>(null);
  const router = useRouter();
  const pathname = usePathname();

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
        const { data } = await supabase.from('Profile').select('fullName, avatarUrl, University(abbreviation)').eq('id', user.id).single();
        if (data) {
          // Supabase join query return key matches the select capitalization
          const uni: any = data.University;
          const uniAbbr = Array.isArray(uni) ? uni[0]?.abbreviation : uni?.abbreviation;

          setProfile({
            fullName: data.fullName || "Student",
            universityAbbr: uniAbbr || "Uni",
            avatarUrl: data.avatarUrl || ""
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
            <p className="text-xs text-sidebar-muted truncate">
              Student • {profile?.universityAbbr || "Univ"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
