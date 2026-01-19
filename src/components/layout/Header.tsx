'use client';

import { Bell, MessageSquare, Search, Command, Home, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

interface HeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: string[];
  action?: React.ReactNode;
}

export function Header({ title, subtitle, breadcrumb, action }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left: Breadcrumb & Title */}
        <div className="flex items-center gap-3">
          {breadcrumb && breadcrumb.length > 0 && (
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
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
        <div className="flex items-center gap-3">
          {/* Home Button */}
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <Home className="h-5 w-5" />
            </Button>
          </Link>

          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search anything..."
              className="w-[280px] pl-9 pr-12 h-9 bg-muted/50 border-transparent focus:border-border focus:bg-card"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground">
              <kbd className="inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 text-[10px] font-medium">
                <Command className="h-3 w-3" />K
              </kbd>
            </div>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          </Button>

          {/* Messages */}
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <MessageSquare className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center text-[10px] px-1">
              3
            </Badge>
          </Button>

          {/* Logout */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-destructive"
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/auth");
            }}
            title="Log Out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Page Title */}
      {title && (
        <div className="px-6 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {/* Page Action */}
          {action && (
            <div>
              {action}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
