'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  BookOpen,
  Globe,
  Settings,
  LogOut,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
  { name: 'Knowledge Base', href: '/knowledge', icon: BookOpen, disabled: true, badge: 'v1.1' },
  { name: 'Browser', href: '/browser', icon: Globe, disabled: true, badge: 'v1.2' },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-muted/40">
      <div className="flex h-full flex-col gap-4 py-6">
        {/* Logo */}
        <div className="px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-lg font-bold">F</span>
            </div>
            <span className="text-xl font-bold">Forgeline</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            // For Dashboard (/dashboard), use exact match only
            // For other routes, allow sub-route matching
            const isActive = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href || pathname.startsWith(item.href + '/');
            const isDisabled = item.disabled;

            return (
              <Link
                key={item.name}
                href={isDisabled ? '#' : item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive && 'bg-primary text-primary-foreground',
                  !isActive && !isDisabled && 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  isDisabled && 'cursor-not-allowed opacity-50'
                )}
                onClick={(e) => {
                  if (isDisabled) {
                    e.preventDefault();
                  }
                }}
              >
                <Icon className="h-4 w-4" />
                {item.name}
                {isDisabled && item.badge && (
                  <span className="ml-auto text-xs text-muted-foreground">{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t px-4 pt-4">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              V
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Володимир</p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/auth/login';
            }}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        {/* Version */}
        <div className="px-6 py-2">
          <p className="text-xs text-muted-foreground">v0.3.5 Beta</p>
        </div>
      </div>
    </aside>
  );
}
