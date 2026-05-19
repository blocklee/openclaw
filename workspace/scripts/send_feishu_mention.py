#!/usr/bin/env python3
"""Send feishu group message with proper @ mention using Feishu API"""
import json
import sys
import urllib.request
import urllib.error

# 飞书 API 配置
FEISHU_TOKEN_URL = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal"
FEISHU_MSG_URL = "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id"

# 从 openclaw.json 读取的凭证
APP_ID = "cli_aa8198b425389cef"
APP_SECRET = "k0S58IdXo8doVPNlcaQEydgNpcGdPNOT"

def get_token():
    """获取 tenant access token"""
    payload = json.dumps({
        "app_id": APP_ID,
        "app_secret": APP_SECRET
    })
    
    req = urllib.request.Request(
        FEISHU_TOKEN_URL,
        data=payload.encode('utf-8'),
        headers={"Content-Type": "application/json"}
    )
    
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        
    if data.get("code") != 0:
        raise Exception(f"获取 token 失败: {data}")
    
    return data["tenant_access_token"]

def send_message(token, chat_id, user_id, message):
    """发送带 @ 的群消息"""
    content = {
        "zh_cn": {
            "content": [
                [
                    {"tag": "at", "user_id": user_id},
                    {"tag": "text", "text": f" {message}"}
                ]
            ]
        }
    }
    
    content_str = json.dumps(content, ensure_ascii=False)
    
    payload = {
        "receive_id": chat_id,
        "msg_type": "post",
        "content": content_str
    }
    
    payload_str = json.dumps(payload)
    
    req = urllib.request.Request(
        FEISHU_MSG_URL,
        data=payload_str.encode('utf-8'),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
    )
    
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        
    if data.get("code") != 0:
        raise Exception(f"发送消息失败: {data}")
    
    return data

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("用法: python3 send_feishu_mention.py <chat_id> <user_id> <message>")
        sys.exit(1)
    
    chat_id = sys.argv[1]
    user_id = sys.argv[2]
    message = sys.argv[3]
    
    print("获取 token...")
    token = get_token()
    print(f"✅ Token 获取成功")
    
    print(f"发送消息到 {chat_id}，@ {user_id}...")
    result = send_message(token, chat_id, user_id, message)
    print(f"✅ 消息发送成功: {result}")