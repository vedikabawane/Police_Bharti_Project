from html import escape
import re
from urllib.parse import urlsplit


SUBJECT_PREFIXES = {
    "TEST": "नवीन चाचणी उपलब्ध",
    "STUDY_MATERIAL": "नवीन अभ्यास साहित्य उपलब्ध",
    "VIDEO": "नवीन अभ्यास व्हिडिओ उपलब्ध",
    "RESULT": "चाचणी निकाल उपलब्ध",
}
KNOWN_ROUTE_PATTERNS = (
    re.compile(r"^/student/tests/[1-9][0-9]*$"),
    re.compile(r"^/student/tests/[1-9][0-9]*/result/[1-9][0-9]*$"),
)


def _known_student_route(path):
    return path in {"/student/study", "/student/tests/history"} or any(
        pattern.fullmatch(path) for pattern in KNOWN_ROUTE_PATTERNS
    )


def safe_application_link(base_url, path):
    """Join a known route to a configured HTTP(S) frontend origin."""
    if not base_url or not _known_student_route(path):
        return None
    parsed = urlsplit(base_url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return None
    if parsed.username or parsed.password or parsed.query or parsed.fragment:
        return None
    if parsed.path not in {"", "/"}:
        return None
    return f"{base_url.rstrip('/')}{path}"


def notification_email(notification_type, title, message, link=None,
                       app_name="Police Bharti Platform"):
    kind = str(notification_type or "SYSTEM").upper()
    prefix = SUBJECT_PREFIXES.get(kind)
    subject = f"{prefix} - {title}" if prefix else title

    safe_app = escape(str(app_name), quote=True)
    safe_title = escape(str(title), quote=True)
    safe_message = escape(str(message), quote=True)
    parsed_link = urlsplit(link) if isinstance(link, str) else None
    valid_link = bool(
        parsed_link
        and parsed_link.scheme in {"http", "https"}
        and parsed_link.netloc
        and not parsed_link.username
        and not parsed_link.password
        and not parsed_link.query
        and not parsed_link.fragment
        and _known_student_route(parsed_link.path)
    )
    safe_link = escape(link, quote=True) if valid_link else None
    text = f"{app_name}\n\n{title}\n\n{message}"
    html_parts = [
        "<!doctype html><html><body>",
        f"<p><strong>{safe_app}</strong></p>",
        f"<h1>{safe_title}</h1>",
        f"<p>{safe_message.replace(chr(10), '<br>')}</p>",
    ]
    if safe_link:
        text += f"\n\nOpen: {link}"
        html_parts.append(f'<p><a href="{safe_link}">Open in {safe_app}</a></p>')
    html_parts.append("</body></html>")
    return {
        "subject": subject,
        "text": text,
        "html": "".join(html_parts),
    }
