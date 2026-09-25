import email
from email import policy
from email.utils import parseaddr
from pathlib import Path
from typing import Dict, Any, List, Optional
import uuid
import logging

logger = logging.getLogger("mime_service")


class MimeService:
    @staticmethod
    def extract_clean_email(header_val: Optional[str]) -> str:
        """Extracts plain clean email address e.g. 'John Doe <john@domain.com>' -> 'john@domain.com'"""
        if not header_val:
            return ""
        name, addr = parseaddr(header_val)
        return addr.lower().strip() if addr else header_val.lower().strip()

    @staticmethod
    def parse_raw_mime(raw_bytes: bytes, storage_dir: Optional[str] = None) -> Dict[str, Any]:
        """
        Parses raw MIME bytes using Python's standard email module.
        Returns parsed metadata, bodies, attachments, and saves raw file if storage_dir given.
        """
        try:
            msg = email.message_from_bytes(raw_bytes, policy=policy.default)
        except Exception as e:
            logger.error(f"Failed to parse MIME stream with default policy: {e}")
            msg = email.message_from_bytes(raw_bytes, policy=policy.compat32)

        sender = str(msg.get("from", ""))
        recipient = str(msg.get("to", ""))
        cc = str(msg.get("cc", "")) if msg.get("cc") else None
        bcc = str(msg.get("bcc", "")) if msg.get("bcc") else None
        subject = str(msg.get("subject", "(No Subject)"))
        message_id = str(msg.get("message-id", "")) if msg.get("message-id") else None
        in_reply_to = str(msg.get("in-reply-to", "")) if msg.get("in-reply-to") else None
        references = str(msg.get("references", "")) if msg.get("references") else None

        plain_text_body = ""
        html_body = ""
        attachments: List[Dict[str, Any]] = []

        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition", ""))
                filename = part.get_filename()

                is_attachment = "attachment" in content_disposition or bool(filename)

                if is_attachment:
                    payload = part.get_payload(decode=True) or b""
                    att_info = {
                        "filename": filename or "attachment",
                        "content_type": content_type,
                        "size_bytes": len(payload),
                        "payload": payload,
                    }
                    attachments.append(att_info)
                elif content_type == "text/plain" and not plain_text_body:
                    try:
                        plain_text_body = part.get_content()
                    except Exception:
                        payload = part.get_payload(decode=True) or b""
                        plain_text_body = payload.decode("utf-8", errors="replace")
                elif content_type == "text/html" and not html_body:
                    try:
                        html_body = part.get_content()
                    except Exception:
                        payload = part.get_payload(decode=True) or b""
                        html_body = payload.decode("utf-8", errors="replace")
        else:
            content_type = msg.get_content_type()
            try:
                content = msg.get_content()
            except Exception:
                payload = msg.get_payload(decode=True) or b""
                content = payload.decode("utf-8", errors="replace")

            if content_type == "text/html":
                html_body = content
            else:
                plain_text_body = content

        # Save raw EML to storage if directory specified
        raw_storage_key = None
        if storage_dir:
            try:
                storage_path = Path(storage_dir)
                storage_path.mkdir(parents=True, exist_ok=True)
                file_id = uuid.uuid4().hex
                eml_filename = f"{file_id}.eml"
                target_file = storage_path / eml_filename
                with open(target_file, "wb") as f:
                    f.write(raw_bytes)
                raw_storage_key = str(target_file)
            except Exception as e:
                logger.error(f"Failed to persist raw EML: {e}")

        return {
            "sender": sender,
            "recipient": recipient,
            "clean_sender": MimeService.extract_clean_email(sender),
            "clean_recipient": MimeService.extract_clean_email(recipient),
            "cc": cc,
            "bcc": bcc,
            "subject": subject,
            "message_id": message_id,
            "in_reply_to": in_reply_to,
            "references": references,
            "plain_text_body": plain_text_body or None,
            "html_body": html_body or None,
            "attachments": attachments,
            "raw_storage_key": raw_storage_key,
            "size_bytes": len(raw_bytes),
        }
