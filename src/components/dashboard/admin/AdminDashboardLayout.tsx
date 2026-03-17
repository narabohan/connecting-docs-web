// ═══════════════════════════════════════════════════════════════
//  AdminDashboardLayout — Phase 2 (G-5)
//  관리자 대시보드 레이아웃: 사이드바 + 메인 영역
//  G-3 DoctorDashboardLayout 패턴 복사 → admin nav으로 변경
//
//  반응형:
//  - 768px+: 사이드바 + 메인 2단 레이아웃
//  - <768px: 하단 탭바 + 단일 컬럼
//  NO any/unknown types
// ═══════════════════════════════════════════════════════════════

import { type ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  Users,
  FileText,
  Activity,
  Mail,
  Settings,
  Menu,
  X,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// ─── Types ───────────────────────────────────────────────────

interface AdminDashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// ─── Navigation Items ────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/admin/users', label: 'Users', icon: Users },
  { href: '/dashboard/admin/reports', label: 'Reports', icon: FileText },
  { href: '/dashboard/admin/sessions', label: 'Sessions', icon: Activity },
  { href: '/dashboard/admin/emails', label: 'Emails', icon: Mail },
  { href: '/dashboard/admin/settings', label: 'Settings', icon: Settings },
];

// ─── Component ───────────────────────────────────────────────

export function AdminDashboardLayout({ children, title }: AdminDashboardLayoutProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard/admin') {
      return router.asPath === '/dashboard/admin' || router.asPath === '/dashboard/admin/';
    }
    return router.asPath.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* ── Mobile Header ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0f0f1a]/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <span className="text-sm font-semibold text-white">
          {title ?? 'Admin Dashboard'}
        </span>
        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold">
          {user?.displayName?.charAt(0) ?? 'A'}
        </div>
      </header>

      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar (desktop: always visible, mobile: overlay) ── */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-[#0f0f1a] border-r border-white/10
          transform transition-transform duration-200 ease-in-out
          md:translate-x-0 md:z-10
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo / Brand */}
        <div className="p-6 border-b border-white/10">
          <Link href="/dashboard/admin" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">ConnectingDocs</div>
              <div className="text-[10px] text-gray-500 tracking-wider uppercase">Admin Panel</div>
            </div>
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${active
                    ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin Info + Sign Out */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold">
              {user?.displayName?.charAt(0) ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {user?.displayName ?? 'Admin'}
              </div>
              <div className="text-[11px] text-gray-500 truncate">
                {user?.email ?? ''}
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="md:ml-64 pt-14 md:pt-0 min-h-screen">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-white/10">
          <h1 className="text-lg font-bold text-white">
            {title ?? 'Admin Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-white">
                {user?.displayName ?? 'Admin'}
              </div>
              <div className="text-[11px] text-gray-500">
                {user?.email ?? ''}
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-sm font-bold">
              {user?.displayName?.charAt(0) ?? 'A'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f1a]/95 backdrop-blur-md border-t border-white/10 flex justify-around py-2 px-1">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] transition-colors
                ${active ? 'text-violet-400' : 'text-gray-500 hover:text-gray-300'}
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
