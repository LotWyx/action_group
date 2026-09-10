"""Optional integration with the MAX messenger Bot API (https://dev.max.ru).

Configure MAX_BOT_TOKEN to enable it. Without a token every call here is a
silent no-op, so the rest of the app works identically whether or not the
integration is set up. Each user opts in by saving their own chat id from
the "Уведомления" card on the dashboard.

API shape (per dev.max.ru/docs-api/methods/POST/messages, current domain
platform-api2.max.ru as of 2026): POST /messages?chat_id=<id> with an
`Authorization: Bearer <token>` header and a JSON body {"text": "..."}.
"""

import logging

import httpx

from .config import settings

logger = logging.getLogger("max_notify")


def is_configured() -> bool:
    return bool(settings.max_bot_token)


async def send_message(chat_id: str, text: str) -> bool:
    if not is_configured():
        logger.debug("MAX_BOT_TOKEN not set, skipping notification to %s", chat_id)
        return False
    if not chat_id:
        return False

    url = f"{settings.max_api_base_url}/messages"
    headers = {"Authorization": f"Bearer {settings.max_bot_token}"}
    params = {"chat_id": chat_id}
    body = {"text": text[:4000], "format": "markdown"}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(url, headers=headers, params=params, json=body)
            response.raise_for_status()
        return True
    except httpx.HTTPError as exc:
        logger.warning("MAX notification to %s failed: %s", chat_id, exc)
        return False
