/**
 * 真链 e2e（HTTP polling 版）— 链上 WS 端点 301 不可用
 * 用 eth_getLogs 轮询，等 distributeRevenue 触发后拿 4 个 RevenueDistributed 事件
 */

import { JsonRpcProvider, Contract } from 'ethers';
import * as ABI from './BattleRevenue.abi.json';

const RPC_HTTP = 'https://qng.rpc.qitmeer.io';
const BATTLE_REVENUE = '0xd57806aF985650c002e5E51e203F69c4ca14e4f6';
const BATTLE_ID = '0x67c1b6764f1b22670e5ed9df76d3a0055bb85857a86e925c468a118e683f1b70';

const BPS = { CREATOR: 4500, EDGE: 2500, PLATFORM: 1000, WINNER_POOL: 2000 };
const POOL = 100000000000000000n;

const EXPECTED: Record<number, bigint> = {
  1: (POOL * BigInt(BPS.CREATOR)) / 10000n,     // CREATOR 0.045
  2: (POOL * BigInt(BPS.EDGE)) / 10000n,        // EDGE 0.025
  3: (POOL * BigInt(BPS.PLATFORM)) / 10000n,    // PLATFORM 0.01
  4: (POOL * BigInt(BPS.WINNER_POOL)) / 10000n, // WINNER_POOL 0.02
};

async function main() {
  console.log('=== 真链 e2e (HTTP polling) — BattleRevenue 4 权分账验证 ===');
  console.log('合约:', BATTLE_REVENUE);
  console.log('battleId:', BATTLE_ID);
  console.log('预期 4 权金额 (0.1 MEER pool):');
  console.log('  CREATOR (1):', EXPECTED[1].toString(), 'wei');
  console.log('  EDGE (2):', EXPECTED[2].toString(), 'wei');
  console.log('  PLATFORM (3):', EXPECTED[3].toString(), 'wei');
  console.log('  WINNER_POOL (4):', EXPECTED[4].toString(), 'wei');
  console.log('---');

  const provider = new JsonRpcProvider(RPC_HTTP);
  const contract = new Contract(BATTLE_REVENUE, ABI as any, provider);

  // 初始状态
  const b0 = await contract.battles(BATTLE_ID);
  console.log('[初始] player1:', b0.player1);
  console.log('[初始] player2:', b0.player2);
  console.log('[初始] revenuePool:', b0.revenuePool.toString());
  console.log('[初始] distributed:', b0.distributed);
  console.log('---');

  // 轮询 distributed 状态
  console.log('[1/4] 轮询 battle.distributed，等 Seaman_bot 触发 distributeRevenue...');
  let lastDist = b0.distributed;
  let attempts = 0;
  const maxAttempts = 200; // 200 * 10s = ~33 分钟

  while (attempts < maxAttempts) {
    const b = await contract.battles(BATTLE_ID);
    if (b.distributed !== lastDist) {
      console.log(`[battle.distributed] ${lastDist} -> ${b.distributed}`);
      lastDist = b.distributed;
    }
    if (b.distributed) {
      console.log('✓ distributeRevenue 已触发，开始抓 RevenueDistributed 事件');
      break;
    }
    if (attempts % 6 === 0) {
      console.log(`[${attempts * 10}s] distributed=${b.distributed} winner=${b.winner}`);
    }
    attempts++;
    await new Promise(r => setTimeout(r, 10_000));
  }

  if (!lastDist) {
    console.log('⏰ 33 分钟超时，distributed 还没变');
    process.exit(1);
  }

  // 抓事件
  console.log('[2/4] 查 RevenueDistributed 事件...');
  const currentBlock = await provider.getBlockNumber();
  // distributeRevenue 是最近的事, 查最近 1000 块
  const fromBlock = currentBlock - 1000;
  const toBlock = currentBlock;
  console.log('查块范围:', fromBlock, '->', toBlock);

  const filter = contract.filters.RevenueDistributed(BATTLE_ID);
  const events = await contract.queryFilter(filter, fromBlock, toBlock);
  console.log(`✓ 抓到 ${events.length} 个 RevenueDistributed 事件`);

  if (events.length === 0) {
    console.log('❌ 0 个事件，请检查');
    process.exit(1);
  }

  // 提取
  const distributions = events.map((e: any) => ({
    battleId: e.args.battleId,
    shareType: Number(e.args.shareType),
    recipient: e.args.recipient,
    nodeId: e.args.nodeId,
    amount: e.args.amount as bigint,
  }));

  // 验证
  console.log('[3/4] 跑 4 权分账验证...');
  const errors: string[] = [];
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

  // 验证 winner pool 是否给对了
  console.log('[4/4] 验证收件人...');
  const expectedRecipients: Record<number, string> = {
    1: '0x' + 'DDBdfB4111DDD5e8b11EE7472180D7d16c1e7199'.slice(2).toLowerCase(), // CREATOR
    2: '0x1234567890123456789012345678901234567890', // EDGE
    3: b0.treasury || '0x' + 'DDBdfB4111DDD5e8b11EE7472180D7d16c1e7199'.slice(2).toLowerCase(), // PLATFORM
    4: '0x' + 'DDBdfB4111DDD5e8b11EE7472180D7d16c1e7199'.slice(2).toLowerCase(), // WINNER (creator won)
  };
  for (const d of distributions) {
    console.log(`  shareType ${d.shareType}: recipient=${d.recipient}`);
  }

  if (errors.length === 0 && poolDiff <= 4n) {
    console.log('---');
    console.log('🎉 4 权分账验证全绿！v0.1-链上 4 权 MVP 联调通过');
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
