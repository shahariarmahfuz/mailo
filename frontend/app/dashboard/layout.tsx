"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Inbox,
  Layers,
  Settings,
  LogOut,
  Menu,
  X,
  User as UserIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { User } from "@/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const u = await api.getMe();
        setUser(u);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [router]);

  // Handle ESC key to close mobile drawer
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && drawerOpen) {
        setDrawerOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  async function handleLogout() {
    await api.logout();
    router.push("/login");
  }

  // Derive compact title for mobile header
  const getPageTitle = useCallback(() => {
    if (pathname.includes("/dashboard/inbox")) return "Inbox";
    if (pathname.includes("/dashboard/mailboxes")) return "Mailboxes";
    if (pathname.includes("/dashboard/settings")) return "Settings";
    return "Dashboard";
  }, [pathname]);

  const navItems = [
    { label: "Inbox", href: "/dashboard/inbox", icon: Inbox },
    { label: "Mailboxes", href: "/dashboard/mailboxes", icon: Layers },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-2.5 text-xs tracking-wider uppercase">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading Mailo</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header - Compact */}
      <header className="h-13 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between sticky top-0 z-30 backdrop-blur-sm">
        {/* Desktop Left: Logo & App Name */}
        <div className="hidden md:flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
            <Mail className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-base text-white tracking-tight">Mailo</span>
        </div>

        {/* Mobile Left: Menu Button & Page Title */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            className="p-1.5 -ml-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md focus-visible:ring-1 focus-visible:ring-blue-500 outline-none transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm text-white tracking-tight">
            {getPageTitle()}
          </span>
        </div>

        {/* Right: User Profile Link */}
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-slate-800/60 transition group focus-visible:ring-1 focus-visible:ring-blue-500 outline-none"
        >
          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-medium text-[11px] group-hover:border-slate-600">
            {user?.name?.charAt(0).toUpperCase() || <UserIcon className="w-3 h-3" />}
          </div>
          <span className="hidden sm:inline text-xs text-slate-300 group-hover:text-white font-medium max-w-[140px] truncate">
            {user?.name || user?.email}
          </span>
        </Link>
      </header>

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex min-h-[calc(100vh-3.25rem)]">
        {/* Desktop Sidebar (Left side, permanent) */}
        <aside className="hidden md:flex flex-col w-56 bg-slate-900/50 border-r border-slate-800 shrink-0 select-none">
          {/* Navigation Items */}
          <nav className="flex-1 p-3 space-y-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition focus-visible:ring-1 focus-visible:ring-blue-500 outline-none ${
                    active
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Profile & Logout */}
          <div className="p-3 border-t border-slate-800/80 space-y-1">
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            >
              <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-300 font-semibold shrink-0">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-200 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition focus-visible:ring-1 focus-visible:ring-rose-500 outline-none text-left"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Log out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Left Drawer (Sliding from Left) */}
        {drawerOpen && (
          <div
            className="md:hidden fixed inset-0 z-50 flex"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Drawer"
          >
            {/* Backdrop overlay */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />

            {/* Sliding Drawer Content */}
            <div className="relative w-64 max-w-[80vw] bg-slate-900 border-r border-slate-800 h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
              {/* Drawer Top Header */}
              <div className="h-13 px-4 flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white">
                    <Mail className="w-3 h-3" />
                  </div>
                  <span className="font-semibold text-sm text-white">Mailo</span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-1.5 text-slate-400 hover:text-white rounded-md focus-visible:ring-1 focus-visible:ring-blue-500 outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                        active
                          ? "bg-blue-600 text-white"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Drawer Bottom Profile & Logout */}
              <div className="p-3 border-t border-slate-800 space-y-2">
                <div className="px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition text-left"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
