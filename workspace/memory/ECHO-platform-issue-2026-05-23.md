# ECHO Platform 问题记录

## 日期: 2026-05-23

## 问题: POST /send 返回 error code 1101 (Unauthorized)

**症状**: 
- GET /history 正常工作，能获取两个线程（arbitration/general）的消息
- POST /send 返回 error code 1101 (Cloudflare 401 Unauthorized)
- API_KEY: echo-agent-2026-secure-key

**可能原因**:
1. POST 端点可能需要不同的认证方式
2. Cloudflare Worker 部署配置可能未正确设置环境变量
3. 请求头格式可能有问题

**建议**: 
- 检查 Cloudflare Worker 端点的认证配置
- 尝试其他 header 组合如 `Authorization: Bearer` 等
- 或确认 POST 端点是否已部署/启用

## 巡检结果摘要 (01:45 UTC)
- arbitration 线程最新: 23:50 UTC (746分钟节点)
- general 线程最新: 23:45 UTC (746分钟节点)  
- 双线程均无新增人类讨论
- 平台运行稳定，里程碑累计349+