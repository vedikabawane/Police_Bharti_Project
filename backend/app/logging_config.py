import logging
import sys
import traceback

from app.config.config import production_safe_log_level


_HANDLER_MARKER = "_police_bharti_logging_handler"
_FILTER_MARKER = "_police_bharti_request_filter"
_FORMAT_MARKER = "_police_bharti_logging_formatter"


class RequestContextFilter(logging.Filter):
    """Add safe request context and remove exception text from log output."""

    def filter(self, record):
        record.request_id = "-"
        record.request_method = "-"
        record.request_endpoint = "-"

        from flask import has_request_context, request

        if has_request_context():
            record.request_id = request.environ.get(
                "police_bharti.request_id", "-"
            )
            record.request_method = request.method
            record.request_endpoint = request.endpoint or "-"

        if record.exc_info and not getattr(record, "_safe_exception_record", False):
            exception_type, _, traceback_object = record.exc_info
            frames = traceback.extract_tb(traceback_object)
            origin = (
                f"{frames[-1].name}:{frames[-1].lineno}"
                if frames
                else "unknown"
            )
            record.msg = (
                f"{record.getMessage()} "
                f"(error_type={exception_type.__name__}; origin={origin})"
            )
            record.args = ()
            record.exc_info = None
            record.exc_text = None
            record._safe_exception_record = True

        return True


def configure_logging(app):
    """Configure one process-stream handler and safe contextual formatting."""
    level_name = production_safe_log_level(
        app.config.get("LOG_LEVEL", "INFO"), app.config.get("APP_ENV")
    )
    level = getattr(logging, level_name, logging.INFO)
    app.config["LOG_LEVEL"] = logging.getLevelName(level)

    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    if not root_logger.handlers:
        handler = logging.StreamHandler(sys.stderr)
        setattr(handler, _HANDLER_MARKER, True)
        root_logger.addHandler(handler)

    formatter = logging.Formatter(
        "%(asctime)s %(levelname)s %(name)s "
        "request_id=%(request_id)s "
        "request=%(request_method)s %(request_endpoint)s %(message)s"
    )
    for handler in root_logger.handlers:
        if not any(getattr(item, _FILTER_MARKER, False) for item in handler.filters):
            request_filter = RequestContextFilter()
            setattr(request_filter, _FILTER_MARKER, True)
            handler.addFilter(request_filter)
        if not getattr(handler, _FORMAT_MARKER, False):
            handler.setFormatter(formatter)
            setattr(handler, _FORMAT_MARKER, True)
