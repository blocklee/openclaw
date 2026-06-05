# @echo/battle-revenue-integration

ECHO《势位之战》前端集成包 — QNG 主网 BattleRevenue 合约事件订阅 + 分账验证 + 链上查询

## 安装

```bash
npm install @echo/battle-revenue-integration ethers ws
```

## 快速开始

```typescript
import { BattleEventSubscriber, BattleChainReader, RevenueValidator } from '@echo/battle-revenue-integration';
import { JsonRpcProvider } from 'ethers';

// 1. 启动事件订阅
const subscriber = new BattleEventSubscriber();
await subscriber.start();

subscriber.on('BattleCreated', async (event) => {
  console.log('新 battle:', event);
  // 解析后通知前端
});

subscriber.on('RevenueDistributed', async (event) => {
  // 监听分账事件
  // 立即跑分账验证
});

// 2. 链上查询
const provider = new JsonRpcProvider('https://qng.rpc.qitmeer.io');
const reader = new BattleChainReader(provider);

const battle = await reader.getBattle('0x...');
const dists = await reader.getDistributions('0x...');
const stats = await reader.getPlayerStats('0x...');

// 3. 分账验证
const validator = new RevenueValidator(provider);
const result = validator.verifyAllDistributions(battle);
if (!result.ok) {
  console.error('分账异常:', result.errors);
  // 触发告警
}
```

## 模块说明

### event-subscriber
- `BattleEventSubscriber` — 主入口，WS 主 + HTTP fallback 兜底
- `BattleRevenueWSClient` — 纯 WS 客户端，30s ping，断连重试
- `HTTPFallbackPoller` — eth_getLogs 轮询，12s 间隔

### revenue-validator
- `RevenueValidator` — 4 场景验证
  1. RevenueDistributed 金额核对
  2. claimRevenue 后余额清零
  3. battle 流程完整性
  4. revenuePool 累计一致性

### chain-reader
- `BattleChainReader` — 链上数据查询封装
  - getBattle / getDistributions / getPendingRevenue
  - getBattlesByPlayer / getPlayerStats
  - getRevenuePoolBalance

## 配置

修改 `src/config.ts` 调整：
- `WS_ENDPOINT` — QNG WebSocket 端点
- `PING_INTERVAL_MS` — 心跳间隔（默认 30s）
- `RECONNECT_DELAYS_MS` — 重连退避序列
- `POLL_INTERVAL_MS` — fallback 轮询间隔（默认 12s）
- `SHARE_BPS` — 分账基点（4500/2500/1000/2000）

## 测试

```bash
npm test
```

## 状态

- v0.1 骨架：事件订阅 + 分账验证器 + 链上查询（mock 单元测试已通过）
- 待 Seaman_bot 提供：完整 ABI、测试 battleId
- v0.2 计划：接入真实 ABI、端到端 e2e 测试

## 前端风格

暖白底 #faf9f7，React + Tailwind + Canvas
