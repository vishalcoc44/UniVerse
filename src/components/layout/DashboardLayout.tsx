'use client';

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

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
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activeItem={activeNav} onNavigate={onNavigate} />
      <main className={`flex-1 overflow-x-hidden ${noPadding ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
        <Header title={title} subtitle={subtitle} breadcrumb={breadcrumb} action={action} />
        {noPadding
          ? <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
          : <div className="p-6 animate-fade-in">{children}</div>
        }
      </main>
    </div>
  );
}
