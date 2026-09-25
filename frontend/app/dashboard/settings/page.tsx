"use client";

import { useEffect, useState } from "react";
import { Settings, User, Mail, Shield, LogOut, CheckCircle2, Copy, Check } from "lucide-react";
import { api } from "@/lib/api";
import { User as UserType } from "@/types";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const u = await api.getMe();
        setUser(u);
      } catch (err) {
        console.error("Failed to load user profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  async function handleLogout() {
    await api.logout();
    router.push("/login");
  }

  const workerWebhookUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:8000/api/internal/email/incoming`
      : "https://your-api.com/api/internal/email/incoming";

  function copyWebhook() {
    navigator.clipboard.writeText(workerWebhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500 text-sm">Loading settings...</div>;
  }

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-500" /> Account & System Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review your account profile and Cloudflare Worker integration parameters.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-blue-400" /> User Profile
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <span className="text-xs text-slate-400 font-medium block mb-1">Full Name</span>
            <span className="text-slate-100 font-semibold">{user?.name}</span>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <span className="text-xs text-slate-400 font-medium block mb-1">Login Email</span>
            <span className="text-slate-100 font-semibold">{user?.email}</span>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <span className="text-xs text-slate-400 font-medium block mb-1">User ID</span>
            <span className="text-slate-400 font-mono text-xs truncate block">{user?.id}</span>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <span className="text-xs text-slate-400 font-medium block mb-1">Member Since</span>
            <span className="text-slate-100">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Worker Integration Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-400" /> Cloudflare Email Worker Integration
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Your Cloudflare Email Worker forwards raw RFC822 MIME streams to the backend. The backend matches the recipient to your mailboxes automatically.
        </p>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Internal Worker Webhook URL:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={workerWebhookUrl}
              className="flex-1 bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 px-3.5 py-2.5 rounded-xl outline-none"
            />
            <button
              onClick={copyWebhook}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
              title="Copy Webhook URL"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <span>
            The Cloudflare Email Worker sends <code className="bg-blue-900/50 px-1 py-0.5 rounded">message.raw</code> with headers <code className="bg-blue-900/50 px-1 py-0.5 rounded">X-Email-From</code> and <code className="bg-blue-900/50 px-1 py-0.5 rounded">X-Email-To</code>.
          </span>
        </div>
      </div>

      {/* Sign Out Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Sign Out</h2>
          <p className="text-xs text-slate-400 mt-0.5">End your active session on this device.</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-400 text-xs font-medium px-4 py-2.5 rounded-xl transition"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}
