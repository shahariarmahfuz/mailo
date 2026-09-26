"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Star,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowLeft,
  Trash2,
  Inbox as InboxIcon,
  ChevronDown,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";
import { EmailSummary, EmailDetail, Mailbox } from "@/types";

export default function InboxPage() {
  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [selectedMailboxId, setSelectedMailboxId] = useState<string>("");
  const [mailboxDropdownOpen, setMailboxDropdownOpen] = useState<boolean>(false);

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

  // Selected mailbox label
  const currentMailboxLabel = useMemo(() => {
    if (!selectedMailboxId) return "All Mailboxes";
    const found = mailboxes.find((m) => m.id === selectedMailboxId);
    return found ? found.address : "All Mailboxes";
  }, [selectedMailboxId, mailboxes]);

  // Open Email Detail (lazy load body)
  async function handleOpenEmail(emailId: string) {
    setSelectedEmailId(emailId);
    setDetailLoading(true);
    try {
      const detail = await api.getEmailDetail(emailId);
      setEmailDetail(detail);
      setDetailTab(detail.html_body ? "html" : "text");
      // Mark as read in local state
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
    setEmails((prev) =>
      prev.map((item) => (item.id === emailId ? { ...item, is_starred: newStatus } : item))
    );
    if (emailDetail && emailDetail.id === emailId) {
      setEmailDetail({ ...emailDetail, is_starred: newStatus });
    }
    try {
      await api.updateEmailStatus(emailId, { is_starred: newStatus });
    } catch {
      setEmails((prev) =>
        prev.map((item) => (item.id === emailId ? { ...item, is_starred: currentStarred } : item))
      );
    }
  }

  // Delete Email
  async function handleDeleteEmail(emailId: string) {
    if (!confirm("Delete this email?")) return;
    try {
      await api.deleteEmail(emailId);
      setEmails((prev) => prev.filter((e) => e.id !== emailId));
      if (selectedEmailId === emailId) {
        setSelectedEmailId(null);
        setEmailDetail(null);
      }
    } catch {
      alert("Failed to delete email.");
    }
  }

  // Clean compact date formatting
  function formatReceivedDate(isoStr: string) {
    const d = new Date(isoStr);
    const now = new Date();
    const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24 && d.getDate() === now.getDate()) {
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
    if (d.getFullYear() === now.getFullYear()) {
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    }
    return d.toLocaleDateString([], { month: "numeric", day: "numeric", year: "2-digit" });
  }

  // Extract clean sender name
  function cleanSenderName(sender: string) {
    if (!sender) return "Unknown";
    const match = sender.match(/^([^<]+)/);
    if (match && match[1].trim()) {
      return match[1].replace(/["']/g, "").trim();
    }
    return sender;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* If an email is opened, show visually separated Email View */}
      {selectedEmailId ? (
        <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
          {/* Email View Header Bar */}
          <div className="h-12 border-b border-slate-800 bg-slate-900/60 px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedEmailId(null);
                  setEmailDetail(null);
                }}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white px-2.5 py-1 rounded-md hover:bg-slate-800 transition focus-visible:ring-1 focus-visible:ring-blue-500"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              {emailDetail && (
                <button
                  onClick={(e) => handleToggleStar(e, emailDetail.id, emailDetail.is_starred)}
                  className="p-1.5 text-slate-400 hover:text-amber-400 rounded-md transition"
                  title={emailDetail.is_starred ? "Unstar" : "Star"}
                >
                  <Star
                    className={`w-4 h-4 ${
                      emailDetail.is_starred ? "text-amber-400 fill-amber-400" : ""
                    }`}
                  />
                </button>
              )}
            </div>

            {emailDetail && (
              <button
                onClick={() => handleDeleteEmail(emailDetail.id)}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800/80 transition"
                title="Delete email"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Email Content Body */}
          {detailLoading ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading email...</span>
              </div>
            </div>
          ) : emailDetail ? (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl w-full mx-auto space-y-4">
              {/* Subject */}
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight break-words">
                {emailDetail.subject || "(No Subject)"}
              </h1>

              {/* Sender & Recipient Metadata */}
              <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-3 sm:p-4 text-xs space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-slate-500 font-medium shrink-0">From:</span>
                    <span className="text-slate-200 font-semibold truncate">{emailDetail.sender}</span>
                  </div>
                  <span className="text-slate-500 shrink-0 whitespace-nowrap">
                    {new Date(emailDetail.received_at).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-slate-500 font-medium shrink-0">To:</span>
                  <span className="text-slate-300 font-mono truncate">{emailDetail.recipient}</span>
                </div>

                {emailDetail.cc && (
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-slate-500 font-medium shrink-0">CC:</span>
                    <span className="text-slate-400 font-mono truncate">{emailDetail.cc}</span>
                  </div>
                )}
              </div>

              {/* View Format Selector (if HTML exists) */}
              {emailDetail.html_body && emailDetail.plain_text_body && (
                <div className="flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
                  <button
                    onClick={() => setDetailTab("html")}
                    className={`text-xs px-2.5 py-1 rounded font-medium transition ${
                      detailTab === "html"
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    HTML
                  </button>
                  <button
                    onClick={() => setDetailTab("text")}
                    className={`text-xs px-2.5 py-1 rounded font-medium transition ${
                      detailTab === "text"
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Plain Text
                  </button>
                </div>
              )}

              {/* Email Content */}
              <div className="border border-slate-800/80 bg-slate-900/30 rounded-lg p-4 sm:p-5 min-h-[220px]">
                {detailTab === "html" && emailDetail.html_body ? (
                  <div
                    className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-200 break-words"
                    dangerouslySetInnerHTML={{ __html: emailDetail.html_body }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-200 leading-relaxed break-words">
                    {emailDetail.plain_text_body || emailDetail.html_body || "(No message body)"}
                  </pre>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        /* Inbox List Mode */
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Compact Toolbar */}
          <div className="border-b border-slate-800/80 bg-slate-900/40 p-2.5 sm:px-4 space-y-2 shrink-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {/* Compact Mailbox Selector */}
              <div className="relative">
                <button
                  onClick={() => setMailboxDropdownOpen(!mailboxDropdownOpen)}
                  className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium px-2.5 py-1.5 rounded-md transition focus-visible:ring-1 focus-visible:ring-blue-500 outline-none"
                  aria-haspopup="listbox"
                  aria-expanded={mailboxDropdownOpen}
                >
                  <span className="truncate max-w-[180px] sm:max-w-[220px]">
                    {currentMailboxLabel}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {/* Compact Dropdown Menu */}
                {mailboxDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setMailboxDropdownOpen(false)}
                    />
                    <div className="absolute left-0 mt-1 z-40 w-64 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 text-xs text-slate-200">
                      <button
                        onClick={() => {
                          setSelectedMailboxId("");
                          setPage(1);
                          setMailboxDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-800 transition ${
                          selectedMailboxId === "" ? "text-blue-400 font-semibold" : ""
                        }`}
                      >
                        <span>All Mailboxes</span>
                        {selectedMailboxId === "" && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <div className="border-t border-slate-800/80 my-1" />

                      {mailboxes.map((mb) => (
                        <button
                          key={mb.id}
                          onClick={() => {
                            setSelectedMailboxId(mb.id);
                            setPage(1);
                            setMailboxDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-800 transition truncate ${
                            selectedMailboxId === mb.id ? "text-blue-400 font-semibold" : ""
                          }`}
                        >
                          <span className="truncate">{mb.address}</span>
                          {selectedMailboxId === mb.id && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Quick Filters & Refresh */}
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  onClick={() => {
                    setUnreadOnly(!unreadOnly);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition ${
                    unreadOnly
                      ? "bg-blue-600/20 border-blue-500 text-blue-400"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  Unread
                </button>
                <button
                  onClick={() => {
                    setStarredOnly(!starredOnly);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition flex items-center gap-1 ${
                    starredOnly
                      ? "bg-amber-500/20 border-amber-500 text-amber-400"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Star className="w-3 h-3 fill-current" />
                  <span>Starred</span>
                </button>
                <button
                  onClick={() => loadEmails()}
                  aria-label="Refresh Inbox"
                  className="p-1.5 bg-slate-900 border border-slate-800 rounded text-slate-400 hover:text-white transition focus-visible:ring-1 focus-visible:ring-blue-500"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search inbox..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-slate-700 rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          {/* Email List - Compact Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {loading && emails.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">Loading emails...</div>
            ) : emails.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <InboxIcon className="w-8 h-8 mx-auto mb-2 text-slate-600 stroke-[1.5]" />
                <p className="text-xs font-medium text-slate-400">No emails</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Incoming mail will show up here automatically.
                </p>
              </div>
            ) : (
              emails.map((email) => {
                const isUnread = !email.is_read;
                const senderName = cleanSenderName(email.sender);
                const previewSnippet = email.preview || "";

                return (
                  <div
                    key={email.id}
                    onClick={() => handleOpenEmail(email.id)}
                    className={`flex items-center gap-2.5 px-3 sm:px-4 py-2.5 cursor-pointer transition hover:bg-slate-900/60 select-none ${
                      isUnread ? "bg-slate-900/30 font-medium" : "opacity-75 hover:opacity-100"
                    }`}
                  >
                    {/* Unread dot */}
                    <div className="w-1.5 h-1.5 rounded-full shrink-0">
                      {isUnread && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                    </div>

                    {/* Star icon */}
                    <button
                      onClick={(e) => handleToggleStar(e, email.id, email.is_starred)}
                      className="p-0.5 text-slate-600 hover:text-amber-400 shrink-0 transition"
                      aria-label={email.is_starred ? "Unstar email" : "Star email"}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          email.is_starred ? "text-amber-400 fill-amber-400" : ""
                        }`}
                      />
                    </button>

                    {/* Sender column (Fixed/max width for easy scan) */}
                    <span
                      className={`text-xs truncate w-28 sm:w-44 shrink-0 ${
                        isUnread ? "text-white font-semibold" : "text-slate-300"
                      }`}
                    >
                      {senderName}
                    </span>

                    {/* Subject + Short Preview on same line */}
                    <div className="flex-1 min-w-0 flex items-baseline gap-1.5 text-xs truncate">
                      <span className={`truncate ${isUnread ? "text-slate-100 font-semibold" : "text-slate-300"}`}>
                        {email.subject || "(No Subject)"}
                      </span>
                      {previewSnippet && (
                        <span className="hidden sm:inline text-slate-500 truncate font-normal">
                          — {previewSnippet}
                        </span>
                      )}
                    </div>

                    {/* Received Time (Right-aligned, compact) */}
                    <span className="text-[11px] text-slate-500 shrink-0 whitespace-nowrap ml-1">
                      {formatReceivedDate(email.received_at)}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Compact Pagination Bar */}
          {totalPages > 1 && (
            <div className="h-10 border-t border-slate-800 bg-slate-900/40 px-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span>
                Page {page} of {totalPages} ({total} emails)
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 transition"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 transition"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
