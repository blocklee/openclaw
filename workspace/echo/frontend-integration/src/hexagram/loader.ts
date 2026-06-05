/**
 * 16 卦数据加载器 - 猫先森 v0.2 联调版
 * 数据源: docs/hexagram-data-v0.2.json
 * 包含: 8 基础卦 + 16 组合效果 + 势位规则 + 软上限
 */

import * as fs from 'fs';
import * as path from 'path';
import { CONFIG } from '../config';

export interface BaseHexagram {
  hexagramId: number;
  name: string;
  symbol: string;
  element: string;
  attribute: string;
  effectType: string;
  effectValue: number;
  effectUnit: string;
  description: string;
}

export interface CombinationEffect {
  combinationId: string;
  hexagramA: number;
  hexagramB: number;
  resultName: string;
  category: string;
  effectType: string;
  effectValue: number;
  effectUnit: string;
  description: string;
  fourRightsImpact: string;  // 四权影响 (攻击力 ×2, 敌方减伤失效, etc.)
}

export interface PositionSwapRules {
  mechanism: string;
  weakToStrongRatio: number;
  strongRetentionRatio: number;
  formula: string;
}

export interface SoftCap {
  value: number;
  unit: string;
  trigger: string;
  excessHandling: string;
}

export interface HexagramData {
  version: string;
  phase: string;
  totalHexagrams: number;
  activeHexagrams: number;
  baseHexagrams: BaseHexagram[];
  combinationEffects: CombinationEffect[];
  positionSwapRules: PositionSwapRules;
  softCap: SoftCap;
  revenueDistribution: Record<string, number>;
}

let cached: HexagramData | null = null;

/**
 * 加载 16 卦数据 (从本地 JSON)
 * TODO: 后续可改为从链上 oracle 加载, 但 MVP 用本地即可
 */
export function loadHexagramData(): HexagramData {
  if (cached) return cached;

  const dataPath = path.resolve(__dirname, '..', '..', CONFIG.HEXAGRAM_DATA_PATH);
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Hexagram data not found: ${dataPath}`);
  }
  const raw = fs.readFileSync(dataPath, 'utf8');
  cached = JSON.parse(raw) as HexagramData;
  return cached;
}

/**
 * 查基础卦
 */
export function getBaseHexagram(id: number): BaseHexagram | undefined {
  return loadHexagramData().baseHexagrams.find(h => h.hexagramId === id);
}

/**
 * 查组合效果 (用 A+B 组合 ID)
 */
export function getCombinationEffect(hexA: number, hexB: number): CombinationEffect | undefined {
  return loadHexagramData().combinationEffects.find(
    c => (c.hexagramA === hexA && c.hexagramB === hexB) ||
         (c.hexagramA === hexB && c.hexagramB === hexA)
  );
}

/**
 * 应用势位互换规则
 * 触发条件: 天地否 (乾+坤) = hexagramA=1, hexagramB=2
 */
export function applyPositionSwap(
  hexA: number, hexB: number,
  potentialA: bigint, potentialB: bigint
): { newA: bigint; newB: bigint; triggered: boolean } {
  const data = loadHexagramData();
  const isSkyEarth = (hexA === 1 && hexB === 2) || (hexA === 2 && hexB === 1);

  if (!isSkyEarth) {
    return { newA: potentialA, newB: potentialB, triggered: false };
  }

  // 30% 弱者, 70% 强者
  const weak = potentialA < potentialB ? potentialA : potentialB;
  const strong = potentialA < potentialB ? potentialB : potentialA;
  const ratio = BigInt(data.positionSwapRules.weakToStrongRatio);
  const base = 100n;

  const transfer = (strong - weak) * ratio / base;
  const newWeak = weak + transfer;
  const newStrong = strong * (base - ratio) / base + transfer;

  return {
    newA: potentialA < potentialB ? newWeak : newStrong,
    newB: potentialA < potentialB ? newStrong : newWeak,
    triggered: true,
  };
}

/**
 * 检查 softCap
 * 触发: 收益组合 兑+兑 (=7+7) 或 乾+兑 (=1+7)
 */
export function checkSoftCap(
  hexA: number, hexB: number,
  revenue: bigint
): { finalRevenue: bigint; excess: bigint; triggered: boolean } {
  const data = loadHexagramData();
  const isRevenueCombo =
    (hexA === 7 && hexB === 7) || (hexA === 1 && hexB === 7) ||
    (hexA === 7 && hexB === 1);

  if (!isRevenueCombo) {
    return { finalRevenue: revenue, excess: 0n, triggered: false };
  }

  const capWei = BigInt(data.softCap.value) * 10n ** 18n;
  if (revenue <= capWei) {
    return { finalRevenue: revenue, excess: 0n, triggered: false };
  }
  return { finalRevenue: capWei, excess: revenue - capWei, triggered: true };
}
