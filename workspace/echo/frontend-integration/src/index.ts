/**
 * @echo/battle-revenue-integration
 *
 * 联调 v0.1 骨架
 * - 事件订阅：WS 主 + HTTP fallback
 * - 分账验证、链上查询：占位符（待 ABI）
 */

export { BattleEventSubscriber } from './event-subscriber/subscriber';
export { BattleRevenueWSClient, WSEvent, RawLog } from './event-subscriber/ws-client';
export { HTTPFallbackPoller } from './event-subscriber/http-fallback';
export { CONFIG, EVENT_SIGNATURES, EventName } from './config';
export { RevenueValidator, verifyDistribution, verifyClaim, validateBattle } from './revenue-validator/validator';
export { ChainReader, readBattle, readPlayerStats, readRevenuePool } from './chain-reader/reader';
export {
  loadHexagramData, getBaseHexagram, getCombinationEffect,
  applyPositionSwap, checkSoftCap,
} from './hexagram/loader';
export type {
  HexagramData, BaseHexagram, CombinationEffect, PositionSwapRules, SoftCap,
} from './hexagram/loader';
