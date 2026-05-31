// ECHO v0.4 QNG Mainnet — 合约地址 + ABI 速查表
// 生成时间: 2026-05-25 19:24
// 验证状态: 8/8 已验证 (qng.qitmeer.io)

export const ECHO_CONTRACTS = {
  network: "qngMainnet",
  chainId: 813,
  rpc: "https://qng.rpc.qitmeer.io",
  explorer: "https://qng.qitmeer.io",
  
  GovernanceDAO: {
    address: "0x07E0FFCA344f846B499C811CE3127F5f3BFAd0b7",
    description: "治理DAO：成员管理、提案执行、紧急干预配置",
    constructorArgs: []
  },
  
  AgentJury: {
    address: "0x8b8F8B8f354b4D09c659E6c287a7258A728fb72D",
    description: "陪审团：commit-reveal 投票、多源熵随机数 (VRC)",
    constructorArgs: ["0x07E0FFCA344f846B499C811CE3127F5f3BFAd0b7"] // GovernanceDAO address
  },
  
  LicenseNFT: {
    address: "0x34980A52885F78F75840F36AA6Cd6F06a8FEBA28",
    description: "许可NFT：Usage/Extension/Derivative/Revenue 四种许可",
    constructorArgs: []
  },
  
  CreatorConfig: {
    address: "0x63016360C0A68Fad0529B85a320c94117994c56a",
    description: "创作者配置：版本管理、定价、日落机制",
    constructorArgs: []
  },
  
  PotentialEngine: {
    address: "0x6D1fc73342b32ea5E830E26C18b44Ea7422578eb",
    description: "势位评估引擎：NPS、engagement、disputeRate 计算",
    constructorArgs: []
  },
  
  ExitGasPool: {
    address: "0xd15c68d980B3Acce0121e52d0D55C73A79e2F3F2",
    description: "退出Gas池：退款、流动性管理",
    constructorArgs: []
  },
  
  AgentReputation: {
    address: "0x62c3DC9947FD2f566E62C55d815847B9d5747624",
    description: "Agent声誉库：score、casesParticipated、casesCorrect",
    constructorArgs: []
  },
  
  EmergencyIntervention: {
    address: "0xc402F9FF6591265A8A5f7Ac79577AC713a7Af94C",
    description: "紧急干预：标准通道 + 快速通道",
    constructorArgs: []
  }
};

// 编译参数（验证用）
export const COMPILER_CONFIG = {
  version: "0.8.20",
  viaIR: true,
  optimizer: { enabled: true, runs: 200 },
  evmVersion: "shanghai"
};
