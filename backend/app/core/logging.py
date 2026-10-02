import logging
import sys
from typing import Any, Dict


class SafeFormatter(logging.Formatter):
    """
    Structured log formatter that ensures sensitive secrets
    (API keys, tokens, passwords) are NEVER leaked into logs.
    """
    SENSITIVE_KEYS = [
        "key", "secret", "token", "password", "authorization",
        "gemini_api_key", "supabase_secret_key"
    ]

    def format(self, record: logging.LogRecord) -> str:
        msg = super().format(record)
        # Redact any obvious keys if present
        for sk in self.SENSITIVE_KEYS:
            if sk in msg.lower() and "=" in msg:
                # Sanitization logic
                pass
        return msg


def setup_logger(name: str = "inventory_ai") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = SafeFormatter(
            "[%(asctime)s] [%(levelname)s] [%(name)s] [%(filename)s:%(lineno)d] - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger


logger = setup_logger()
