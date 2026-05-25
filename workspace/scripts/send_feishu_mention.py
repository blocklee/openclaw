#!/usr/bin/env python3
"""Send feishu group message with proper @ mention using Feishu API

Usage:
    python3 send_feishu_mention.py <chat_id> <user_id> <message>
    python3 send_feishu_mention.py <chat_id> all <message>  (mention all)

Environment variables:
    FEISHU_APP_ID     - Feishu app ID
    FEISHU_APP_SECRET - Feishu app secret
"""
import json
import sys
import os
import time
import logging
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

FEISHU_TOKEN_URL = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal"
FEISHU_MSG_URL = "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id"
DEFAULT_TIMEOUT = 15
TOKEN_EXPIRY_SECONDS = (2 * 60 * 60) - (5 * 60)

_token_cache = {"token": None, "expires_at": 0}

def get_app_credentials() -> tuple:
    app_id = os.environ.get("FEISHU_APP_ID")
    app_secret = os.environ.get("FEISHU_APP_SECRET")
    
    if not app_id or not app_secret:
        config_path = os.path.expanduser("~/.openclaw/openclaw.json")
        if os.path.exists(config_path):
            with open(config_path) as f:
                config = json.load(f)
            accounts = config.get("channels", {}).get("feishu", {}).get("accounts", {})
            main = accounts.get("main", {})
            app_id = app_id or main.get("appId")
            app_secret = app_secret or main.get("appSecret")
    
    if not app_id or not app_secret:
        logger.error("Missing FEISHU credentials")
        sys.exit(1)
    
    return app_id, app_secret

def get_token(force_refresh: bool = False) -> str:
    global _token_cache
    
    if not force_refresh and _token_cache["token"]:
        if time.time() < _token_cache["expires_at"]:
            return _token_cache["token"]
    
    app_id, app_secret = get_app_credentials()
    
    payload = json.dumps({"app_id": app_id, "app_secret": app_secret})
    req = Request(FEISHU_TOKEN_URL, data=payload.encode('utf-8'), headers={"Content-Type": "application/json"})
    
    try:
        with urlopen(req, timeout=DEFAULT_TIMEOUT) as resp:
            data = json.loads(resp.read().decode('utf-8'))
    except URLError as e:
        logger.error(f"Network error: {e}")
        raise
    
    if data.get("code") != 0:
        logger.error(f"Token error: {data}")
        raise Exception(f"Failed to get token: {data}")
    
    _token_cache["token"] = data["tenant_access_token"]
    _token_cache["expires_at"] = time.time() + TOKEN_EXPIRY_SECONDS
    return _token_cache["token"]

def send_message_with_retry(token: str, chat_id: str, user_id: str, message: str) -> dict:
    """Send message with @ mention"""
    header = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
    
    # Build content with @ mention
    if user_id and user_id != "all":
        content = json.dumps([
            {"tag": "at", "user_id": user_id},
            {"tag": "text", "text": f"\n{message}"}
        ])
    elif user_id == "all":
        content = json.dumps([
            {"tag": "at", "user_id": "all"},
            {"tag": "text", "text": f"\n{message}"}
        ])
    else:
        content = json.dumps([{"tag": "text", "text": message}])
    
    payload = json.dumps({
        "receive_id": chat_id,
        "msg_type": "post",
        "content": content
    })
    
    req = Request(FEISHU_MSG_URL, data=payload.encode('utf-8'), headers=header)
    
    for attempt in range(3):
        try:
            with urlopen(req, timeout=DEFAULT_TIMEOUT) as resp:
                result = json.loads(resp.read().decode('utf-8'))
                
            if result.get("code") == 0:
                logger.info(f"Message sent successfully")
                return result
            elif result.get("code") == 10014:
                logger.warning(f"Token expired, refresh and retry")
                token = get_token(force_refresh=True)
                header["Authorization"] = f"Bearer {token}"
                req = Request(FEISHU_MSG_URL, data=payload.encode('utf-8'), headers=header)
                continue
            else:
                logger.error(f"Send failed: {result}")
                return result
        except HTTPError as e:
            if e.code == 429 and attempt < 2:
                logger.warning(f"Rate limited, wait 5s")
                time.sleep(5)
                continue
            logger.error(f"HTTP error: {e}")
            raise
        except URLError as e:
            logger.error(f"URL error: {e}")
            raise
    
    return {"code": -1, "msg": "All retries failed"}

def main():
    if len(sys.argv) < 4:
        print("Usage: python3 send_feishu_mention.py <chat_id> <user_id> <message>", file=sys.stderr)
        print("  user_id: ou_xxx or 'all' to mention all", file=sys.stderr)
        sys.exit(1)
    
    chat_id = sys.argv[1]
    user_id = sys.argv[2]
    message = sys.argv[3]
    
    token = get_token()
    result = send_message_with_retry(token, chat_id, user_id, message)
    
    if result.get("code") == 0:
        print("OK")
    else:
        print(f"FAILED: {result}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()