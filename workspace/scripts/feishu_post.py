#!/usr/bin/env python3
"""
Feishu 群聊发消息脚本（支持 @ 人）
用法：python3 feishu_post.py <chat_id> <消息内容> <要@的open_id>
示例：python3 feishu_post.py oc_xxx "你好" ou_xxx

依赖：Python 3.x + urllib
"""

import json
import sys
import urllib.request

# 从 openclaw.json 获取 app_id 和 app_secret
CONFIG_PATH = "/home/node/.openclaw/openclaw.json"

def get_token():
    with open(CONFIG_PATH) as f:
        d = json.load(f)
        accounts = d['channels']['feishu']['accounts']
        main_acct = accounts.get('main') or accounts.get(list(accounts.keys())[0])
        app_id = main_acct['appId']
        app_secret = main_acct['appSecret']

    req = urllib.request.Request(
        'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
        data=json.dumps({'app_id': app_id, 'app_secret': app_secret}).encode(),
        headers={'Content-Type': 'application/json'}
    )
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())['tenant_access_token']

def send_post(chat_id, text, at_open_id=None):
    token = get_token()

    content_blocks = []
    if at_open_id:
        content_blocks.append({"tag": "at", "user_id": at_open_id})
    content_blocks.append({"tag": "text", "text": " " + text})

    content_obj = {
        "zh_cn": {
            "title": "",
            "content": [content_blocks]
        }
    }

    payload = {
        "receive_id": chat_id,
        "msg_type": "post",
        "content": json.dumps(content_obj, ensure_ascii=True)
    }

    req = urllib.request.Request(
        'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id',
        data=json.dumps(payload).encode(),
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    )
    resp = urllib.request.urlopen(req)
    result = json.loads(resp.read())

    if result.get('code') == 0:
        print(f"✅ 发送成功，消息ID: {result['data']['message_id']}")
        mentions = result['data'].get('mentions', [])
        if mentions:
            print(f" @ 已点亮: {mentions[0].get('id', 'unknown')}")
        return True
    else:
        print(f"❌ 发送失败: {result.get('msg', 'unknown error')}")
        return False

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("用法: python3 feishu_post.py <chat_id> <消息内容> [要@的open_id]")
        print("示例: python3 feishu_post.py oc_xxx '你好' ou_xxx")
        sys.exit(1)

    chat_id = sys.argv[1]
    text = sys.argv[2]
    at_id = sys.argv[3] if len(sys.argv) > 3 else None

    send_post(chat_id, text, at_id)