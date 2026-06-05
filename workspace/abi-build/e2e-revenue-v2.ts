/**
 * 真链 e2e — v2.0 7 权合约 BattleRevenue
 * 合约: 0x1D7aF10f3C2e48aa8440C93bB34ea61137C5C954
 * battleId: 0x19b37c805742b940eafe980c7236dfb95d0a452590924f1d4f15234db3bb7035
 *
 * 7 权预期 (0.1 MEER pool):
 *   CREATOR: 0.045 MEER (45000000000000000 wei)
 *   EDGE: 0.025 MEER (25000000000000000 wei)
 *   REVIEWER: 0.008 MEER (8000000000000000 wei)
 *   PUBLIC_POOL: 0.008 MEER (8000000000000000 wei)
 *   PLATFORM: 0.005 MEER (5000000000000000 wei)
 *   AMBASSADOR: 0.005 MEER (5000000000000000 wei)
 *   RESERVE: 0.004 MEER (4000000000000000 wei)
 */

import { JsonRpcProvider, Contract } from 'ethers';
import * as ABI from './BattleRevenue.abi.json';

const RPC_HTTP = 'https://qng.rpc.qitmeer.io';
const BATTLE_REVENUE = '0x1D7aF10f3C2e48aa8440C93bB34ea61137C5C954';
const BATTLE_ID = '0x19b37c805742b940eafe980c7236dfb95d0a452590924f1d4f15234db3bb7035';

const POOL = 100000000000000000n; // 0.1 MEER

const EXPECTED: Record<number, bigint> = {
  1: (POOL * 4500n) / 10000n,  // CREATOR 0.045
  2: (POOL * 2500n) / 10000n,  // EDGE 0.025
  3: (POOL * 800n) / 10000n,   // REVIEWER 0.008
  4: (POOL * 800n) / 10000n,   // PUBLIC_POOL 0.008
  5: (POOL * 500n) / 10000n,   // PLATFORM 0.005
  6: (POOL * 500n) / 10000n,   // AMBASSADOR 0.005
  7: (POOL * 400n) / 10000n,   // RESERVE 0.004
};

async function main() {
  console.log('=== 真链 e2e v2.0 — BattleRevenue 7 权分账验证 ===');
  console.log('合约:', BATTLE_REVENUE);
  console.log('battleId:', BATTLE_ID);
  console.log('预期 7 权金额 (0.1 MEER pool):');
  for (let i = 1; i <= 7; i++) {
    const name = ['', 'CREATOR', 'EDGE', 'REVIEWER', 'PUBLIC_POOL', 'PLATFORM', 'AMBASSADOR', 'RESERVE'][i];
    console.log(`  ${name} (${i}):`, EXPECTED[i].toString(), 'wei');
  }
  console.log('---');

  const provider = new JsonRpcProvider(RPC_HTTP);
  const contract = new Contract(BATTLE_REVENUE, ABI as any, provider);

  // 初始状态
  console.log('[1/5] 查 battle 初始状态...');
  const b0 = await contract.battles(BATTLE_ID);
  console.log('  player1:', b0.player1);
  console.log('  player2:', b0.player2);
  console.log('  revenuePool:', b0.revenuePool.toString());
  console.log('  distributed:', b0.distributed);
  console.log('  winner:', b0.winner);
  console.log('---');

  // 轮询 distributed
  console.log('[2/5] 轮询 distributed，等 Seaman_bot 跑 endBattle + distributeRevenue...');
  let lastDist = b0.distributed;
  let attempts = 0;
  const maxAttempts = 200;

  while (attempts < maxAttempts) {
    const b = await contract.battles(BATTLE_ID);
    if (b.distributed !== lastDist) {
      console.log(`[battle.distributed] ${lastDist} -> ${b.distributed}`);
      lastDist = b.distributed;
    }
    if (b.distributed) break;
    if (attempts % 6 === 0) {
      console.log(`[${attempts * 10}s] distributed=${b.distributed} winner=${b.winner.slice(0,10)}...`);
    }
    attempts++;
    await new Promise((r) => setTimeout(r, 10_000));
  }

  if (!lastDist) {
    console.log('⏰ 33 分钟超时，distributed 还没变');
    process.exit(1);
  }

  // 抓事件
  console.log('[3/5] 查 RevenueDistributed 事件...');
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, currentBlock - 1000);
  console.log('查块范围:', fromBlock, '->', currentBlock);

  const filter = contract.filters.RevenueDistributed(BATTLE_ID);
  const events = await contract.queryFilter(filter, fromBlock, currentBlock);
  console.log(`✓ 抓到 ${events.length} 个 RevenueDistributed 事件`);

  if (events.length === 0) {
    console.log('❌ 0 个事件');
    process.exit(1);
  }

  // 验证
  console.log('[4/5] 跑 7 权分账验证...');
  const errors: string[] = [];
  const distributions = events.map((e: any) => ({
    shareType: Number(e.args.shareType),
    recipient: e.args.recipient,
    nodeId: e.args.nodeId,
    amount: e.args.amount as bigint,
  }));

  for (const d of distributions) {
    const expected = EXPECTED[d.shareType];
    if (expected === undefined) {
      errors.push(`未知 shareType: ${d.shareType}`);
      continue;
    }
    const diff = d.amount > expected ? d.amount - expected : expected - d.amount;
    if (diff > 1n) {
      errors.push(`shareType ${d.shareType}: expected=${expected} actual=${d.amount} diff=${diff}`);
    } else {
      console.log(`  ✓ shareType ${d.shareType}: ${d.amount.toString()} wei`);
    }
  }

  // 累计
  const total = distributions.reduce((s, d) => s + d.amount, 0n);
  const poolDiff = total > POOL ? total - POOL : POOL - total;
  console.log(`累计: ${total.toString()} wei vs pool ${POOL.toString()} wei, diff=${poolDiff}`);

  // 收件人
  console.log('[5/5] 收件人:');
  for (const d of distributions) {
    console.log(`  shareType ${d.shareType}: ${d.recipient}`);
  }

  if (errors.length === 0 && poolDiff <= 7n) {
    console.log('---');
    console.log('🎉 7 权分账验证全绿！v2.0 真链 e2e 通过');
    process.exit(0);
  } else {
    console.log('---');
    console.log('❌ 验证失败:');
    errors.forEach((e) => console.log('  - ' + e));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('e2e 启动失败:', e.message);
  process.exit(1);
});
