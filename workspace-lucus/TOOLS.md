# ⚙️ TOOLS.md — Lucus 本地笔记

## 脚本路径

| 脚本 | 用途 | 路径 |
|------|------|------|
| Qitmeer 节点检查 | 块高、在线状态、健康度 | `scripts/check-qitmeer-node.sh` |
| Node 监控 (JS) | 通用节点资源巡检 | `scripts/node-monitor.js` |
| Node 监控 (Shell) | 通用节点资源巡检 | `scripts/node-monitor.sh` |

## Qitmeer 监控

- **API Endpoint**: `https://node.meerfans.club/api/status`
- **检查脚本**: `scripts/check-qitmeer-node.sh`
- **块高缓存**: `/tmp/qitmeer_${node_key}_last_block`（用于检测停滞）
- **依赖**: `jq`（`apt install -y jq`）

## 节点环境

> 待老大补充：SSH hosts、服务器别名、token 路径等敏感信息请勿外泄。

## 汇报惯例

- 结论先行，数据佐证
- 紧急问题直接 @老大
- 状态摘要按模板输出，保持格式统一

---

_此文件随运维环境演进而更新。_