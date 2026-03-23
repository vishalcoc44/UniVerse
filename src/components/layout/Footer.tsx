'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Mail, 
  ChevronRight, 
  Globe,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer() {
  return (
    <footer className="relative pt-24 pb-12 border-t border-border/40 bg-card overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Brand Column */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-6 group w-fit">
              <div className="h-10 w-10 rounded-xl overflow-hidden shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                <img src="/universe_logo.png" alt="UniVerse Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-2xl font-bold tracking-tight">UniVerse</span>
            </Link>
            <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
              Your Campus Super App. Empowering students to thrive academically, connect socially, and navigate campus life effortlessly.
            </p>
          </div>

          {/* Newsletter Column */}
          <div className="max-w-md lg:ml-auto w-full">
            <h3 className="font-bold mb-6 text-foreground">Stay Updated</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Get the latest updates on campus events and new features.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full h-11 bg-secondary/50 border border-border/60 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                />
              </div>
              <Button size="icon" className="h-11 w-11 rounded-xl shadow-lg shadow-primary/20">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
              <Globe className="h-4 w-4" />
              English (US)
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
            <p>© 2026 UniVerse Connect. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
