#!/bin/bash

# 节点监控脚本 - 每两小时检查一次
# 优化版本：增加超时时间，使用 Node.js 处理 JSON

API_URL="https://node.meerfans.club/api/status"
LOG_FILE="/home/node/.openclaw/workspace-lucus/logs/node-monitor.log"
ALERT_FILE="/home/node/.openclaw/workspace-lucus/logs/node-alerts.txt"
MAX_TIME=30 # 增加超时时间到30秒

# 创建日志目录
mkdir -p /home/node/.openclaw/workspace-lucus/logs

# 获取状态
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始检查节点状态..." >> "$LOG_FILE"

RESPONSE=$(curl -s --max-time $MAX_TIME "$API_URL")

if [ $? -ne 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: 无法连接到API" >> "$LOG_FILE"
    echo "⚠️ 节点监控异常：无法连接到 API"
    exit 1
fi

# 使用 Node.js 解析 JSON 并检查异常节点
echo "$RESPONSE" | node -e "
const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
const nodes = data.nodes || {};
const alerts = [];

// 按网络分组
const testnetNodes = {};
const mainnetNodes = {};

for (const [name, node] of Object.entries(nodes)) {
    if (name.startsWith('test-')) {
        testnetNodes[name] = node;
    } else if (name.startsWith('main-')) {
        mainnetNodes[name] = node;
    }
}

// 检查测试网节点
for (const [name, node] of Object.entries(testnetNodes)) {
    const height = node?.stateroot?.Height || 0;
    const valid = node?.stateroot?.Valid;

    if (valid === false) {
        alerts.push('🚨 [测试网] 节点异常: ' + name.replace(/^test-/, ''));
    }
}

// 检查主网节点
for (const [name, node] of Object.entries(mainnetNodes)) {
    const height = node?.stateroot?.Height || 0;
    const valid = node?.stateroot?.Valid;

    if (valid === false) {
        alerts.push('🚨 [主网] 节点异常: ' + name.replace(/^main-/, ''));
    }
}

// 记录告警
alerts.forEach(alert => {
    const msg = '[' + new Date().toISOString().replace('T', ' ').substring(0, 19) + '] ' + alert;
    console.log(msg);
    console.log(msg) >> "$LOG_FILE";
});

// 检查高度是否落后（与最高高度相比）
const heights = nodes.map(n => n?.stateroot?.Height || 0).filter(h => h > 0);
const maxHeight = Math.max(...heights);

for (const [name, node] of Object.entries(nodes)) {
    const height = node?.stateroot?.Height || 0;
    if (maxHeight - height > 10) {
        const msg = '⚠️ 节点高度落后: ' + name + ' (Height=' + height + ', Max=' + maxHeight + ')';
        console.log(msg);
        console.log(msg) >> "$LOG_FILE";
    }
}

// 记录正常状态
if (alerts.length === 0) {
    const msg = '[' + new Date().toISOString().replace('T', ' ').substring(0, 19) + '] 节点检查完成，所有节点正常';
    console.log(msg);
    console.log(msg) >> "$LOG_FILE";
}

// 输出状态摘要
console.log('');
console.log('📊 节点状态摘要:');
for (const [name, node] of Object.entries(nodes)) {
    const height = node?.stateroot?.Height || 0;
    const valid = node?.stateroot?.Valid ? '✅' : '❌';
    console.log('  ' + valid + ' ' + name.replace(/^.-/, '') + ': Height=' + height);
}
" 2>/dev/null

exit 0
