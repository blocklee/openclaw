/**
 * ECHO BattleRevenue 集成配置
 * QNG 主网配置
 */

export const CONFIG = {
  // QNG 主网 WebSocket 端点
  WS_ENDPOINT: 'wss://qng.rpc.qitmeer.io/ws',

  // BattleRevenue 合约地址
  // v0.2 7 权单层版 (github main 分支 contracts/battle-of-potential/BattleRevenue.sol)
  // 链上实测 e2e 7/7 全过, diff=0
  BATTLE_REVENUE_ADDRESS: '0x43CeDEd545Dd40B17aec66C1831c3863a70B879f',

  // 心跳 ping 间隔(毫秒)
  PING_INTERVAL_MS: 30_000,

  // 断连重试
  RECONNECT_DELAYS_MS: [1_000, 2_000, 4_000, 8_000, 30_000],

  // HTTP polling fallback 间隔
  POLL_INTERVAL_MS: 12_000,

  // 分账比例（基点 bps，总和 10000 = 100%）
  // v2.0 7 权单层版（github main 分支 BattleRevenue.sol，45+25+8+8+5+5+4=100%）
  SHARE_BPS: {
    CREATOR: 4500,     // 45% — 牌组创作者（再按 cardPotential/totalPotential 细分）
    EDGE: 2500,        // 25% — 编排者
    REVIEWER: 800,     //  8% — 审查员
    PUBLIC_POOL: 800,  //  8% — 公共池
    PLATFORM: 500,     //  5% — 系统费
    AMBASSADOR: 500,   //  5% — 大使
    RESERVE: 400,      //  4% — 储备
  },

  // shareType 编号（与合约 _recordDistribution 调用一致）
  // 1=creator, 2=edge, 3=reviewer, 4=public, 5=platform, 6=ambassador, 7=reserve
  SHARE_TYPE: {
    CREATOR: 1,
    EDGE: 2,
    REVIEWER: 3,
    PUBLIC_POOL: 4,
    PLATFORM: 5,
    AMBASSADOR: 6,
    RESERVE: 7,
  },

  // 16 卦数据 v0.2 (猫先森 8:41 UTC 确认, docs/hexagram-data-v0.2.json)
  // 包含 8 基础卦 + 16 组合效果 + 势位互换规则 + 软上限
  HEXAGRAM_DATA_PATH: 'data/hexagram-data-v0.2.json',

  // 势位互换规则 (天地否 乾+坤 触发, 弱者获 30%, 强者保留 70%)
  POSITION_SWAP_RULES: {
    trigger: '天地否（乾+坤）',
    weakToStrongRatio: 30,
    strongRetentionRatio: 70,
    formula: 'if (weak < strong) { weak += (strong - weak) * 0.30; strong = strong * 0.70 + weak * 0.30; }',
  },

  // 软上限 (收益组合 兑+兑 或 乾+兑 触发, 超额入公共池)
  SOFT_CAP: {
    value: 100_000,         // 100,000 MEER
    unit: 'MEER',
    trigger: '收益组合（兑+兑 或 乾+兑）',
    excessHandling: '进入公共池',  // 合约层不实现, 前端/链下计算后截断
  },
} as const;

export const EVENT_SIGNATURES = {
  REVENUE_DISTRIBUTED: 'RevenueDistributed(bytes32,uint8,address,bytes32,uint256)',
  BATTLE_CREATED: 'BattleCreated(bytes32,address,address,bytes32,bytes32,uint256)',
  BATTLE_ENDED: 'BattleEnded(bytes32,address)',
  REVENUE_CLAIMED: 'RevenueClaimed(address,uint256)',
} as const;
