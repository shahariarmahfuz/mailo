"use client";

import { useEffect, useState } from "react";
import {
  Layers,
  Plus,
  Copy,
  Check,
  Star,
  Trash2,
  Power,
  Mail,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { Mailbox } from "@/types";

export default function MailboxesPage() {
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal / Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newName, setNewName] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadMailboxes() {
    setLoading(true);
    try {
      const data = await api.getMailboxes();
      setMailboxes(data);
    } catch (err) {
      console.error("Failed to load mailboxes:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMailboxes();
  }, []);

  function copyToClipboard(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleCreateMailbox(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      await api.createMailbox({
        address: newAddress,
        name: newName || "Mailbox",
        is_primary: isPrimary,
      });
      setShowAddModal(false);
      setNewAddress("");
      setNewName("");
      setIsPrimary(false);
      await loadMailboxes();
    } catch (err: any) {
      setFormError(err.message || "Failed to create mailbox.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(mb: Mailbox) {
    try {
      const updated = await api.updateMailbox(mb.id, {
        is_active: !mb.is_active,
      });
      setMailboxes((prev) =>
        prev.map((item) => (item.id === mb.id ? { ...item, is_active: updated.is_active } : item))
      );
    } catch (err) {
      alert("Failed to toggle mailbox status");
    }
  }

  async function handleSetPrimary(mb: Mailbox) {
    if (mb.is_primary) return;
    try {
      await api.updateMailbox(mb.id, { is_primary: true });
      await loadMailboxes();
    } catch (err) {
      alert("Failed to set primary mailbox");
    }
  }

  async function handleDelete(mailboxId: string) {
    if (!confirm("Are you sure you want to delete this mailbox? All its emails will be deleted.")) {
      return;
    }
    try {
      await api.deleteMailbox(mailboxId);
      setMailboxes((prev) => prev.filter((m) => m.id !== mailboxId));
    } catch (err) {
      alert("Failed to delete mailbox");
    }
  }

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-500" /> Mailboxes & Addresses
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your custom receiving addresses. Emails sent to any of these addresses will route to your dashboard.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-md shadow-blue-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Mailbox
        </button>
      </div>

      {/* Mailbox List Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm">Loading mailboxes...</div>
      ) : mailboxes.length === 0 ? (
        <div className="p-16 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
          <Mail className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-base font-medium text-slate-400">No mailboxes created yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Create an address like rahim@writo.xyz to start receiving incoming mail.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mailboxes.map((mb) => (
            <div
              key={mb.id}
              className={`p-5 rounded-2xl border transition bg-slate-900/60 flex flex-col justify-between ${
                mb.is_active ? "border-slate-800 hover:border-slate-700" : "border-slate-800/40 opacity-60"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-base">{mb.name}</span>
                    {mb.is_primary && (
                      <span className="text-[10px] font-semibold bg-blue-500/20 border border-blue-500/40 text-blue-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-current" /> Primary
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleActive(mb)}
                    title={mb.is_active ? "Disable Mailbox" : "Enable Mailbox"}
                    className={`p-1.5 rounded-lg text-xs font-medium transition ${
                      mb.is_active
                        ? "text-emerald-400 hover:bg-emerald-500/10"
                        : "text-slate-500 hover:bg-slate-800"
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>

                {/* Email Address with Copy Button */}
                <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800/80 px-3 py-2 rounded-xl text-xs font-mono text-slate-300 mb-4">
                  <span className="truncate">{mb.address}</span>
                  <button
                    onClick={() => copyToClipboard(mb.id, mb.address)}
                    className="p-1 hover:text-white transition shrink-0 ml-2"
                    title="Copy email address"
                  >
                    {copiedId === mb.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>
                    Total Emails: <b className="text-slate-200">{mb.email_count}</b>
                  </span>
                  <span>
                    Unread: <b className="text-blue-400">{mb.unread_count}</b>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                {!mb.is_primary ? (
                  <button
                    onClick={() => handleSetPrimary(mb)}
                    className="text-slate-400 hover:text-amber-400 transition flex items-center gap-1"
                  >
                    <Star className="w-3 h-3" /> Make Primary
                  </button>
                ) : (
                  <span className="text-slate-500 text-[11px]">Default Mailbox</span>
                )}

                <button
                  onClick={() => handleDelete(mb.id)}
                  className="text-slate-500 hover:text-rose-400 transition p-1"
                  title="Delete Mailbox"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Mailbox Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Create New Mailbox</h2>
            <p className="text-xs text-slate-400 mb-5">
              Emails arriving for this address via Cloudflare will automatically route here.
            </p>

            {formError && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateMailbox} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Mailbox Label / Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Work or Support"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. rahim.work@writo.xyz"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="primary-chk"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0"
                />
                <label htmlFor="primary-chk" className="text-xs text-slate-300 cursor-pointer">
                  Set as primary mailbox
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Save Mailbox"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
