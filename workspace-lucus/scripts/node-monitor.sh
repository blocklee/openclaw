#!/bin/bash

# 节点监控脚本 - 每两小时检查一次

API_URL="https://node.meerfans.club/api/status"
LOG_FILE="/home/node/.openclaw/workspace-lucus/logs/node-monitor.log"
ALERT_FILE="/home/node/.openclaw/workspace-lucus/logs/node-alerts.txt"

# 创建日志目录
mkdir -p /home/node/.openclaw/workspace-lucus/logs

# 获取状态
RESPONSE=$(curl -s --max-time 10 "$API_URL")

if [ $? -ne 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: 无法连接到API" >> "$LOG_FILE"
    echo "⚠️ 节点监控异常：无法连接到 API" 
    exit 1
fi

# 解析JSON并检查异常节点
echo "$RESPONSE" | jq -r '.nodes | to_entries[] | select(.value.stateroot.Valid == false) | .key' 2>/dev/null | while read -r node; do
    if [ -n "$node" ]; then
        ALERT_MSG="🚨 节点异常: $node"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] $ALERT_MSG" >> "$LOG_FILE"
        echo "$ALERT_MSG"
    fi
done

# 检查高度是否落后（与最高高度相比）
MAX_HEIGHT=$(echo "$RESPONSE" | jq -r '.nodes[].stateroot.Height' 2>/dev/null | sort -rn | head -1)

echo "$RESPONSE" | jq -r '.nodes | to_entries[] | .key as $name | .value.stateroot.Height as $height | select(($MAX_HEIGHT - $height) > 10) | "\($name) \($height) vs max \($MAX_HEIGHT)"' 2>/dev/null | while read -r line; do
    if [ -n "$line" ]; then
        ALERT_MSG="⚠️ 节点高度落后: $line"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] $ALERT_MSG" >> "$LOG_FILE"
        echo "$ALERT_MSG"
    fi
done

# 记录正常状态
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 节点检查完成，所有节点正常" >> "$LOG_FILE"

# 输出当前状态摘要
echo "📊 节点状态摘要:"
echo "$RESPONSE" | jq -r '.nodes | to_entries[] | "\(.key): Height=\(.value.stateroot.Height), Valid=\(.value.stateroot.Valid)"'