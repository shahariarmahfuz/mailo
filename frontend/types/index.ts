export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Mailbox {
  id: string;
  user_id: string;
  address: string;
  name: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  email_count: number;
  unread_count: number;
}

export interface EmailSummary {
  id: string;
  mailbox_id: string;
  mailbox_address: string;
  sender: string;
  recipient: string;
  subject: string;
  received_at: string;
  is_read: boolean;
  is_starred: boolean;
  size_bytes: number;
  has_attachments: boolean;
  preview?: string;
}

export interface Attachment {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
}

export interface EmailDetail {
  id: string;
  mailbox_id: string;
  mailbox_address: string;
  sender: string;
  recipient: string;
  cc?: string | null;
  bcc?: string | null;
  subject: string;
  message_id?: string | null;
  in_reply_to?: string | null;
  references?: string | null;
  received_at: string;
  is_read: boolean;
  is_starred: boolean;
  size_bytes: number;
  plain_text_body?: string | null;
  html_body?: string | null;
  attachments: Attachment[];
}

export interface EmailListResponse {
  items: EmailSummary[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
