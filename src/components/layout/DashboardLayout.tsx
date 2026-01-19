'use client';

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  breadcrumb?: string[];
  activeNav?: string;
  onNavigate?: (href: string) => void;
  action?: React.ReactNode;
}
export function DashboardLayout({
  children,
  title,
  subtitle,
  breadcrumb,
  activeNav,
  onNavigate,
  action,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar activeItem={activeNav} onNavigate={onNavigate} />
      <main className="flex-1 overflow-y-auto">
        <Header title={title} subtitle={subtitle} breadcrumb={breadcrumb} action={action} />
        <div className="p-6 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
