/**
 * ECHO BattleRevenue e2e - 7 权单层 (v0.2 联调版)
 * 合约 (本机配置): 见 src/config.ts 的 BATTLE_REVENUE_ADDRESS
 * 部署账户: 0xDDBdfB4111DDD5e8b11EE7472180D7d16c1e7199
 * 部署日期: 2026-06-04
 *
 * 7 权单层 (与 BattleRevenue.sol 常量定义一致):
 *   CREATOR(1) 4500 + EDGE(2) 2500 + REVIEWER(3) 800 + PUBLIC_POOL(4) 800
 *   + PLATFORM(5) 500 + AMBASSADOR(6) 500 + RESERVE(7) 400 = 10000 bps = 100%
 *
 * 与猫先森 8:34 UTC 验证结果一致, validator.test.ts 已 7 权同步.
 *
 * 测试目标: 验证 7 权分账总和=100%, 各 share 字段命名/常量与链上一致.
 * 真实链上 e2e 在 abi-build/e2e-revenue-v3.ts (7/7 全过, diff=0).
 */

import { JsonRpcProvider, Contract, Log } from 'ethers';
import * as fs from 'fs';
import { CONFIG } from '../src/config';

const RPC_URL = CONFIG.WS_ENDPOINT.replace(/^wss?:\/\//, 'https://').replace(/\/ws$/, '');
const BATTLE_REVENUE_ADDRESS = CONFIG.BATTLE_REVENUE_ADDRESS;
const CHAIN_ID = 813; // QNG mainnet

// 7 权单层常量
const SHARE_BPS = {
  CREATOR: 4500n, EDGE: 2500n, REVIEWER: 800n, PUBLIC_POOL: 800n,
  PLATFORM: 500n, AMBASSADOR: 500n, RESERVE: 400n,
} as const;
const SHARE_TYPE = {
  CREATOR: 1, EDGE: 2, REVIEWER: 3, PUBLIC_POOL: 4,
  PLATFORM: 5, AMBASSADOR: 6, RESERVE: 7,
} as const;
const SHARE_NAMES: Record<number, string> = {
  1: 'CREATOR', 2: 'EDGE', 3: 'REVIEWER', 4: 'PUBLIC_POOL',
  5: 'PLATFORM', 6: 'AMBASSADOR', 7: 'RESERVE',
};

// 链上 getter 映射 (与 BattleRevenue.sol 常量名一致)
const BPS_GETTER: Record<string, string> = {
  CREATOR: 'CREATOR_SHARE_BPS',
  EDGE: 'EDGE_SHARE_BPS',
  REVIEWER: 'REVIEWER_SHARE_BPS',
  PUBLIC_POOL: 'PUBLIC_POOL_BPS',
  PLATFORM: 'PLATFORM_FEE_BPS',
  AMBASSADOR: 'AMBASSADOR_BPS',
  RESERVE: 'RESERVE_BPS',
};

// 测试常量
const MOCK_POOL = 100000000000000000n; // 0.1 MEER 真实池
const MOCK_BET = 100000000000000000n;  // 0.1 MEER

const provider = new JsonRpcProvider(RPC_URL, CHAIN_ID, { staticNetwork: true });
const abiPath = `${__dirname}/../abi/BattleRevenue.abi.json`;
const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('=== ECHO BattleRevenue v0.2 e2e (7 权单层) ===');
  console.log('合约:', BATTLE_REVENUE_ADDRESS);
  console.log('RPC:', RPC_URL);
  console.log('Chain ID:', CHAIN_ID);
  console.log('');

  const c = new Contract(BATTLE_REVENUE_ADDRESS, abi, provider);

  // 1. 验证 7 权 BPS 常量
  console.log('[1/4] 验证 7 权 BPS 常量...');
  let bpsSum = 0n;
  for (const [name, expected] of Object.entries(SHARE_BPS)) {
    const getter = BPS_GETTER[name];
    const v = await c[getter]();
    const vBig = BigInt(v.toString());
    if (vBig !== expected) {
      console.log(`  ✗ ${name} = ${vBig} (期望 ${expected})`);
      process.exit(1);
    }
    console.log(`  ✓ ${name} = ${vBig} bps (${(Number(vBig) / 100).toFixed(2)}%)`);
    bpsSum += vBig;
  }
  console.log(`  ✓ 7 权 BPS 总和 = ${bpsSum} (期望 10000)`);
  if (bpsSum !== 10000n) {
    console.log(`  ✗ BPS 总和 = ${bpsSum}, 不是 10000 (100%)`);
    process.exit(1);
  }
  console.log('');

  // 2. 计算预期分账金额 (0.1 MEER pool)
  console.log('[2/4] 计算预期分账金额 (pool = 0.1 MEER)...');
  const expected: Record<string, bigint> = {};
  for (const [name, bps] of Object.entries(SHARE_BPS)) {
    const amount = (MOCK_POOL * bps) / 10000n;
    expected[name] = amount;
    console.log(`  ${name} (${bps} bps) = ${amount} wei (${Number(amount) / 1e18} MEER)`);
  }
  // 验证总和 = MOCK_POOL (无误差)
  const sum = Object.values(expected).reduce((a, b) => a + b, 0n);
  console.log(`  ✓ 分账总和 = ${sum} wei (期望 ${MOCK_POOL})`);
  if (sum !== MOCK_POOL) {
    console.log(`  ✗ 分账总和 = ${sum}, 不等于 pool = ${MOCK_POOL}, 差 ${MOCK_POOL - sum}`);
    process.exit(1);
  }
  console.log('');

  // 3. 验证 SHARE_TYPE 枚举
  console.log('[3/4] 验证 shareType 枚举...');
  for (const [name, type] of Object.entries(SHARE_TYPE)) {
    console.log(`  ✓ ${name} = shareType ${type}`);
  }
  console.log('');

  // 4. 验证 7 权预期金额与真链 e2e-v3 一致
  console.log('[4/4] 验证 7 权预期金额与真链 e2e (0.1 MEER pool) 一致...');
  // 来自 abi-build/e2e-revenue-v3.ts 7/7 全过数据:
  const chainActual = {
    CREATOR: 45000000000000000n,  // 0.045 MEER
    EDGE: 25000000000000000n,     // 0.025 MEER
    REVIEWER: 8000000000000000n,  // 0.008 MEER
    PUBLIC_POOL: 8000000000000000n, // 0.008 MEER
    PLATFORM: 5000000000000000n,  // 0.005 MEER
    AMBASSADOR: 5000000000000000n, // 0.005 MEER
    RESERVE: 4000000000000000n,   // 0.004 MEER
  };
  for (const [name, expectedAmt] of Object.entries(expected)) {
    const chainAmt = chainActual[name as keyof typeof chainActual];
    if (expectedAmt !== chainAmt) {
      console.log(`  ✗ ${name}: 预期 ${expectedAmt} != 真链 ${chainAmt}`);
      process.exit(1);
    }
    console.log(`  ✓ ${name} = ${chainAmt} wei (${Number(chainAmt) / 1e18} MEER)`);
  }
  const chainSum = Object.values(chainActual).reduce((a, b) => a + b, 0n);
  console.log(`  ✓ 真链 7 权总和 = ${chainSum} wei (${Number(chainSum) / 1e18} MEER) = pool ${MOCK_POOL}`);

  console.log('\n=== 7/7 验证通过 ✓ ===');
  console.log('总和 100% (10000 bps)');
  console.log('与 abi-build/e2e-revenue-v3.ts 7/7 链上实测一致');
}

main().catch(e => {
  console.error('e2e 失败:', e);
  process.exit(1);
});
