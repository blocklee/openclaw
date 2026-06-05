/**
 * ECHO BattleRevenue 集成配置
 * QNG 主网 v2.0 7 权版
 */

export const CONFIG = {
  // QNG 主网 WebSocket 端点
  WS_ENDPOINT: 'wss://qng.rpc.qitmeer.io/ws',

  // BattleRevenue 合约地址（v2.0 部署后更新）
  BATTLE_REVENUE_ADDRESS: '0xd57806aF985650c002e5E51e203F69c4ca14e4f6',

  PING_INTERVAL_MS: 30_000,
  RECONNECT_DELAYS_MS: [1_000, 2_000, 4_000, 8_000, 30_000],
  POLL_INTERVAL_MS: 12_000,

  // v2.0 7 权 bps
  SHARE_BPS: {
    CREATOR: 4500,
    EDGE: 2500,
    REVIEWER: 800,
    PUBLIC_POOL: 800,
    PLATFORM: 500,
    AMBASSADOR: 500,
    RESERVE: 400,
  },
};

export const EVENT_SIGNATURES = {
  BattleCreated: 'BattleCreated(bytes32,address,address,bytes32,bytes32,uint256,uint256)',
  BattleEnded: 'BattleEnded(bytes32,address,uint256,uint256)',
  RevenueDistributed: 'RevenueDistributed(bytes32,uint8,address,bytes32,uint256)',
  RevenueClaimed: 'RevenueClaimed(bytes32,address,uint256)',
};

export type EventName = keyof typeof EVENT_SIGNATURES;

export const SHARE_TYPE = {
  CREATOR: 1,
  EDGE: 2,
  REVIEWER: 3,
  PUBLIC_POOL: 4,
  PLATFORM: 5,
  AMBASSADOR: 6,
  RESERVE: 7,
};
