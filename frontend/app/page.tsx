import Link from "next/link";
import { Mail, Shield, Zap, Inbox, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            <Mail className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Mailo</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition shadow-md shadow-blue-600/20"
          >
            Sign up
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold mb-6">
          <Zap className="w-3.5 h-3.5" /> High-Performance Incoming Mail System
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
          Multiple mailboxes. <br className="hidden sm:inline" />
          One fast, unified dashboard.
        </h1>
        <p className="text-base sm:text-lg text-slate-400 mb-10 max-w-2xl leading-relaxed">
          Receive real incoming emails with Cloudflare Email Workers and FastAPI. 
          Manage infinite custom mailboxes for a single user account with zero clutter.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/signup"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3.5 rounded-xl transition shadow-lg shadow-blue-600/30"
          >
            Create Your Account <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white font-medium px-6 py-3.5 rounded-xl transition"
          >
            Existing User Login
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left w-full">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Multiple Mailboxes</h3>
            <p className="text-sm text-slate-400">
              One user can have multiple aliases and addresses: work, personal, testing. All unified in one inbox.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Blazing Fast</h3>
            <p className="text-sm text-slate-400">
              Server-side pagination, lightweight metadata queries, and on-demand MIME loading for instant response.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Cloudflare Email Worker</h3>
            <p className="text-sm text-slate-400">
              Direct edge processing forwards raw RFC822 MIME streams seamlessly into your PostgreSQL backend.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Mailo. Built for fast incoming email delivery.
      </footer>
    </div>
  );
}
