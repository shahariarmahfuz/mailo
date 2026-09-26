"use client";

import { useEffect, useState } from "react";
import { Settings, User, Shield, LogOut, Copy, Check } from "lucide-react";
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
      ? `${window.location.origin}/api/internal/email/incoming`
      : "/api/internal/email/incoming";

  function copyWebhook() {
    navigator.clipboard.writeText(workerWebhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500 text-xs">Loading settings...</div>;
  }

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-4">
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight">Settings</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Account information and Cloudflare Worker webhook parameters.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-4 space-y-3">
        <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-blue-400" />
          <span>Profile</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded">
            <span className="text-[11px] text-slate-500 block mb-0.5">Name</span>
            <span className="text-slate-100 font-medium truncate block">{user?.name}</span>
          </div>

          <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded">
            <span className="text-[11px] text-slate-500 block mb-0.5">Login Email</span>
            <span className="text-slate-100 font-medium truncate block">{user?.email}</span>
          </div>

          <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded">
            <span className="text-[11px] text-slate-500 block mb-0.5">User ID</span>
            <span className="text-slate-400 font-mono text-[11px] truncate block">{user?.id}</span>
          </div>

          <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded">
            <span className="text-[11px] text-slate-500 block mb-0.5">Member Since</span>
            <span className="text-slate-200">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Cloudflare Worker Webhook Card */}
      <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-4 space-y-3">
        <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cloudflare Worker Webhook</span>
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Configure your Cloudflare Email Worker to forward raw RFC822 MIME emails to this endpoint:
        </p>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={workerWebhookUrl}
            className="flex-1 bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 px-3 py-1.5 rounded outline-none"
          />
          <button
            onClick={copyWebhook}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition shrink-0"
            title="Copy Webhook URL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Sign Out Card */}
      <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold text-slate-200">Session</h2>
          <p className="text-xs text-slate-500 mt-0.5">Log out from your account on this device.</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-400 text-xs font-medium px-3 py-1.5 rounded transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
