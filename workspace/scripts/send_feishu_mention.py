#!/usr/bin/env python3
"""Send feishu group message with proper @ mention using Feishu API

Usage:
    python3 send_feishu_mention.py <chat_id> <user_id> <message>
    python3 send_feishu_mention.py <chat_id> <user_id> <message> [title]

Environment variables:
    FEISHU_APP_ID     - Feishu app ID
    FEISHU_APP_SECRET - Feishu app secret
"""
import json
import sys
import os
import time
import logging
from datetime import datetime, timedelta
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# API 配置
FEISHU_TOKEN_URL = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal"
FEISHU_MSG_URL = "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id"

# 默认超时（秒）
DEFAULT_TIMEOUT = 15
# Token 缓存有效期（秒），飞书 token 有效期 2 小时，提前 5 分钟刷新
TOKEN_EXPIRY_SECONDS = (2 * 60 * 60) - (5 * 60)

# 全局 token 缓存
_token_cache = {
    "token": None,
    "expires_at": 0
}


def get_app_credentials() -> tuple:
    """获取飞书应用凭证（优先环境变量，fallback openclaw.json）"""
    app_id = os.environ.get("FEISHU_APP_ID")
    app_secret = os.environ.get("FEISHU_APP_SECRET")
    
    if not app_id or not app_secret:
        # fallback: 从 openclaw.json 读取
        config_path = os.path.expanduser("~/.openclaw/openclaw.json")
        if os.path.exists(config_path):
            with open(config_path) as f:
                config = json.load(f)
            accounts = config.get("channels", {}).get("feishu", {}).get("accounts", {})
            main = accounts.get("main", {})
            app_id = app_id or main.get("appId")
            app_secret = app_secret or main.get("appSecret")
    
    if not app_id or not app_secret:
        logger.error("缺少飞书凭证: 请设置 FEISHU_APP_ID/FEISHU_APP_SECRET 环境变量或在 openclaw.json 中配置")
        sys.exit(1)
    
    return app_id, app_secret


def get_token(force_refresh: bool = False) -> str:
    """获取 tenant access token，带缓存"""
    global _token_cache
    
    # 检查缓存是否有效
    if not force_refresh and _token_cache["token"]:
        if time.time() < _token_cache["expires_at"]:
            logger.debug("使用缓存的 token")
            return _token_cache["token"]
    
    app_id, app_secret = get_app_credentials()
    
    payload = json.dumps({
        "app_id": app_id,
        "app_secret": app_secret
    })
    
    req = Request(
        FEISHU_TOKEN_URL,
        data=payload.encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    
    logger.info("正在获取飞书 access token...")
    
    try:
        with urlopen(req, timeout=DEFAULT_TIMEOUT) as resp:
            data = json.loads(resp.read().decode('utf-8'))
    except URLError as e:
        logger.error(f"网络请求失败: {e}")
        raise
    
    if data.get("code") != 0:
        logger.error(f"获取 token 失败: code={data.get('code')}, msg={data.get('msg')}")
        raise Exception(f"获取 token 失败: {data}")
    
    token = data["tenant_access_token"]
    expires_in = data.get("expire", TOKEN_EXPIRY_SECONDS)
    
    _token_cache["token"] = token
    _token_cache["expires_at"] = time.time() + min(expires_in, TOKEN_EXPIRY_SECONDS)
    
    logger.info("✅ Token 获取成功")
    return token


def send_message_with_retry(token: str, chat_id: str, user_id: str, message: str, 
                            title: str = "提醒", max_retries: int = 3) -> dict:
    """发送带 @ 的群消息，带重试机制"""
    
    # 构造正确的飞书 post 消息格式
    content = {
        "zh_cn": {
            "title": title,
            "content": [
                [
                    {"tag": "at", "user_id": user_id},
                    {"tag": "text", "text": f" {message}"}
                ]
            ]
        }
    }
    
    payload = {
        "receive_id": chat_id,
        "msg_type": "post",
        "content": json.dumps(content, ensure_ascii=False)
    }
    
    last_error = None
    
    for attempt in range(1, max_retries + 1):
        req = Request(
            FEISHU_MSG_URL,
            data=json.dumps(payload).encode('utf-8'),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            }
        )
        
        logger.info(f"发送消息 (尝试 {attempt}/{max_retries})...")
        
        try:
            with urlopen(req, timeout=DEFAULT_TIMEOUT) as resp:
                data = json.loads(resp.read().decode('utf-8'))
        except HTTPError as e:
            # HTTP 4xx 错误一般不需要重试
            if 400 <= e.code < 500:
                logger.error(f"HTTP 客户端错误 {e.code}，不再重试")
                raise
            last_error = e
            logger.warning(f"HTTP 错误 {e.code}，准备重试...")
            time.sleep(1 * attempt)  # 指数退避
            continue
        except URLError as e:
            last_error = e
            logger.warning(f"网络错误: {e}，准备重试...")
            time.sleep(1 * attempt)
            continue
        
        if data.get("code") == 0:
            logger.info("✅ 消息发送成功")
            return data
        
        # Token 过期则刷新后重试
        if data.get("code") == 99991663:
            logger.warning("Token 已过期，刷新后重试...")
            get_token(force_refresh=True)
            token = _token_cache["token"]
            # 更新 payload 中的 Authorization
            req = Request(
                FEISHU_MSG_URL,
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}"
                }
            )
            try:
                with urlopen(req, timeout=DEFAULT_TIMEOUT) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                if data.get("code") == 0:
                    logger.info("✅ 消息发送成功")
                    return data
            except (HTTPError, URLError) as e:
                last_error = e
        
        # 其他错误
        if attempt < max_retries:
            logger.warning(f"发送失败，1秒后重试: code={data.get('code')}, msg={data.get('msg')}")
            time.sleep(1)
        else:
            logger.error(f"发送最终失败: {data}")
            raise Exception(f"发送消息失败: code={data.get('code')}, msg={data.get('msg')}")
    
    raise last_error or Exception("发送消息失败")


def validate_id(chat_id: str, user_id: str) -> bool:
    """简单的 ID 格式校验"""
    if not chat_id or not user_id:
        return False
    # 飞书 chat_id 一般是 oc_ 开头或群组 ID
    # user_id 是 ou_ 开头
    if not (chat_id.startswith("oc_") or chat_id.startswith("group_")):
        logger.warning(f"chat_id 格式可能不正确: {chat_id}")
    if not user_id.startswith("ou_"):
        logger.warning(f"user_id 格式可能不正确: {user_id}")
    return True


def main():
    if len(sys.argv) < 4:
        print("用法: python3 send_feishu_mention.py <chat_id> <user_id> <message> [title]")
        print("示例: python3 send_feishu_mention.py oc_xxxxx ou_xxxxx '开会了' '会议提醒'")
        sys.exit(1)
    
    chat_id = sys.argv[1]
    user_id = sys.argv[2]
    message = sys.argv[3]
    title = sys.argv[4] if len(sys.argv) > 4 else "提醒"
    
    # 参数校验
    validate_id(chat_id, user_id)
    
    logger.info(f"目标 chat_id: {chat_id}")
    logger.info(f"目标 user_id: {user_id}")
    logger.info(f"消息内容: {message}")
    logger.info(f"消息标题: {title}")
    
    # 获取 token（带缓存）
    token = get_token()
    
    # 发送消息（带重试）
    result = send_message_with_retry(token, chat_id, user_id, message, title)
    
    logger.info(f"发送结果: {result}")
    print(f"\n✅ 消息发送成功!")
    print(f"   message_id: {result.get('data', {}).get('message_id', 'N/A')}")


if __name__ == "__main__":
    main()