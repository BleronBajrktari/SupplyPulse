"""
SupplyPulse — Slack Integration
=================================
Sends formatted restock alerts to a Slack channel via an
Incoming Webhook URL.

Required env vars:
  SLACK_WEBHOOK_URL — full webhook URL from Slack app config
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

import requests

logger = logging.getLogger("supplypulse.slack")


def send_slack_alert(payload: dict[str, Any]) -> bool:
    """
    POST a Block Kit payload to the Slack incoming webhook.

    Args:
        payload: A dict with a "blocks" key (Slack Block Kit format).

    Returns:
        True if Slack accepted the message, False otherwise.
    """
    webhook_url = os.environ["SLACK_WEBHOOK_URL"]

    logger.info("Sending alert to Slack …")
    try:
        response = requests.post(
            webhook_url,
            data=json.dumps(payload),
            headers={"Content-Type": "application/json"},
            timeout=10,
        )

        if response.status_code == 200 and response.text == "ok":
            logger.info("Slack alert sent successfully")
            return True
        else:
            logger.error(
                "Slack webhook failed: %d — %s",
                response.status_code, response.text,
            )
            return False

    except requests.RequestException as exc:
        logger.error("Slack webhook error: %s", exc)
        return False
