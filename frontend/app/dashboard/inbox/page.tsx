"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Inbox as InboxIcon,
  Star,
  Mail,
  MailOpen,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Paperclip,
  CheckCircle,
  X,
  Clock,
  User,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import { EmailSummary, EmailDetail, Mailbox } from "@/types";

export default function InboxPage() {
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [selectedMailboxId, setSelectedMailboxId] = useState<string>("");
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [starredOnly, setStarredOnly] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Selected email for detail view
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [emailDetail, setEmailDetail] = useState<EmailDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailTab, setDetailTab] = useState<"html" | "text">("html");

  // Load Mailboxes
  const loadMailboxes = useCallback(async () => {
    try {
      const mbs = await api.getMailboxes();
      setMailboxes(mbs);
    } catch (err) {
      console.error("Failed to load mailboxes:", err);
    }
  }, []);

  // Load Inbox Emails
  const loadEmails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getEmails({
        mailbox_id: selectedMailboxId || undefined,
        page,
        limit: 25,
        unread_only: unreadOnly,
        starred_only: starredOnly,
        search: search || undefined,
      });
      setEmails(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error("Failed to load emails:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedMailboxId, page, unreadOnly, starredOnly, search]);

  useEffect(() => {
    loadMailboxes();
  }, [loadMailboxes]);

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  // Open Email Detail
  async function handleOpenEmail(emailId: string) {
    setSelectedEmailId(emailId);
    setDetailLoading(true);
    try {
      const detail = await api.getEmailDetail(emailId);
      setEmailDetail(detail);
      setDetailTab(detail.html_body ? "html" : "text");
      // Update local read state in list
      setEmails((prev) =>
        prev.map((e) => (e.id === emailId ? { ...e, is_read: true } : e))
      );
    } catch (err) {
      console.error("Failed to load email detail:", err);
    } finally {
      setDetailLoading(false);
    }
  }

  // Toggle Star
  async function handleToggleStar(e: React.MouseEvent, emailId: string, currentStarred: boolean) {
    e.stopPropagation();
    const newStatus = !currentStarred;
    // optimistic update
    setEmails((prev) =>
      prev.map((item) => (item.id === emailId ? { ...item, is_starred: newStatus } : item))
    );
    if (emailDetail && emailDetail.id === emailId) {
      setEmailDetail({ ...emailDetail, is_starred: newStatus });
    }
    try {
      await api.updateEmailStatus(emailId, { is_starred: newStatus });
    } catch {
      // rollback
      setEmails((prev) =>
        prev.map((item) => (item.id === emailId ? { ...item, is_starred: currentStarred } : item))
      );
    }
  }

  // Toggle Read
  async function handleToggleRead(e: React.MouseEvent, emailId: string, currentRead: boolean) {
    e.stopPropagation();
    const newStatus = !currentRead;
    setEmails((prev) =>
      prev.map((item) => (item.id === emailId ? { ...item, is_read: newStatus } : item))
    );
    if (emailDetail && emailDetail.id === emailId) {
      setEmailDetail({ ...emailDetail, is_read: newStatus });
    }
    try {
      await api.updateEmailStatus(emailId, { is_read: newStatus });
    } catch {
      setEmails((prev) =>
        prev.map((item) => (item.id === emailId ? { ...item, is_read: currentRead } : item))
      );
    }
  }

  // Delete Email
  async function handleDeleteEmail(emailId: string) {
    if (!confirm("Are you sure you want to delete this email?")) return;
    try {
      await api.deleteEmail(emailId);
      setEmails((prev) => prev.filter((e) => e.id !== emailId));
      if (selectedEmailId === emailId) {
        setSelectedEmailId(null);
        setEmailDetail(null);
      }
    } catch (err) {
      alert("Failed to delete email");
    }
  }

  // Format Date cleanly
  function formatDate(isoStr: string) {
    const d = new Date(isoStr);
    const now = new Date();
    const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diffHours < 168) {
      return d.toLocaleDateString([], { weekday: "short" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950">
      {/* Top Controls Bar */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Mailbox Switcher Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
              Mailbox:
            </span>
            <select
              value={selectedMailboxId}
              onChange={(e) => {
                setSelectedMailboxId(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-3 py-1.5 focus:border-blue-500 outline-none transition"
            >
              <option value="">All Mailboxes ({mailboxes.reduce((acc, m) => acc + m.email_count, 0)})</option>
              {mailboxes.map((mb) => (
                <option key={mb.id} value={mb.id}>
                  {mb.name} ({mb.address}) — {mb.email_count}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Filters & Refresh */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setUnreadOnly(!unreadOnly);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                unreadOnly
                  ? "bg-blue-600/20 border-blue-500 text-blue-400"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Unread Only
            </button>
            <button
              onClick={() => {
                setStarredOnly(!starredOnly);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1 ${
                starredOnly
                  ? "bg-amber-500/20 border-amber-500 text-amber-400"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Star className="w-3 h-3 fill-current" /> Starred
            </button>
            <button
              onClick={() => loadEmails()}
              title="Refresh Inbox"
              className="p-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search emails by sender, recipient, or subject..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 outline-none transition"
          />
        </div>
      </div>

      {/* Main Content: Email List or Email Viewer */}
      <div className="flex-1 overflow-hidden relative">
        {/* Email Detail View Overlay / Screen */}
        {selectedEmailId && (
          <div className="absolute inset-0 bg-slate-950 z-20 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="border-b border-slate-800 bg-slate-900/90 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedEmailId(null);
                    setEmailDetail(null);
                  }}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white bg-slate-800/80 px-3 py-1.5 rounded-lg transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Inbox
                </button>
                {emailDetail && (
                  <button
                    onClick={(e) => handleToggleStar(e, emailDetail.id, emailDetail.is_starred)}
                    className="p-1.5 text-slate-400 hover:text-amber-400"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        emailDetail.is_starred ? "text-amber-400 fill-amber-400" : ""
                      }`}
                    />
                  </button>
                )}
              </div>

              {emailDetail && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteEmail(emailDetail.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                    title="Delete Email"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Email Content Body */}
            {detailLoading ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Loading email content...</span>
                </div>
              </div>
            ) : emailDetail ? (
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
                {/* Subject & Metadata */}
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white mb-4">
                    {emailDetail.subject || "(No Subject)"}
                  </h1>

                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-2 text-sm">
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-medium w-12 shrink-0">From:</span>
                        <span className="text-slate-100 font-semibold">{emailDetail.sender}</span>
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {new Date(emailDetail.received_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium w-12 shrink-0">To:</span>
                      <span className="text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded text-xs">
                        {emailDetail.recipient}
                      </span>
                    </div>

                    {emailDetail.cc && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-medium w-12 shrink-0">CC:</span>
                        <span className="text-slate-300 text-xs">{emailDetail.cc}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* View Tabs */}
                {emailDetail.html_body && emailDetail.plain_text_body && (
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <button
                      onClick={() => setDetailTab("html")}
                      className={`text-xs font-semibold px-3 py-1 rounded-lg transition ${
                        detailTab === "html"
                          ? "bg-blue-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Rich HTML
                    </button>
                    <button
                      onClick={() => setDetailTab("text")}
                      className={`text-xs font-semibold px-3 py-1 rounded-lg transition ${
                        detailTab === "text"
                          ? "bg-blue-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Plain Text
                    </button>
                  </div>
                )}

                {/* Rendered Body */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-6 min-h-[300px]">
                  {detailTab === "html" && emailDetail.html_body ? (
                    <div
                      className="prose prose-invert max-w-none text-slate-200"
                      dangerouslySetInnerHTML={{ __html: emailDetail.html_body }}
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-sm text-slate-200 leading-relaxed">
                      {emailDetail.plain_text_body || emailDetail.html_body || "(No message body content)"}
                    </pre>
                  )}
                </div>

                {/* Attachments Section */}
                {emailDetail.attachments && emailDetail.attachments.length > 0 && (
                  <div className="pt-4 border-t border-slate-800/80">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Paperclip className="w-3.5 h-3.5" /> Attachments ({emailDetail.attachments.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {emailDetail.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                        >
                          <span className="font-medium text-slate-200 truncate">{att.filename}</span>
                          <span className="text-slate-500 shrink-0 ml-2">
                            {(att.size_bytes / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Email List View */}
        <div className="h-full overflow-y-auto">
          {loading && emails.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">Loading emails...</div>
          ) : emails.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <InboxIcon className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-base font-medium text-slate-400">No emails found</p>
              <p className="text-xs text-slate-500 mt-1">
                Incoming emails sent to your mailboxes will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {emails.map((email) => {
                const isUnread = !email.is_read;
                return (
                  <div
                    key={email.id}
                    onClick={() => handleOpenEmail(email.id)}
                    className={`flex items-start sm:items-center gap-3 px-4 py-3.5 cursor-pointer transition hover:bg-slate-900/60 ${
                      isUnread ? "bg-slate-900/30" : "opacity-80 hover:opacity-100"
                    }`}
                  >
                    {/* Star & Read Indicator */}
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5 sm:mt-0">
                      <button
                        onClick={(e) => handleToggleStar(e, email.id, email.is_starred)}
                        className="p-1 text-slate-500 hover:text-amber-400 transition"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            email.is_starred ? "text-amber-400 fill-amber-400" : ""
                          }`}
                        />
                      </button>
                      <button
                        onClick={(e) => handleToggleRead(e, email.id, email.is_read)}
                        className="p-1 text-slate-500 hover:text-blue-400 transition"
                      >
                        {isUnread ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500" />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full border border-slate-700" />
                        )}
                      </button>
                    </div>

                    {/* Sender & Recipient badge */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-0.5">
                        <span
                          className={`text-sm truncate ${
                            isUnread ? "font-bold text-white" : "font-normal text-slate-300"
                          }`}
                        >
                          {email.sender}
                        </span>
                        <span className="text-xs text-slate-500 shrink-0 whitespace-nowrap">
                          {formatDate(email.received_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <p
                          className={`text-xs truncate ${
                            isUnread ? "text-slate-200 font-semibold" : "text-slate-400"
                          }`}
                        >
                          {email.subject || "(No Subject)"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono bg-slate-800/80 text-slate-400 px-1.5 py-0.5 rounded">
                          To: {email.mailbox_address}
                        </span>
                        {email.has_attachments && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <Paperclip className="w-2.5 h-2.5" /> Attachment
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="border-t border-slate-800/80 bg-slate-900/60 px-4 py-3 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page <b className="text-slate-200">{page}</b> of <b className="text-slate-200">{totalPages}</b> ({total} emails)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
