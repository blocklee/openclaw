/**
 * 链上数据查询封装
 *
 * 提供：
 * - getBattle(battleId) — battle 详情
 * - getDistributions(battleId) — 分配明细
 * - getPendingRevenue(address) — 待领收益
 * - getPlayerStats(address) — 玩家战绩
 * - getRevenuePoolStatus() — 平台费池状态
 */

import { Contract, Provider } from 'ethers';
import * as path from 'path';
import { CONFIG } from '../config';
import { BattleSummary, Distribution } from '../revenue-validator/validator';

// 从本地编译的 abi 文件加载（来源: github zhouyatingkol/echo-v2 main, contracts/battle-of-potential/BattleRevenue.sol, solc 0.8.20 + OZ 5.0.2 编译）
// 走真 ABI + chain 上少 3 个 getter 是“链上 4 权 / 源码 7 权”的版本差异
import * as ABI_FILE from '../../abi/BattleRevenue.minimal.abi.json';

const MINIMAL_ABI = ABI_FILE as any;

export interface PlayerStats {
  address: string;
  totalBattles: number;
  wins: number;
  losses: number;
  totalEarnings: bigint;
  pendingRevenue: bigint;
}

export class BattleChainReader {
  private contract: Contract;
  private provider: Provider;

  constructor(provider: Provider, contractAddress = CONFIG.BATTLE_REVENUE_ADDRESS) {
    this.provider = provider;
    this.contract = new Contract(contractAddress, MINIMAL_ABI, provider);
  }

  /** 读 battle 详情 */
  async getBattle(battleId: string): Promise<BattleSummary | null> {
    try {
      const raw = await this.contract.getBattle(battleId);
      return {
        battleId: raw.battleId,
        player1: raw.player1,
        player2: raw.player2,
        deck1: raw.deck1,
        deck2: raw.deck2,
        betAmount: raw.betAmount,
        revenuePool: raw.revenuePool,
        winner: raw.winner !== '0x0000000000000000000000000000000000000000' ? raw.winner : undefined,
        endedAt: raw.endedAt > 0n ? Number(raw.endedAt) : undefined,
      };
    } catch (e: any) {
      console.error(`[reader] getBattle ${battleId} failed:`, e.message);
      return null;
    }
  }

  /** 读 distribution 明细 */
  async getDistributions(battleId: string): Promise<Distribution[]> {
    try {
      const raws = await this.contract.getDistributions(battleId);
      return raws.map((r: any) => ({
        battleId: r.battleId,
        shareType: Number(r.shareType),
        recipient: r.recipient,
        nodeId: r.nodeId,
        amount: r.amount,
      }));
    } catch (e: any) {
      console.error(`[reader] getDistributions ${battleId} failed:`, e.message);
      return [];
    }
  }

  /** 读待领收益 */
  async getPendingRevenue(address: string): Promise<bigint> {
    try {
      return await this.contract.getPendingRevenue(address);
    } catch (e: any) {
      console.error(`[reader] getPendingRevenue ${address} failed:`, e.message);
      return 0n;
    }
  }

  /** 读玩家 battle 列表 */
  async getBattlesByPlayer(address: string, offset = 0, limit = 50): Promise<string[]> {
    try {
      return await this.contract.getBattlesByPlayer(address, offset, limit);
    } catch (e: any) {
      console.error(`[reader] getBattlesByPlayer ${address} failed:`, e.message);
      return [];
    }
  }

  /** 读玩家聚合统计（基于 battle 列表计算） */
  async getPlayerStats(address: string, sampleSize = 100): Promise<PlayerStats> {
    const battleIds = await this.getBattlesByPlayer(address, 0, sampleSize);
    let wins = 0;
    let losses = 0;
    let totalEarnings = 0n;
    for (const bid of battleIds) {
      const b = await this.getBattle(bid);
      if (!b) continue;
      if (b.winner && b.winner.toLowerCase() === address.toLowerCase()) {
        wins++;
      } else if (b.winner) {
        losses++;
      }
      // 累计 winner pool 部分
      if (b.winner && b.winner.toLowerCase() === address.toLowerCase()) {
        const dists = await this.getDistributions(bid);
        for (const d of dists) {
          if (d.recipient.toLowerCase() === address.toLowerCase()) {
            totalEarnings += d.amount;
          }
        }
      }
    }
    const pendingRevenue = await this.getPendingRevenue(address);
    return {
      address,
      totalBattles: battleIds.length,
      wins,
      losses,
      totalEarnings,
      pendingRevenue,
    };
  }

  /** 读平台费池余额 */
  async getRevenuePoolBalance(): Promise<bigint> {
    try {
      return await this.contract.getRevenuePoolBalance();
    } catch (e: any) {
      console.error('[reader] getRevenuePoolBalance failed:', e.message);
      return 0n;
    }
  }
}
