/**
 * 16 卦加载器单测
 * 验证路径解析 + 数据加载
 */
import { describe, it, expect } from 'vitest';
import {
  loadHexagramData, getBaseHexagram, getCombinationEffect,
  applyPositionSwap, checkSoftCap,
} from '../src/hexagram/loader';

describe('HexagramData v0.2 loader', () => {
  it('loads data from correct path', () => {
    const data = loadHexagramData();
    expect(data.version).toBe('v0.2');
    expect(data.baseHexagrams.length).toBe(8);
    expect(data.combinationEffects.length).toBe(16);
  });

  it('gets base hexagram by id', () => {
    const qian = getBaseHexagram(1);
    expect(qian).toBeDefined();
    expect(qian!.name).toBe('乾');
  });

  it('gets combination effect (bidirectional)', () => {
    const qianQian = getCombinationEffect(1, 1);
    expect(qianQian).toBeDefined();
    expect(qianQian!.resultName).toBe('天行健');
  });

  it('softCap 100,000 MEER', () => {
    const data = loadHexagramData();
    expect(data.softCap.value).toBe(100_000);
    expect(data.softCap.unit).toBe('MEER');
  });

  it('positionSwapRules 30/70', () => {
    const data = loadHexagramData();
    expect(data.positionSwapRules.weakToStrongRatio).toBe(30);
    expect(data.positionSwapRules.strongRetentionRatio).toBe(70);
  });

  it('applyPositionSwap: 天地否 (1+2) triggers 30/70', () => {
    const result = applyPositionSwap(1, 2, 100n, 1000n);
    expect(result.triggered).toBe(true);
    // 弱者 100, 强者 1000, 30% 转给弱
    // transfer = (1000-100) * 30 / 100 = 270
    // newWeak = 100 + 270 = 370
    // newStrong = 1000 * 70/100 + 270 = 700 + 270 = 970
    expect(result.newA).toBe(370n);
    expect(result.newB).toBe(970n);
  });

  it('applyPositionSwap: 其他组合不触发', () => {
    const result = applyPositionSwap(1, 3, 100n, 1000n);
    expect(result.triggered).toBe(false);
    expect(result.newA).toBe(100n);
    expect(result.newB).toBe(1000n);
  });

  it('checkSoftCap: 兑+兑 触发 100k cap', () => {
    const cap = 100_000n * 10n ** 18n;
    const overRevenue = cap + 50n * 10n ** 18n;
    const result = checkSoftCap(7, 7, overRevenue);
    expect(result.triggered).toBe(true);
    expect(result.finalRevenue).toBe(cap);
    expect(result.excess).toBe(50n * 10n ** 18n);
  });

  it('checkSoftCap: 非收益组合不触发', () => {
    const revenue = 200_000n * 10n ** 18n;
    const result = checkSoftCap(1, 2, revenue);
    expect(result.triggered).toBe(false);
    expect(result.excess).toBe(0n);
  });
});
