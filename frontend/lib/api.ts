import {
  User,
  Mailbox,
  EmailSummary,
  EmailDetail,
  EmailListResponse,
} from "@/types";

const API_BASE =
  typeof window !== "undefined"
    ? "/api"
    : process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("mailo_token");
  }
  return null;
}

export function setToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("mailo_token", token);
  }
}

export function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("mailo_token");
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // Include HTTP-only cookies
  });

  if (!res.ok) {
    let errorMsg = `Request failed: ${res.status}`;
    try {
      const errorJson = await res.json();
      errorMsg = errorJson.detail || errorJson.message || errorMsg;
    } catch {
      // ignore non-json
    }
    throw new Error(errorMsg);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const api = {
  // Auth
  async signup(data: { name: string; email: string; password: string; initial_mailbox_name?: string }) {
    const res = await request<{ access_token: string; user_id: string; email: string; name: string }>(
      "/auth/signup",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    setToken(res.access_token);
    return res;
  },

  async login(data: { email: string; password: string }) {
    const res = await request<{ access_token: string; user_id: string; email: string; name: string }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    setToken(res.access_token);
    return res;
  },

  async logout() {
    try {
      await request("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      clearToken();
    }
  },

  async getMe(): Promise<User> {
    return request<User>("/auth/me");
  },

  // Mailboxes
  async getMailboxes(): Promise<Mailbox[]> {
    return request<Mailbox[]>("/mailboxes");
  },

  async createMailbox(data: { address: string; name: string; is_primary?: boolean }): Promise<Mailbox> {
    return request<Mailbox>("/mailboxes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateMailbox(
    mailboxId: string,
    data: { name?: string; is_primary?: boolean; is_active?: boolean }
  ): Promise<Mailbox> {
    return request<Mailbox>(`/mailboxes/${mailboxId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteMailbox(mailboxId: string): Promise<void> {
    return request<void>(`/mailboxes/${mailboxId}`, {
      method: "DELETE",
    });
  },

  // Emails
  async getEmails(params: {
    mailbox_id?: string;
    page?: number;
    limit?: number;
    unread_only?: boolean;
    starred_only?: boolean;
    search?: string;
  }): Promise<EmailListResponse> {
    const searchParams = new URLSearchParams();
    if (params.mailbox_id) searchParams.set("mailbox_id", params.mailbox_id);
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());
    if (params.unread_only) searchParams.set("unread_only", "true");
    if (params.starred_only) searchParams.set("starred_only", "true");
    if (params.search) searchParams.set("search", params.search);

    const qs = searchParams.toString();
    return request<EmailListResponse>(`/emails${qs ? `?${qs}` : ""}`);
  },

  async getEmailDetail(emailId: string): Promise<EmailDetail> {
    return request<EmailDetail>(`/emails/${emailId}`);
  },

  async updateEmailStatus(
    emailId: string,
    data: { is_read?: boolean; is_starred?: boolean }
  ): Promise<{ id: string; is_read: boolean; is_starred: boolean }> {
    return request(`/emails/${emailId}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteEmail(emailId: string): Promise<void> {
    return request<void>(`/emails/${emailId}`, {
      method: "DELETE",
    });
  },
};
