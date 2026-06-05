/**
 * 真链 e2e 测试 — 监听 RevenueDistributed 事件，跑 4 权分账验证
 *
 * 流程：
 * 1. 启动 WS 订阅 0xd578...e4f6
 * 2. 等待 joinBattle 0x67c1...1b70 (Seaman_bot 触发)
 * 3. 等待 endBattle (Seaman_bot 触发)
 * 4. 等待 distributeRevenue (Seaman_bot 触发)
 * 5. 收到 4 个 RevenueDistributed 事件后跑 verifyAllDistributions
 *
 * 4 权预期 (0.1 MEER pool):
 *   CREATOR: 0.045 MEER (45000000000000000 wei)
 *   EDGE: 0.025 MEER (25000000000000000 wei)
 *   PLATFORM: 0.01 MEER (10000000000000000 wei)
 *   WINNER_POOL: 0.02 MEER (20000000000000000 wei)
 */

import { JsonRpcProvider, Contract, WebSocketProvider } from 'ethers';
import * as ABI from './BattleRevenue.abi.json';

const RPC_HTTP = 'https://qng.rpc.qitmeer.io';
const RPC_WS = 'wss://qng.rpc.qitmeer.io/ws';
const BATTLE_REVENUE = '0xd57806aF985650c002e5E51e203F69c4ca14e4f6';
const BATTLE_ID = '0x67c1b6764f1b22670e5ed9df76d3a0055bb85857a86e925c468a118e683f1b70';

// 4 权预期 bps
const BPS = { CREATOR: 4500, EDGE: 2500, PLATFORM: 1000, WINNER_POOL: 2000 };
const SHARE_TYPE = { CREATOR: 1, EDGE: 2, PLATFORM: 3, WINNER_POOL: 4 } as const;
const POOL = 100000000000000000n; // 0.1 MEER

const EXPECTED_AMOUNTS = {
  [SHARE_TYPE.CREATOR]: (POOL * BigInt(BPS.CREATOR)) / 10000n,     // 0.045
  [SHARE_TYPE.EDGE]: (POOL * BigInt(BPS.EDGE)) / 10000n,           // 0.025
  [SHARE_TYPE.PLATFORM]: (POOL * BigInt(BPS.PLATFORM)) / 10000n,   // 0.01
  [SHARE_TYPE.WINNER_POOL]: (POOL * BigInt(BPS.WINNER_POOL)) / 10000n, // 0.02
};

interface DistributionEvent {
  battleId: string;
  shareType: number;
  recipient: string;
  nodeId: string;
  amount: bigint;
}

async function main() {
  console.log('=== 真链 e2e — BattleRevenue 4 权分账验证 ===');
  console.log('合约:', BATTLE_REVENUE);
  console.log('battleId:', BATTLE_ID);
  console.log('pool: 0.1 MEER');
  console.log('预期 4 权金额:');
  console.log('  CREATOR (1):', EXPECTED_AMOUNTS[1].toString(), 'wei (0.045 MEER)');
  console.log('  EDGE (2):', EXPECTED_AMOUNTS[2].toString(), 'wei (0.025 MEER)');
  console.log('  PLATFORM (3):', EXPECTED_AMOUNTS[3].toString(), 'wei (0.01 MEER)');
  console.log('  WINNER_POOL (4):', EXPECTED_AMOUNTS[4].toString(), 'wei (0.02 MEER)');
  console.log('---');

  // 1. 准备合约
  const httpProvider = new JsonRpcProvider(RPC_HTTP);
  const contract = new Contract(BATTLE_REVENUE, ABI as any, httpProvider);

  // 2. 启动 WS 订阅
  console.log('[1/4] 启动 WS 订阅 RevenueDistributed 事件...');
  const wsProvider = new WebSocketProvider(RPC_WS);
  const wsContract = new Contract(BATTLE_REVENUE, ABI as any, wsProvider);

  const distributions: DistributionEvent[] = [];

  // 监听 RevenueDistributed 事件
  wsContract.on('RevenueDistributed', (battleId: string, shareType: number, recipient: string, nodeId: string, amount: bigint) => {
    if (battleId.toLowerCase() !== BATTLE_ID.toLowerCase()) return;
    const d: DistributionEvent = { battleId, shareType: Number(shareType), recipient, nodeId, amount };
    distributions.push(d);
    console.log(`[事件 ${distributions.length}] shareType=${d.shareType} amount=${d.amount.toString()} recipient=${d.recipient.slice(0, 10)}...`);

    // 收到 4 个事件后跑验证
    if (distributions.length >= 4) {
      verify(distributions);
      wsProvider.destroy();
      process.exit(0);
    }
  });

  // 3. 同步：等 battle 状态变化
  console.log('[2/4] 监听中，等待 Seaman_bot 触发 joinBattle + endBattle + distributeRevenue...');
  console.log('     battle 状态:');
  const initial = await contract.battles(BATTLE_ID);
  console.log('     player1:', initial.player1, 'player2:', initial.player2);

  // 4. 轮询 battle 状态，等 distributeRevenue 触发的迹象
  let lastState = '';
  const stateInterval = setInterval(async () => {
    try {
      const battle = await contract.battles(BATTLE_ID);
      const state = `player1=${battle.player1.slice(0,8)}... player2=${battle.player2.slice(0,8)}... winner=${battle.winner.slice(0,8)}... dist=${battle.distributed}`;
      if (state !== lastState) {
        console.log('[battle]', state);
        lastState = state;
      }
    } catch (e: any) {
      console.log('[battle] query failed:', e.message.slice(0, 60));
    }
  }, 3000);

  // 30 分钟后超时
  setTimeout(() => {
    console.log('⏰ 30 分钟超时，退出');
    clearInterval(stateInterval);
    wsProvider.destroy();
    process.exit(1);
  }, 30 * 60 * 1000);
}

function verify(distributions: DistributionEvent[]) {
  console.log('---');
  console.log('[4/4] 跑 4 权分账验证...');
  const errors: string[] = [];

  for (const d of distributions) {
    const expected = EXPECTED_AMOUNTS[d.shareType as 1|2|3|4];
    if (expected === undefined) {
      errors.push(`未知 shareType: ${d.shareType}`);
      continue;
    }
    const diff = d.amount > expected ? d.amount - expected : expected - d.amount;
    if (diff > 1n) {
      errors.push(`shareType ${d.shareType}: expected=${expected} actual=${d.amount} diff=${diff}`);
    } else {
      console.log(`  ✓ shareType ${d.shareType}: ${d.amount.toString()} wei (预期 ${expected.toString()})`);
    }
  }

  // 累计一致性
  const total = distributions.reduce((s, d) => s + d.amount, 0n);
  const poolDiff = total > POOL ? total - POOL : POOL - total;
  console.log(`累计: ${total.toString()} wei vs pool ${POOL.toString()} wei, diff=${poolDiff}`);

  if (errors.length === 0 && poolDiff <= 4n) {
    console.log('🎉 4 权分账验证全绿！v0.1-链上 4 权 MVP 联调通过');
    process.exit(0);
  } else {
    console.log('❌ 验证失败:');
    errors.forEach((e) => console.log('  - ' + e));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('e2e 启动失败:', e.message);
  process.exit(1);
});
