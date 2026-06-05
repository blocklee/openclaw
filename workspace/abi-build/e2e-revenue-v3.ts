/**
 * ECHO BattleRevenue v3 e2e - 7 权单层 (main 分支)
 * 合约: 0x0c688e1E103EEc00AAa2EB1F0C91fEE83692c979
 * battleId: 0xa564a69d24b0b5431bc493c1c8f48f8c674037c7bd27b2da5f67d7dbb3c5d4ed
 */
import { JsonRpcProvider, Contract, Log } from 'ethers';
import * as fs from 'fs';

const RPC = 'https://qng.rpc.qitmeer.io';
const ADDR = '0x0c688e1E103EEc00AAa2EB1F0C91fEE83692c979';
const BATTLE_ID = '0xa564a69d24b0b5431bc493c1c8f48f8c674037c7bd27b2da5f67d7dbb3c5d4ed';
const ABI_PATH = '/home/node/.openclaw/workspace/abi-build/BattleRevenue.abi.json';

const SHARE_BPS = {
  CREATOR: 4500n, EDGE: 2500n, REVIEWER: 800n, PUBLIC_POOL: 800n,
  PLATFORM: 500n, AMBASSADOR: 500n, RESERVE: 400n,
};
const SHARE_TYPE = {
  CREATOR: 1, EDGE: 2, REVIEWER: 3, PUBLIC_POOL: 4,
  PLATFORM: 5, AMBASSADOR: 6, RESERVE: 7,
};
const SHARE_NAMES: Record<number, string> = {
  1: 'CREATOR', 2: 'EDGE', 3: 'REVIEWER', 4: 'PUBLIC_POOL',
  5: 'PLATFORM', 6: 'AMBASSADOR', 7: 'RESERVE',
};

const provider = new JsonRpcProvider(RPC);
const abi = JSON.parse(fs.readFileSync(ABI_PATH, 'utf8'));
const c = new Contract(ADDR, abi, provider);

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('=== ECHO BattleRevenue v3 e2e (7 权单层) ===');
  console.log('合约:', ADDR);
  console.log('battle:', BATTLE_ID);
  console.log('');

  // 1. 查 BPS
  console.log('[1/4] 查 BPS 常量...');
  let bpsSum = 0n;
  for (const [n, b] of Object.entries(SHARE_BPS)) {
    const v = await c[n === 'CREATOR' ? 'CREATOR_SHARE_BPS' : n === 'EDGE' ? 'EDGE_SHARE_BPS' : n === 'REVIEWER' ? 'REVIEWER_SHARE_BPS' : n === 'PUBLIC_POOL' ? 'PUBLIC_POOL_BPS' : n === 'PLATFORM' ? 'PLATFORM_FEE_BPS' : n === 'AMBASSADOR' ? 'AMBASSADOR_BPS' : 'RESERVE_BPS']();
    const vBig = BigInt(v.toString());
    if (vBig !== b) {
      console.log(`  ✗ ${n} = ${vBig} (期望 ${b})`);
      process.exit(1);
    }
    bpsSum += vBig;
  }
  console.log(`  ✓ 7 权 BPS 总和 = ${bpsSum} (期望 10000)`);

  // 2. 查 battle 状态
  console.log('\n[2/4] 查 battle 状态...');
  const b = await c.battles(BATTLE_ID);
  console.log('  player1:', b.player1);
  console.log('  player2:', b.player2);
  console.log('  betAmount:', b.betAmount.toString());
  console.log('  revenuePool:', b.revenuePool.toString());
  console.log('  distributed:', b.distributed);
  console.log('  winner:', b.winner);

  if (b.distributed) {
    console.log('\n  battle 已 distributed, 直接抓事件...');
    await queryEvents(b.revenuePool);
  } else {
    console.log('\n[3/4] 轮询 distributed, 等 endBattle + distributeRevenue...');
    let attempts = 0;
    const maxAttempts = 200; // 33 min
    while (attempts < maxAttempts) {
      const cur = await c.battles(BATTLE_ID);
      if (cur.distributed) {
        console.log(`  [${attempts * 10}s] distributed=true! winner=${cur.winner}`);
        console.log(`  endTime/block? 查 tx...`);
        break;
      }
      if (attempts % 6 === 0) {
        console.log(`  [${attempts * 10}s] distributed=false winner=${cur.winner.slice(0, 10)}...`);
      }
      await sleep(10_000);
      attempts++;
    }
    if (attempts >= maxAttempts) {
      console.log('  ✗ 超时 (33 分钟)');
      process.exit(1);
    }
    await queryEvents(b.revenuePool);
  }
}

async function queryEvents(revenuePool: bigint) {
  console.log('\n[4/4] 抓 RevenueDistributed 事件...');
  const filter = c.filters.RevenueDistributed();
  const events = await c.queryFilter(filter, 2713000, 'latest');
  const battleEvents = events.filter((e: any) => e.args.battleId.toLowerCase() === BATTLE_ID.toLowerCase());
  console.log(`  抓到 ${events.length} 个事件, 其中 battle 的 ${battleEvents.length} 个`);

  if (battleEvents.length !== 7) {
    console.log(`  ✗ 期望 7 个事件, 实际 ${battleEvents.length}`);
    process.exit(1);
  }

  // 7 权预期金额
  const expected: Record<number, bigint> = {
    [SHARE_TYPE.CREATOR]: revenuePool * SHARE_BPS.CREATOR / 10000n,
    [SHARE_TYPE.EDGE]: revenuePool * SHARE_BPS.EDGE / 10000n,
    [SHARE_TYPE.REVIEWER]: revenuePool * SHARE_BPS.REVIEWER / 10000n,
    [SHARE_TYPE.PUBLIC_POOL]: revenuePool * SHARE_BPS.PUBLIC_POOL / 10000n,
    [SHARE_TYPE.PLATFORM]: revenuePool * SHARE_BPS.PLATFORM / 10000n,
    [SHARE_TYPE.AMBASSADOR]: revenuePool * SHARE_BPS.AMBASSADOR / 10000n,
    [SHARE_TYPE.RESERVE]: revenuePool * SHARE_BPS.RESERVE / 10000n,
  };

  let totalActual = 0n;
  let passCount = 0;
  for (const e of battleEvents) {
    const st = Number(e.args.shareType);
    const actual = BigInt(e.args.amount.toString());
    const exp = expected[st];
    const name = SHARE_NAMES[st] || `UNKNOWN(${st})`;
    const diff = actual - exp;
    const ok = diff >= -1n && diff <= 1n;
    console.log(`  ${ok ? '✓' : '✗'} shareType=${st} ${name}: actual=${actual} expected=${exp} diff=${diff}`);
    if (ok) passCount++;
    totalActual += actual;
  }
  const totalExpected = Object.values(expected).reduce((s, v) => s + v, 0n);
  const totalDiff = totalActual - totalExpected;
  const totalOk = totalDiff >= -7n && totalDiff <= 7n;
  console.log(`\n  总分配: actual=${totalActual} expected=${totalExpected} diff=${totalDiff} ${totalOk ? '✓' : '✗'}`);
  console.log(`\n  验证结果: ${passCount}/7 单项过, ${totalOk ? '✓' : '✗'} 累计过`);

  if (passCount === 7 && totalOk) {
    console.log('\n🎉 7 权 e2e 全绿! v2.0 7 权单层验证通过');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch(e => { console.error('ERROR:', e); process.exit(1); });
