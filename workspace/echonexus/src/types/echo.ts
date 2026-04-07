// ECHO 协议核心类型定义

export type PricingModelType = 'TimesBased' | 'DurationBased' | 'Subscription' | 'Freemium' | 'Hybrid';

export interface PricingInfo {
  type: PricingModelType;
  pricePerUse?: bigint;
  pricePerMinute?: bigint;
  minMinutes?: number;
  pricePerMonth?: bigint;
  features?: string[];
  freeUses?: number;
  pricePerUseAfter?: bigint;
  base?: bigint;
  usage?: bigint;
  maxMonthly?: bigint;
}

export interface DerivativeTerms {
  upfrontFee: bigint;
  usageRoyalty: number; // 百分比 0-100
}

export interface RentalInfo {
  pricing: PricingInfo;
  isActive: boolean;
}

export interface EchoSkill {
  tokenId: string;
  owner: string;
  name: string;
  description: string;
  imageUrl?: string;
  category: string;
  tags: string[];
  // ECHO 协议相关
  rentalInfo: RentalInfo;
  derivativeTerms: DerivativeTerms;
  extensible: boolean;
  maxSceneRoyalty: number;
  // 元数据
  createdAt: number;
  totalUses: number;
  totalRevenue: bigint;
  // IPFS
  metadataCid?: string;
  openClawSkillId?: string;
}

export interface UserPermission {
  tokenId: string;
  user: string;
  expiresAt?: number;
  remainingUses?: number;
  isActive: boolean;
}

export interface DerivativeGraphNode {
  tokenId: string;
  children: string[];
}

export interface ParentShare {
  tokenId: string;
  share: number; // 百分比
}

export interface RevenueShare {
  recipient: string;
  amount: bigint;
  share: number;
}

// 四权类型
export type EchoRight = 'ownership' | 'usage' | 'derivative' | 'extension';

// 权限检查结果
export interface PermissionCheckResult {
  approved: boolean;
  reason: string;
  requiredAmount?: bigint;
}

// 场景扩展授权
export interface ScenePermission {
  scene: string; // 场景合约地址
  tokenId: string;
  beneficiary: string;
  royaltyPercent: number;
  approved: boolean;
}
