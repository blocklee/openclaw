/**
 * 分账验证器 - 验证 BattleRevenue 合约的 7 权分账逻辑
 *
 * 7 个 shareType (从 .sol 源编译提取):
 *   1=CREATOR (45%, 还要按 cardPotential/totalPotential 细分)
 *   2=EDGE (25%)
 *   3=REVIEWER (8%)
 *   4=PUBLIC_POOL (8%)
 *   5=PLATFORM (5%)
 *   6=AMBASSADOR (5%)
 *   7=RESERVE (4%)
 *   合计 100% ✓
 *
 * 4 个验证场景:
 * 1. RevenueDistributed 事件 → 核对 on-chain amount vs 预期计算值
 * 2. claimRevenue 后 getPendingRevenue 应为 0
 * 3. createBattle → joinBattle 流程完整性
 * 4. endBattle 后 revenuePool 累计 vs distributeRevenue 总额一致
 */

import { Contract, Provider } from 'ethers';
import { CONFIG, SHARE_TYPE } from './config';
import { RawLog } from './ws-client-stub';

export interface Distribution {
  battleId: string;
  shareType: number;  // 1-7, 见 SHARE_TYPE
  recipient: string;
  nodeId: string;
  amount: bigint;
}

export interface BattleSummary {
  battleId: string;
  player1: string;
  player2: string;
  deck1: string;
  deck2: string;
  betAmount: bigint;
  revenuePool: bigint;
  winner?: string;
  endedAt?: number;
  distributions?: Distribution[];
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

// 7 个 shareType 的预期 bps (v2.0 7 权版)
const SHARE_BPS_MAP: Record<number, number> = {
  [SHARE_TYPE.CREATOR]: CONFIG.SHARE_BPS.CREATOR,
  [SHARE_TYPE.EDGE]: CONFIG.SHARE_BPS.EDGE,
  [SHARE_TYPE.REVIEWER]: CONFIG.SHARE_BPS.REVIEWER,
  [SHARE_TYPE.PUBLIC_POOL]: CONFIG.SHARE_BPS.PUBLIC_POOL,
  [SHARE_TYPE.PLATFORM]: CONFIG.SHARE_BPS.PLATFORM,
  [SHARE_TYPE.AMBASSADOR]: CONFIG.SHARE_BPS.AMBASSADOR,
  [SHARE_TYPE.RESERVE]: CONFIG.SHARE_BPS.RESERVE,
};

export class RevenueValidator {
  private contract: Contract;

  constructor(provider: Provider, contractAddress = CONFIG.BATTLE_REVENUE_ADDRESS) {
    // 占位 ABI,调用方法时由链上/测试桩注入
    this.contract = new Contract(contractAddress, [], provider);
  }

  /**
   * 场景 1：RevenueDistributed 事件金额核对
   * 期望 amount = revenuePool * bpsShare / 10000
   * v2.0 7 权模型: CREATOR 45% / EDGE 25% / REVIEWER 8% / PUBLIC_POOL 8% / PLATFORM 5% / AMBASSADOR 5% / RESERVE 4%
   * 注意：CREATOR 还要再按 cardPotential/totalPotential 细分给具体创作者，
   *       这里的“CREATOR pool”是分配前的 pool 总额
   */
  verifyDistribution(
    battle: BattleSummary,
    distribution: Distribution
  ): ValidationResult {
    const errors: string[] = [];
    const expectedBps = SHARE_BPS_MAP[distribution.shareType];
    if (expectedBps === undefined) {
      errors.push(
        `battleId=${battle.battleId} unknown shareType=${distribution.shareType} ` +
        `(expected 1-7 in v2.0 7权 model)`
      );
      return { ok: false, errors };
    }
    const expected = (battle.revenuePool * BigInt(expectedBps)) / 10000n;
    // 允许 1 wei 误差(链上除法精度)
    const diff = distribution.amount > expected
      ? distribution.amount - expected
      : expected - distribution.amount;
    if (diff > 1n) {
      errors.push(
        `battleId=${battle.battleId} shareType=${distribution.shareType} ` +
        `expected=${expected} actual=${distribution.amount} diff=${diff}`
      );
    }
    return { ok: errors.length === 0, errors };
  }

