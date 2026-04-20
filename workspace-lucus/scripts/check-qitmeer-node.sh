#!/bin/bash
# Qitmeer节点状态检查脚本
API_URL="https://node.meerfans.club/api/status"
TMP_FILE="/tmp/qitmeer_status.json"
ERROR_COUNT=0
ERROR_MSG=""
NORMAL_COUNT=0
NORMAL_MSG=""
# 检查API是否可达，超时5秒
response=$(curl -s -w "%{http_code}" -o "$TMP_FILE" --connect-timeout 5 --max-time 10 "$API_URL")
if [ "$response" != "200" ]; then
    echo "❌ Qitmeer节点监控API不可达，HTTP状态码：$response"
    exit 1
fi
success=$(cat "$TMP_FILE" | jq -r '.success' 2>/dev/null)
if [ "$success" != "true" ]; then
    echo "❌ Qitmeer节点监控API返回失败"
    exit 1
fi
# 获取所有节点列表
node_keys=$(cat "$TMP_FILE" | jq -r '.nodes | keys[]' 2>/dev/null)
if [ -z "$node_keys" ]; then
    echo "❌ 未获取到任何节点信息"
    exit 1
fi
# 遍历检查每个节点状态
for node_key in $node_keys; do
    node_name=$(echo "$node_key" | cut -d'-' -f1)
    node_host=$(cat "$TMP_FILE" | jq -r ".nodes.\"$node_key\".host" 2>/dev/null)
    valid=$(cat "$TMP_FILE" | jq -r ".nodes.\"$node_key\".stateroot.Valid" 2>/dev/null)
    height=$(cat "$TMP_FILE" | jq -r ".nodes.\"$node_key\".stateroot.Height" 2>/dev/null)
    timestamp=$(cat "$TMP_FILE" | jq -r ".nodes.\"$node_key\".timestamp" 2>/dev/null)
    # 异常判断
    if [ "$valid" != "true" ] || [ -z "$height" ] || [ "$height" = "null" ]; then
        ERROR_COUNT=$((ERROR_COUNT+1))
        ERROR_MSG+="⚠️ 节点[$node_key]（$node_host）状态异常，Valid=$valid，块高=$height\n"
        continue
    fi
    # 检查块高是否停滞
    LAST_BLOCK_FILE="/tmp/qitmeer_${node_key}_last_block"
    if [ -f "$LAST_BLOCK_FILE" ]; then
        last_block=$(cat "$LAST_BLOCK_FILE")
        if [ "$height" -le "$last_block" ]; then
            ERROR_COUNT=$((ERROR_COUNT+1))
            ERROR_MSG+="⚠️ 节点[$node_key]（$node_host）同步异常：块高停滞！当前块高：$height，上次检查块高：$last_block\n"
            continue
        fi
    fi
    # 保存当前块高
    echo "$height" > "$LAST_BLOCK_FILE"
    NORMAL_COUNT=$((NORMAL_COUNT+1))
    NORMAL_MSG+="✅ 节点[$node_key]（$node_host）正常，块高：$height\n"
done
# 输出结果
if [ $ERROR_COUNT -gt 0 ]; then
    echo -e "\n❌ Qitmeer节点监控发现异常："
    echo -e "$ERROR_MSG"
    echo -e "\n✅ 正常节点数：$NORMAL_COUNT，异常节点数：$ERROR_COUNT"
    exit 1
fi
echo -e "\n✅ 所有$NORMAL_COUNT个监控节点状态正常："
echo -e "$NORMAL_MSG"
exit 0
