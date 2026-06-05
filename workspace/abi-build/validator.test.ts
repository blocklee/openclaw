/**
 * 单元测试：分账验证器（7 权 v2.0 版本）
 * 数据依据：github main 源码 contracts/battle-of-potential/BattleRevenue.sol (Talus 04:43 UTC grep)
 *   7 个 BPS 常量: CREATOR 4500 / EDGE 2500 / REVIEWER 800 / PUBLIC_POOL 800 / PLATFORM 500 / AMBASSADOR 500 / RESERVE 400
 *   7 个 shareType 编号: 1=CREATOR / 2=EDGE / 3=REVIEWER / 4=PUBLIC_POOL / 5=PLATFORM / 6=AMBASSADOR / 7=RESERVE
 *   错误历史: Seaman_bot 报的 "GATE 30% + UPGRADE 20% 两层" 源码 grep 0 命中
 *   错误历史: v1.2 4 权已废, 部署 7 权 v2.0
 */

import { describe, it, expect } from 'vitest';
import { RevenueValidator, BattleSummary, Distribution } from './validator';
import { SHARE_TYPE } from './config';

const mockProvider: any = {};
const validator = new RevenueValidator(mockProvider);

const MOCK_BATTLE_ID = '0x67c1b6764f1b22670e5ed9df76d3a0055bb85857a86e925c468a118e683f1b70';
const MOCK_CREATOR = '0xDDBdfB4111DDD5e8b11EE7472180D7d16c1e7199';
const MOCK_OPPONENT = '0x1234567890123456789012345678901234567890';
const MOCK_DECK1 = '0x3485aa7a28dde348a920d172ffa734daa3b0b4806737d6641ea5dc9b384305c7';

const MOCK_BET = 100000000000000000n;   // 0.1 MEER
const MOCK_POOL = 100000000000000000n;  // 0.1 MEER
const MOCK_MIN_BET = 100000000000000000n;
const MOCK_MAX_BET = 10000000000000000000n;

// 7 权分账 (0.1 MEER pool 实算)
const EXPECTED = {
  CREATOR: (MOCK_POOL * 4500n) / 10000n,     // 0.045 MEER
  EDGE: (MOCK_POOL * 2500n) / 10000n,        // 0.025 MEER
  REVIEWER: (MOCK_POOL * 800n) / 10000n,     // 0.008 MEER
  PUBLIC_POOL: (MOCK_POOL * 800n) / 10000n,  // 0.008 MEER
  PLATFORM: (MOCK_POOL * 500n) / 10000n,     // 0.005 MEER
  AMBASSADOR: (MOCK_POOL * 500n) / 10000n,   // 0.005 MEER
  RESERVE: (MOCK_POOL * 400n) / 10000n,      // 0.004 MEER
};

