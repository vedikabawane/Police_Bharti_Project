import logging
import re
import smtplib
from email.message import EmailMessage
from email.utils import parseaddr

from flask import current_app, has_app_context

from app.services.email_templates import notification_email


logger = logging.getLogger(__name__)
EMAIL_PATTERN = re.compile(r"^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$")


class EmailService:
    @staticmethod
    def is_valid_recipient(recipient):
        if not isinstance(recipient, str) or len(recipient) > 254:
            return False
        display_name, parsed = parseaddr(recipient.strip())
        return not display_name and parsed == recipient.strip() and bool(
            EMAIL_PATTERN.fullmatch(parsed)
        )

    @classmethod
    def send_notification(cls, recipient, notification_type, title, message,
                          link=None):
        if not has_app_context():
            logger.warning("Email delivery skipped because application config is unavailable.")
            return False
        if not current_app.config.get("MAIL_ENABLED", False):
            return False
        if not cls.is_valid_recipient(recipient):
            logger.warning("Email delivery skipped for an invalid recipient address.")
            return False

        config = current_app.config
        required = ("MAIL_HOST", "MAIL_PORT", "MAIL_FROM")
        if any(not config.get(key) for key in required):
            logger.error("Email delivery is enabled but SMTP configuration is incomplete.")
            return False
        sender = str(config.get("MAIL_FROM", "")).strip()
        _, sender_address = parseaddr(sender)
        if "\r" in sender or "\n" in sender or not EMAIL_PATTERN.fullmatch(sender_address):
            logger.error("Email delivery configuration has an invalid sender address.")
            return False
        username = config.get("MAIL_USERNAME")
        password = config.get("MAIL_PASSWORD")
        if bool(username) != bool(password):
            logger.error("Email delivery is enabled with incomplete SMTP authentication settings.")
            return False

        try:
            content = notification_email(
                notification_type,
                title,
                message,
                link,
                config.get("APP_NAME") or "Police Bharti Platform",
            )
            mail = EmailMessage()
            mail["Subject"] = content["subject"]
            mail["From"] = sender
            mail["To"] = recipient
            mail.set_content(content["text"])
            mail.add_alternative(content["html"], subtype="html")

            smtp_class = (
                smtplib.SMTP_SSL
                if config.get("MAIL_USE_TLS", True) and config["MAIL_PORT"] == 465
                else smtplib.SMTP
            )
            with smtp_class(
                config["MAIL_HOST"], config["MAIL_PORT"],
                timeout=config.get("MAIL_TIMEOUT", 10),
            ) as smtp:
                smtp.ehlo()
                if config.get("MAIL_USE_TLS", True) and config["MAIL_PORT"] != 465:
                    smtp.starttls()
                    smtp.ehlo()
                if username or password:
                    smtp.login(username, password)
                smtp.send_message(mail)
            return True
        except (smtplib.SMTPException, OSError, TimeoutError) as error:
            # Exception text may contain provider data; log only the safe class name.
            logger.error("Email delivery failed (%s).", type(error).__name__)
            return False
        except Exception as error:
            logger.error("Email delivery failed unexpectedly (%s).", type(error).__name__)
            return False
