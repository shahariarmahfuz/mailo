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
  X,
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

  // Close modal on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && showAddModal) {
        setShowAddModal(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAddModal]);

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
    } catch {
      alert("Failed to toggle mailbox status");
    }
  }

  async function handleSetPrimary(mb: Mailbox) {
    if (mb.is_primary) return;
    try {
      await api.updateMailbox(mb.id, { is_primary: true });
      await loadMailboxes();
    } catch {
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
    } catch {
      alert("Failed to delete mailbox");
    }
  }

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Mailboxes</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your receiving addresses. Incoming emails to these addresses land in your inbox.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-md transition shrink-0 focus-visible:ring-1 focus-visible:ring-blue-500"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Mailbox</span>
        </button>
      </div>

      {/* Mailbox List */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 text-xs">Loading mailboxes...</div>
      ) : mailboxes.length === 0 ? (
        <div className="p-12 text-center text-slate-500 border border-slate-800 rounded-lg">
          <Mail className="w-8 h-8 mx-auto mb-2 text-slate-600 stroke-[1.5]" />
          <p className="text-xs font-medium text-slate-300">No mailboxes</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Create an address like rahim@writo.xyz to start receiving mail.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mailboxes.map((mb) => (
            <div
              key={mb.id}
              className={`p-3.5 rounded-lg border transition bg-slate-900/40 flex flex-col justify-between ${
                mb.is_active ? "border-slate-800 hover:border-slate-700" : "border-slate-800/40 opacity-60"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-white text-xs truncate">{mb.name}</span>
                    {mb.is_primary && (
                      <span className="text-[10px] bg-blue-500/10 border border-blue-500/30 text-blue-400 px-1.5 py-0.5 rounded font-medium shrink-0">
                        Primary
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleActive(mb)}
                    title={mb.is_active ? "Disable Mailbox" : "Enable Mailbox"}
                    className={`p-1 rounded transition ${
                      mb.is_active ? "text-emerald-400 hover:bg-emerald-500/10" : "text-slate-600 hover:text-slate-400"
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Email Address with Copy Button */}
                <div className="flex items-center justify-between bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded text-xs font-mono text-slate-300 mb-2">
                  <span className="truncate">{mb.address}</span>
                  <button
                    onClick={() => copyToClipboard(mb.id, mb.address)}
                    className="p-1 hover:text-white transition shrink-0 ml-1.5"
                    title="Copy address"
                  >
                    {copiedId === mb.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-500" />
                    )}
                  </button>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>
                    Emails: <b className="text-slate-200">{mb.email_count}</b>
                  </span>
                  <span>
                    Unread: <b className="text-blue-400">{mb.unread_count}</b>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                {!mb.is_primary ? (
                  <button
                    onClick={() => handleSetPrimary(mb)}
                    className="text-slate-400 hover:text-slate-200 transition text-[11px] flex items-center gap-1"
                  >
                    <Star className="w-3 h-3" /> Set Primary
                  </button>
                ) : (
                  <span className="text-slate-500 text-[11px]">Default</span>
                )}

                <button
                  onClick={() => handleDelete(mb.id)}
                  className="text-slate-500 hover:text-rose-400 transition p-1"
                  title="Delete Mailbox"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Mailbox Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 w-full max-w-sm shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Create Mailbox</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateMailbox} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Mailbox Label
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Work, Support"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. rahim.work@writo.xyz"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition"
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

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 rounded text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
