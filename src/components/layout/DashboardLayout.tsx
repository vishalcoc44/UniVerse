'use client';

import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";

interface DashboardLayoutProps {
  children: ReactNode;
  title: React.ReactNode;
  subtitle?: string;
  breadcrumb?: string[];
  activeNav?: string;
  onNavigate?: (href: string) => void;
  action?: React.ReactNode;
  noPadding?: boolean;
}
export function DashboardLayout({
  children,
  title,
  subtitle,
  breadcrumb,
  activeNav,
  onNavigate,
  action,
  noPadding = false,
}: DashboardLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activeItem={activeNav} onNavigate={onNavigate} />
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} activeItem={activeNav} onNavigate={onNavigate} />
      <main className={`flex-1 overflow-x-hidden ${noPadding ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
        <Header title={title} subtitle={subtitle} breadcrumb={breadcrumb} action={action} onMobileMenuToggle={() => setMobileNavOpen(true)} />
        {noPadding
          ? <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
          : <div className="p-3 sm:p-4 md:p-6 animate-fade-in">{children}</div>
        }
      </main>
    </div>
  );
}
