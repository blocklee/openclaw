#!/bin/bash
# Qitmeer节点状态检查脚本

API_URL="http://127.0.0.1:3000/api/status"

# 检查API是否可达
response=$(curl -s -w "%{http_code}" -o /tmp/qitmeer_status.json "$API_URL")

if [ "$response" != "200" ]; then
    echo "Qitmeer节点监控API不可达，HTTP状态码：$response"
    exit 1
fi

# 解析返回结果
status=$(cat /tmp/qitmeer_status.json | jq -r '.status' 2>/dev/null)
block_height=$(cat /tmp/qitmeer_status.json | jq -r '.data.block_height' 2>/dev/null)
node_online=$(cat /tmp/qitmeer_status.json | jq -r '.data.online' 2>/dev/null)
health=$(cat /tmp/qitmeer_status.json | jq -r '.data.health' 2>/dev/null)

# 检查是否获取到有效信息
if [ "$status" = "null" ] || [ "$block_height" = "null" ] || [ -z "$block_height" ]; then
    echo "Qitmeer节点状态异常：无法获取节点信息"
    exit 1
fi

if [ "$status" != "success" ]; then
    echo "Qitmeer节点状态异常：返回状态失败"
    exit 1
fi

if [ "$node_online" != "true" ]; then
    echo "Qitmeer节点离线！"
    exit 1
fi

if [ "$health" != "healthy" ]; then
    echo "Qitmeer节点健康状态异常：$health"
    exit 1
fi

# 检查块高是否停滞
LAST_BLOCK_FILE="/tmp/qitmeer_last_block"
if [ -f "$LAST_BLOCK_FILE" ]; then
    last_block=$(cat "$LAST_BLOCK_FILE")
    if [ "$block_height" -le "$last_block" ]; then
        echo "Qitmeer节点同步异常：块高停滞！当前块高：$block_height，上次检查块高：$last_block"
        exit 1
    fi
fi

# 保存当前块高
echo "$block_height" > "$LAST_BLOCK_FILE"

# 正常情况输出信息
echo "Qitmeer节点正常，当前块高：$block_height，状态健康"
exit 0