describe('RevenueValidator v0.1-7权 v2.0', () => {
  describe('BPS invariant', () => {
    it('7 权 bps 总和 = 10000', () => {
      const r = validator.verifyBpsInvariant();
      expect(r.ok).toBe(true);
    });
  });

  describe('verifyDistribution: 7 个 shareType 全部覆盖', () => {
    const makeBattle = (): BattleSummary => ({
      battleId: MOCK_BATTLE_ID,
      player1: MOCK_CREATOR,
      player2: MOCK_OPPONENT,
      deck1: MOCK_DECK1,
      deck2: MOCK_DECK1,
      betAmount: MOCK_BET,
      revenuePool: MOCK_POOL,
    });

    it('CREATOR (1) = 0.045 MEER', () => {
      const dist: Distribution = {
        battleId: MOCK_BATTLE_ID, shareType: SHARE_TYPE.CREATOR,
        recipient: MOCK_CREATOR, nodeId: MOCK_DECK1, amount: EXPECTED.CREATOR,
      };
      expect(validator.verifyDistribution(makeBattle(), dist).ok).toBe(true);
      expect(dist.amount).toBe(45000000000000000n);
    });

    it('EDGE (2) = 0.025 MEER', () => {
      const dist: Distribution = {
        battleId: MOCK_BATTLE_ID, shareType: SHARE_TYPE.EDGE,
        recipient: MOCK_OPPONENT, nodeId: MOCK_DECK1, amount: EXPECTED.EDGE,
      };
      expect(validator.verifyDistribution(makeBattle(), dist).ok).toBe(true);
      expect(dist.amount).toBe(25000000000000000n);
    });

    it('REVIEWER (3) = 0.008 MEER', () => {
      const dist: Distribution = {
        battleId: MOCK_BATTLE_ID, shareType: SHARE_TYPE.REVIEWER,
        recipient: '0x' + 'a'.repeat(40), nodeId: MOCK_DECK1, amount: EXPECTED.REVIEWER,
      };
      expect(validator.verifyDistribution(makeBattle(), dist).ok).toBe(true);
      expect(dist.amount).toBe(8000000000000000n);
    });

    it('PUBLIC_POOL (4) = 0.008 MEER', () => {
      const dist: Distribution = {
        battleId: MOCK_BATTLE_ID, shareType: SHARE_TYPE.PUBLIC_POOL,
        recipient: '0x' + 'b'.repeat(40), nodeId: MOCK_DECK1, amount: EXPECTED.PUBLIC_POOL,
      };
      expect(validator.verifyDistribution(makeBattle(), dist).ok).toBe(true);
      expect(dist.amount).toBe(8000000000000000n);
    });

    it('PLATFORM (5) = 0.005 MEER (7 权源码值, 不是 v1.2 4 权的 0.01)', () => {
      const dist: Distribution = {
        battleId: MOCK_BATTLE_ID, shareType: SHARE_TYPE.PLATFORM,
        recipient: '0x' + 'c'.repeat(40), nodeId: MOCK_DECK1, amount: EXPECTED.PLATFORM,
      };
      expect(validator.verifyDistribution(makeBattle(), dist).ok).toBe(true);
      expect(dist.amount).toBe(5000000000000000n);
    });

    it('AMBASSADOR (6) = 0.005 MEER', () => {
      const dist: Distribution = {
        battleId: MOCK_BATTLE_ID, shareType: SHARE_TYPE.AMBASSADOR,
        recipient: '0x' + 'd'.repeat(40), nodeId: MOCK_DECK1, amount: EXPECTED.AMBASSADOR,
      };
      expect(validator.verifyDistribution(makeBattle(), dist).ok).toBe(true);
      expect(dist.amount).toBe(5000000000000000n);
    });

    it('RESERVE (7) = 0.004 MEER', () => {
      const dist: Distribution = {
        battleId: MOCK_BATTLE_ID, shareType: SHARE_TYPE.RESERVE,
        recipient: '0x' + 'e'.repeat(40), nodeId: MOCK_DECK1, amount: EXPECTED.RESERVE,
      };
      expect(validator.verifyDistribution(makeBattle(), dist).ok).toBe(true);
      expect(dist.amount).toBe(4000000000000000n);
    });

    it('未知 shareType 应失败 (1-7 才是有效)', () => {
      const dist: Distribution = {
        battleId: MOCK_BATTLE_ID, shareType: 99, recipient: '0xf'.repeat(40), nodeId: MOCK_DECK1, amount: 0n,
      };
      const r = validator.verifyDistribution(makeBattle(), dist);
      expect(r.ok).toBe(false);
      expect(r.errors[0]).toContain('unknown shareType');
    });
  });

  describe('verifyPoolConsistency (7 权累计)', () => {
    it('7 个 distribution 累计 = revenuePool (容差 7 wei)', () => {
      const battle: BattleSummary = {
        battleId: MOCK_BATTLE_ID,
        player1: MOCK_CREATOR, player2: MOCK_OPPONENT,
        deck1: MOCK_DECK1, deck2: MOCK_DECK1,
        betAmount: MOCK_BET, revenuePool: MOCK_POOL,
        distributions: [
          { battleId: MOCK_BATTLE_ID, shareType: SHARE_TYPE.CREATOR, recipient: MOCK_CREATOR, nodeId: MOCK_DECK1, amount: EXPECTED.CREATOR },
          { battleId: MOCK_BATTLE_ID, shareType: SHARE_TYPE.EDGE, recipient: MOCK_OPPONENT, nodeId: MOCK_DECK1, amount: EXPECTED.EDGE },
          { battleId: MOCK_BATTLE_ID, shareType: SHARE_TYPE.REVIEWER, recipient: '0xa'.repeat(40), nodeId: MOCK_DECK1, amount: EXPECTED.REVIEWER },
          { battleId: MOCK_BATTLE_ID, shareType: SHARE_TYPE.PUBLIC_POOL, recipient: '0xb'.repeat(40), nodeId: MOCK_DECK1, amount: EXPECTED.PUBLIC_POOL },
          { battleId: MOCK_BATTLE_ID, shareType: SHARE_TYPE.PLATFORM, recipient: '0xc'.repeat(40), nodeId: MOCK_DECK1, amount: EXPECTED.PLATFORM },
          { battleId: MOCK_BATTLE_ID, shareType: SHARE_TYPE.AMBASSADOR, recipient: '0xd'.repeat(40), nodeId: MOCK_DECK1, amount: EXPECTED.AMBASSADOR },
          { battleId: MOCK_BATTLE_ID, shareType: SHARE_TYPE.RESERVE, recipient: '0xe'.repeat(40), nodeId: MOCK_DECK1, amount: EXPECTED.RESERVE },
        ],
      };
      const r = validator.verifyPoolConsistency(battle);
      expect(r.errors.length).toBe(0);
    });

    it('verifyAllDistributions 7 场景全绿', () => {
      const battle: BattleSummary = {
        battleId: MOCK_BATTLE_ID,
        player1: MOCK_CREATOR, player2: MOCK_OPPONENT,
        deck1: MOCK_DECK1, deck2: MOCK_DECK1,
        betAmount: MOCK_BET, revenuePool: MOCK_POOL,
        distributions: [
          { battleId: MOCK_BATTLE_ID, shareType: SHARE_TYPE.CREATOR, recipient: MOCK_CREATOR, nodeId: MOCK_DECK1, amount: EXPECTED.CREATOR },
          { battleId: MOCK_BATTLE_ID, shareType: SHARE_TYPE.EDGE, recipient: MOCK_OPPONENT, nodeId: MOCK_DECK1, amount: EXPECTED.EDGE },
          { battleId: MOCK_BATTLE_ID, shareType: SHARE_TYPE.REVIEWER, recipient: '0xa'.repeat(40), nodeId: MOCK_DECK1, amount: EXPECTED.REVIEWER },
          { battleId: MOCK_BATTLE_ID, shareType: SHARE_TYPE.PUBLIC_POOL, recipient: '0xb'.repeat(40), nodeId: MOCK_DECK1, amount: EXPECTED.PUBLIC_POOL },
          { battleId: MOCK_BATTLE_ID, shareType: SHARE_TYPE.PLATFORM, recipient: '0xc'.repeat(40), nodeId: MOCK_DECK1, amount: EXPECTED.PLATFORM },
          { battleId: MOCK_BATTLE_ID, shareType: SHARE_TYPE.AMBASSADOR, recipient: '0xd'.repeat(40), nodeId: MOCK_DECK1, amount: EXPECTED.AMBASSADOR },
          { battleId: MOCK_BATTLE_ID, shareType: SHARE_TYPE.RESERVE, recipient: '0xe'.repeat(40), nodeId: MOCK_DECK1, amount: EXPECTED.RESERVE },
        ],
      };
      const r = validator.verifyAllDistributions(battle);
      expect(r.errors).toEqual([]);
    });
  });
});
