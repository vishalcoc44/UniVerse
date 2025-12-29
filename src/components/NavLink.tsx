'use client';

import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<LinkProps, "className" | "href"> {
  to: string; // Map 'to' to 'href'
  className?: string; // Next.js Link doesn't accept className directly on Link, but we pass it to anchor
  activeClassName?: string;
  pendingClassName?: string;
  children?: React.ReactNode;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, children, ...props }, ref) => {
    const pathname = usePathname();
    // Simple exact match or subpath match could be implemented. 
    // react-router-dom NavLink defaults to inclusive match for active, but let's stick to simple exact or startsWith for now.
    // However, exact match is safer for root.
    const isActive = pathname === to || (to !== '/' && pathname?.startsWith(to));

    return (
      <Link
        ref={ref}
        href={to}
        className={cn(className, isActive && activeClassName)}
        {...props}
      >
        {children}
      </Link>
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