  /**
   * 场景 2:claimRevenue 后余额应清零
   * 验证思路:从链上读 getPendingRevenue(recipient) 应为 0
   */
  async verifyClaimCleared(recipient: string): Promise<ValidationResult> {
    const errors: string[] = [];
    try {
      const pending: bigint = await this.contract.getPendingRevenue(recipient);
      if (pending !== 0n) {
        errors.push(`recipient=${recipient} still has pending ${pending}`);
      }
    } catch (e: any) {
      errors.push(`getPendingRevenue call failed: ${e.message}`);
    }
    return { ok: errors.length === 0, errors };
  }

  /**
   * 场景 3:battle 流程完整性
   * - 必须有 player1 和 player2(双方都入池)
   * - betAmount 必须 ≥ MIN_BET
   */
  verifyBattleIntegrity(battle: BattleSummary, minBet: bigint, maxBet: bigint): ValidationResult {
    const errors: string[] = [];
    const ZERO = '0x0000000000000000000000000000000000000000';
    if (!battle.player1 || battle.player1 === ZERO) {
      errors.push(`battleId=${battle.battleId} missing player1`);
    }
    if (!battle.player2 || battle.player2 === ZERO) {
      errors.push(`battleId=${battle.battleId} missing player2 (not joined yet)`);
    }
    if (battle.betAmount < minBet || battle.betAmount > maxBet) {
      errors.push(
        `battleId=${battle.battleId} betAmount=${battle.betAmount} ` +
        `out of range [${minBet}, ${maxBet}]`
      );
    }
    if (!battle.deck1 || !battle.deck2) {
      errors.push(`battleId=${battle.battleId} missing deck ids`);
    }
    return { ok: errors.length === 0, errors };
  }

  /**
   * 场景 4：revenuePool 累计 vs distributeRevenue 总额一致
   * v2.0 7 权模型，容差 7 wei (7 个 shareType × 1 wei 除法余数)
   */
  verifyPoolConsistency(battle: BattleSummary): ValidationResult {
    const errors: string[] = [];
    if (!battle.distributions || battle.distributions.length === 0) {
      errors.push(`battleId=${battle.battleId} no distributions`);
      return { ok: false, errors };
    }
    const total = battle.distributions.reduce((s, d) => s + d.amount, 0n);
    const diff = total > battle.revenuePool
      ? total - battle.revenuePool
      : battle.revenuePool - total;
    if (diff > 7n) {
      errors.push(
        `battleId=${battle.battleId} revenuePool=${battle.revenuePool} ` +
        `sumOfDistributions=${total} diff=${diff}`
      );
    }
    return { ok: errors.length === 0, errors };
  }

  /**
   * 批量验证某 battle 的所有 distribution
   */
  verifyAllDistributions(battle: BattleSummary): ValidationResult {
    const errors: string[] = [];
    if (!battle.distributions) {
      return { ok: false, errors: ['no distributions'] };
    }
    for (const d of battle.distributions) {
      const r = this.verifyDistribution(battle, d);
      errors.push(...r.errors);
    }
    const poolResult = this.verifyPoolConsistency(battle);
    errors.push(...poolResult.errors);
    return { ok: errors.length === 0, errors };
  }

  /**
   * 验证 7 权分账 bps 总和 = 10000（合约正确性 invariant）
   */
  verifyBpsInvariant(): ValidationResult {
    const errors: string[] = [];
    const sum = Object.values(SHARE_BPS_MAP).reduce((s, v) => s + v, 0);
    if (sum !== 10000) {
      errors.push(`SHARE_BPS sum = ${sum}, expected 10000`);
    }
    return { ok: errors.length === 0, errors };
  }
}
