from abc import ABC, abstractmethod


class SmsProviderError(Exception):
    """Base class for provider errors safe to classify without logging details."""

    def __init__(self, message="", code=None):
        super().__init__(message)
        self.code = code


class SmsTransientError(SmsProviderError):
    """A provider error that may succeed on a bounded retry."""


class SmsPermanentError(SmsProviderError):
    """A provider error that must not be retried."""


class SmsProvider(ABC):
    @abstractmethod
    def send_sms(self, recipient, message, idempotency_key, timeout):
        """Return True when the provider accepts the request."""


class MockSmsProvider(SmsProvider):
    """In-memory provider for tests and local development only."""

    messages = []
    _accepted_keys = set()

    def send_sms(self, recipient, message, idempotency_key, timeout):
        if idempotency_key not in self._accepted_keys:
            self.messages.append({
                "recipient": recipient,
                "message": message,
                "idempotency_key": idempotency_key,
                "timeout": timeout,
            })
            self._accepted_keys.add(idempotency_key)
        return True
