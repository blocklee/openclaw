---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: f968b302f786d0a539f4c05b6cece1e9
    PropagateID: f968b302f786d0a539f4c05b6cece1e9
    ReservedCode1: 304402207b3730d5bc6cf1527ec78f05bc056e254f1568e8dcea1a38c0ed4b0f18c329a702202299bb2a576da4ce2ac64f22b87c880703d1f7b5f2cfae9f18349fb2dba08615
    ReservedCode2: 3046022100b6e4e1fd550024707f064c7e4aa5b6394d11946ef7ff776034b9a4d88599c307022100f5c570041df5bb717dce7c77a933413ab4b4d34b7fd9617467c4f4d4af7c162e
---

# EchoNexus: AI Agent 能力资产化协议

> **版本**: v2.0 (实现版)
> **更新日期**: 2026-04-03
> **状态**: 设计完成 + React Demo 已部署

## 1. 概念设计

### 1.1 愿景
将 AI Agent 的 Skills/Knowledge 转化为可交易的链上资产，实现"能力即资产，调用即分润"的原生 AI 经济体系。

### 1.2 核心定位
**EchoNexus = ECHO 协议 × OpenClaw 执行引擎**

| 维度 | 传统模式 | EchoNexus 模式 |
|------|---------|---------------|
| Agent 能力 | 静态绑定 | 动态资产化 |
| 使用授权 | 手动审批 | 智能合约自动 |
| 分润结算 | 中心化清分 | 链上自动分润 |
| 能力发现 | 目录检索 | 资产市场交易 |

### 1.3 四权映射

```
ECHO 协议四权          EchoNexus Agent 能力
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
所有权 (Ownership)     → Agent/Skill 创作者的完整控制权
使用权 (Usage)         → 按次/按时长付费调用 Agent 能力
衍生权 (Derivative)    → 基于已有 Skill 构建组合 Skill
扩展权 (Extension)     → 跨平台/场景授权使用能力
```

## 2. 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         EchoNexus 生态                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   能力创建者   │    │   能力运营者   │    │   能力消费者   │     │
│  │ Creator      │    │   Operator   │    │   Consumer   │     │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘     │
│         │                   │                   │              │
│         ▼                   ▼                   ▼              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    EchoNexus Hub                        │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐  │   │
│  │  │  能力路由    │ │  权限裁决    │ │   计费结算       │  │   │
│  │  │  Router     │ │  Arbiter    │ │   Settlement    │  │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘  │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐  │   │
│  │  │  能力注册    │ │  使用追踪    │ │   分润引擎      │  │   │
│  │  │  Registry   │ │  Tracker    │ │   Distributor   │  │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                 │
│         ┌────────────────────┼────────────────────┐            │
│         ▼                    ▼                    ▼            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   ECHO       │    │  OpenClaw    │    │   外部       │     │
│  │   合约层     │    │   执行层      │    │   市场       │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 核心组件

#### 2.2.1 服务层架构 (已实现)

```
src/services/
├── echoSimulator.ts      # ECHO 合约模拟层 (离线演示)
│   ├── MockAsset          # 模拟资产状态
│   ├── PermissionRequest  # 权限请求管理
│   ├── DerivativeRequest  # 衍生请求管理
│   ├── UsageLog          # 使用日志
│   └── Event System      # 事件监听
│
└── agentEngine.ts        # Agent 执行引擎
    ├── routeRequest()     # 能力路由
    ├── checkPermissions() # 权限裁决
    ├── execute()          # 执行调度
    └── createCapability() # 能力创建
```

#### 2.2.2 能力路由 (Capability Router)

```typescript
// 请求路由流程
User Request → 能力解析 → 权限验证 → 链上计费 → 执行调度 → 结果返回

interface RoutingResult {
  success: boolean;
  matchedSkill?: CapabilityMatch;
  alternatives?: CapabilityMatch[];
  estimatedCost?: bigint;
  verdict: ExecutionVerdict;
}

interface CapabilityMatch {
  asset: MockAsset;
  confidence: number;
  matchedCapabilities: string[];
  missingCapabilities: string[];
  estimatedCost: bigint;
}
```

#### 2.2.3 权限裁决 (Permission Arbiter)

```typescript
type VerdictType = 'APPROVED' | 'DENIED' | 'CONDITIONAL' | 'PENDING_APPROVAL';

interface ExecutionVerdict {
  verdict: VerdictType;
  message: string;
  conditions?: string[];
  settlementPlan?: SettlementPlan;
  requiredActions?: string[];
}

// 裁决规则
const arbiterRules = {
  // 规则1: 所有权优先
  ownershipPriority: (asset, requester) =>
    asset.owner === requester ? 'APPROVED' : 'CONTINUE',

  // 规则2: 使用权计量
  usageMetering: (asset, usage) => {
    if (asset.pricing.type === 'TimesBased') {
      return asset.remainingTimes > 0 ? 'APPROVED' : 'DENIED';
    }
    if (asset.pricing.type === 'DurationBased') {
      return !asset.expired ? 'APPROVED' : 'DENIED';
    }
  },

  // 规则3: 扩展权授权检查
  extensionAuthorization: (asset, scene) => {
    if (asset.extensionMode === 'OwnerDirect') {
      return asset.authorizedExtensions.includes(scene) ? 'APPROVED' : 'DENIED';
    }
    if (asset.extensionMode === 'RequestBased') {
      return asset.pendingRequests.includes(scene) ? 'CONDITIONAL' : 'ESCALATE';
    }
  },

  // 规则4: 衍生权合规
  derivativeCompliance: (parent, child) => {
    if (!child.approved) return 'DENIED';
    if (child.upfrontFee > parent.maxDerivativeFee) return 'DENIED';
    return 'APPROVED';
  }
};
```

#### 2.2.4 计费结算 (Billing Settlement)

```typescript
// 分润计划
interface SettlementPlan {
  type: 'immediate' | 'rental' | 'subscription';
  amount: bigint;
  breakdown: {
    creator: bigint;      // 80%
    protocol: bigint;    // 15%
    ecosystem: bigint;   // 5%
    parentRoyalties?: bigint;
    sceneBeneficiary?: bigint;
  };
}

// 收益分配比例
const REVENUE_SHARE = {
  creator: 0.80,      // 80%
  protocol: 0.15,     // 15%
  ecosystem: 0.05,    // 5%
};
```

### 2.3 ECHO 合约接口映射

```
ECHO 合约接口              EchoNexus 功能
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

资产创建和租用
├── mint()                 → createAgentAsset()
├── createDerivative()     → forkSkill()
├── rentEcho()             → temporaryAccess()
└── selfDerive()           → bundleSkill()

费用与状态设置
├── updateRentalInfo()     → setPricing()
├── setExtensible()       → configureExtension()
└── setDerivTerms()        → setDerivativeTerms()

使用权层
├── useECHO()              → executeSkill()
├── userOf()               → getCurrentUser()
├── getRemainingTimes()    → checkQuota()
└── getUseStatus()         → getUsageStatus()

租赁分润
├── EchoRented             → AccessGranted
└── RevenueDistributedBase → UsageRevenue event

授权管理
├── approvePermission()    → grantExtension()
├── revokePermission()      → revokeExtension()
├── requestPermission()     → requestExtension()
└── updateSceneBeneficiary()→ setSceneBeneficiary()

衍生层
├── requestAsDerivative()  → requestFork()
├── approveDerivativeRequest() → approveFork()
├── rejectDerivativeRequest()  → rejectFork()
├── getDerivativeGraph()   → viewDerivativeTree()
└── getParentShareList()   → getParentRevenue()
```

## 3. React Demo 实现

### 3.1 项目结构

```
echonexus-demo/
├── src/
│   ├── components/hub/
│   │   └── EchoNexusHub.tsx   # 主组件 (9个视图)
│   ├── services/
│   │   ├── echoSimulator.ts   # ECHO 模拟层
│   │   └── agentEngine.ts     # Agent 执行引擎
│   ├── hooks/
│   │   ├── useWallet.tsx      # 钱包连接
│   │   └── useEcho.tsx        # 合约交互
│   └── contracts/
│       └── echo.ts            # 合约 ABI 定义
└── package.json
```

### 3.2 视图说明

| 视图 | 功能 | 核心交互 |
|------|------|---------|
| Dashboard | 系统总览、统计图表 | 实时数据刷新 |
| **Agent Executor** | 能力路由、执行引擎 | 完整请求→裁决→执行流程 |
| Wallet Connect | MetaMask 连接 | 网络切换 |
| Permission Arbiter | 权限裁决 | 审批/拒绝请求 |
| Billing & Settlement | 收益分润 | 模拟执行、实时分润 |
| Asset Market | 交易市场 | 搜索、租赁 |
| Derivative Manager | 衍生管理 | 请求、审批 |
| Extension Rights | 扩展权管理 | OwnerDirect/RequestBased |
| ECHO Contracts | 合约文档 | 完整接口参考 |

### 3.3 Agent Executor 执行流程

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Execution Flow                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User Input: "analyze contract for IP issues"          │
│                    ↓                                        │
│  2. routeRequest()                                         │
│     ├─ Extract keywords: [analyze, contract, IP]         │
│     ├─ Match against ECHO assets                           │
│     └─ Best match: ECHO-001 (92% confidence)              │
│                    ↓                                        │
│  3. checkPermissions() → CONDITIONAL (需支付)              │
│     ├─ Not owner                                           │
│     ├─ Not renter                                          │
│     └─ Payment required: 0.01 ETH                         │
│                    ↓                                        │
│  4. Settlement Plan:                                       │
│     • Creator: 0.008 ETH (80%)                            │
│     • Protocol: 0.0015 ETH (15%)                         │
│     • Ecosystem: 0.0005 ETH (5%)                         │
│                    ↓                                        │
│  5. execute()                                              │
│     ├─ Call echoSimulator.useECHO()                       │
│     ├─ Emit RevenueDistributedBase event                  │
│     └─ Update usage logs                                  │
│                    ↓                                        │
│  6. Result:                                               │
│     { success: true, txHash: 0x..., revenue: {...} }    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 合约 SDK

```typescript
// 完整 ABI 定义 (echo.ts)

// IECHO - 核心资产接口
export const IECHO_ABI = [
  { name: 'ownerOf', inputs: ['uint256 tokenId'], outputs: ['address'] },
  { name: 'userOf', inputs: ['uint256 tokenId'], outputs: ['address'] },
  { name: 'getRemainingTimes', inputs: ['uint256 tokenId'], outputs: ['uint256'] },
  { name: 'mint', inputs: ['string metadataURI'], outputs: ['uint256'] },
  { name: 'useECHO', inputs: ['uint256 tokenId', 'bytes params'], outputs: [] },
];

// IECHORentable - 租赁接口
export const IECHORENTABLE_ABI = [
  { name: 'rentEcho', inputs: ['uint256 tokenId', 'uint256 duration'], outputs: [] },
  { name: 'updateRentalInfo', inputs: ['uint256 tokenId', 'uint8 rentalType', 'uint256 price'], outputs: [] },
  { name: 'getRentalInfo', inputs: ['uint256 tokenId'], outputs: ['RentalInfo'] },
  { name: 'getRentalPrice', inputs: ['uint256 tokenId'], outputs: ['uint256'] },
];

// IECHODerivable - 衍生接口
export const IECHODERIVABLE_ABI = [
  { name: 'requestAsDerivative', inputs: ['uint256 parentId', 'string derivedName', ...], outputs: ['uint256'] },
  { name: 'createDerivative', inputs: ['uint256 parentId', 'bytes derivativeProof'], outputs: ['uint256'] },
  { name: 'setDerivTerms', inputs: ['uint256 tokenId', 'uint256 upfrontFee', 'uint256 usageRoyalty'], outputs: [] },
  { name: 'getDerivativeGraph', inputs: ['uint256 tokenId'], outputs: ['DerivativeNode[]'] },
];

// IECHOExtensible - 扩展接口
export const IECHOEXTENSIBLE_ABI = [
  { name: 'setExtensible', inputs: ['uint256 tokenId', 'bool extensible', 'uint8 mode', 'uint256 maxSceneRevenueShare'], outputs: [] },
  { name: 'approvePermission', inputs: ['uint256 tokenId', 'address grantee', 'string scene'], outputs: [] },
  { name: 'requestPermission', inputs: ['uint256 tokenId', 'string scene', 'uint256 proposedRevenueShare', 'string reason'], outputs: ['uint256'] },
  { name: 'useECHOOf', inputs: ['uint256 tokenId', 'string scene', 'bytes params'], outputs: [] },
];
```

## 4. ECHO 模拟层 (echoSimulator.ts)

### 4.1 核心功能

```typescript
class EchoSimulator {
  // 资产操作
  mint(metadataURI: string, signer: string): Promise<string>
  ownerOf(tokenId: string): Promise<string>
  userOf(tokenId: string): Promise<string>
  getRemainingTimes(tokenId: string): Promise<bigint>
  getAssetInfo(tokenId: string): Promise<AssetInfo>

  // 使用操作
  useECHO(tokenId: string, user: string, params?: string): Promise<RevenueDistribution>

  // 租赁操作
  rentEcho(tokenId: string, renter: string, duration: number): Promise<void>
  getRentalInfo(tokenId: string): Promise<RentalInfo>
  updateRentalInfo(tokenId: string, owner: string, rentalType: 0 | 1, price: bigint): Promise<void>

  // 衍生操作
  setDerivTerms(tokenId: string, owner: string, upfrontFee: bigint, usageRoyalty: number): Promise<void>
  requestAsDerivative(parentId: string, requester: string, ...): Promise<bigint>
  approveDerivativeRequest(parentId: string, requestId: bigint): Promise<string>
  rejectDerivativeRequest(requestId: bigint): Promise<void>

  // 扩展操作
  setExtensible(tokenId: string, owner: string, extensible: boolean, mode: 0 | 1, maxSceneRevenueShare: number): Promise<void>
  approvePermission(tokenId: string, owner: string, grantee: string, scene: string): Promise<void>
  requestPermission(tokenId: string, requester: string, scene: string, proposedRevenueShare: number, reason: string): Promise<bigint>
  useECHOOf(tokenId: string, user: string, scene: string, params?: string): Promise<RevenueDistribution>

  // 事件系统
  on(event: string, callback: Function): void
  emit(event: string, ...args: any[]): void

  // 查询
  getAssets(): MockAsset[]
  getUsageLogs(limit?: number): UsageLog[]
  getStats(): SimulatorStats
}
```

### 4.2 Mock 资产示例

```typescript
const mockAssets: MockAsset[] = [
  {
    tokenId: 'ECHO-001',
    owner: '0x7a25...8D',
    metadataURI: 'ipfs://QmXxx.../skill-legal-analysis.json',
    isActive: true,
    rentalInfo: {
      rentalType: 0, // TimesBased
      pricePerUse: parseEther('0.01'),
      remainingUses: BigInt(847),
    },
    derivTerms: {
      allowed: true,
      upfrontFee: parseEther('0.1'),
      usageRoyalty: 15,
    },
    extConfig: {
      extensible: true,
      mode: 1, // RequestBased
      maxSceneRevenueShare: 25,
    },
  },
  // ... 更多资产
];
```

## 5. Agent 执行引擎 (agentEngine.ts)

### 5.1 核心方法

```typescript
class AgentExecutionEngine {
  private agentId: string;
  private executionCount: number;

  // 能力路由
  routeRequest(
    userAddress: string,
    request: string,
    preferredRights?: RightType[]
  ): Promise<RoutingResult>

  // 执行调度
  execute(
    userAddress: string,
    tokenId: string,
    params?: string,
    scene?: string
  ): Promise<ExecutionResult>

  // 权限检查
  checkPermissions(
    userAddress: string,
    request: ExecutionRequest
  ): Promise<ExecutionVerdict>

  // 创建能力
  createCapability(
    creator: string,
    name: string,
    description: string,
    capabilities: string[],
    pricing: { type: 'TimesBased' | 'DurationBased'; price: bigint }
  ): Promise<string>
}

// 辅助函数
function extractKeywords(request: string): string[]
function calculateMatchScore(asset: MockAsset, keywords: string[], preferredRights?: RightType[]): number
```

### 5.2 裁决决策树

```
                    ┌─────────────────┐
                    │  权限裁决请求    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   所有权检查     │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                              │
     ┌────────▼────────┐            ┌─────────▼────────┐
     │  用户=所有者?   │            │    继续检查       │
     └────────┬────────┘            └─────────┬────────┘
              │                              │
       ┌──────▼──────┐               ┌───────▼───────┐
       │ APPROVED ✓  │               │  使用权检查    │
       └─────────────┘               └───────┬───────┘
                                             │
                              ┌──────────────┴──────────────┐
                              │                              │
                     ┌─────────▼─────────┐        ┌─────────▼─────────┐
                     │   已租赁?          │        │   扩展权可用?     │
                     └─────────┬─────────┘        └─────────┬─────────┘
                               │                              │
                    ┌──────────▼──────────┐         ┌─────────▼─────────┐
                    │ APPROVED (租赁) ✓  │         │  授权的地址?      │
                    └────────────────────┘         └─────────┬─────────┘
                                                              │
                                                     ┌─────────▼─────────┐
                                                     │ CONDITIONAL (付费)│
                                                     └───────────────────┘
```

## 6. 用例场景

### 6.1 场景一：专业领域顾问 Agent

```
场景：法律咨询 Agent
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

创作者 A (律师)：
  1. 将法律咨询能力打包为 Skill
  2. 设定定价：$0.5/次咨询
  3. 设置衍生条款：允许衍生但需支付 20% 版税

用户 B (需要法律建议)：
  1. 搜索法律类 Skill
  2. 租用或按次付费
  3. 获取 AI 法律建议
  4. 费用自动分润给 A

开发者 C (构建衍生产品)：
  1. 基于 A 的 Skill 创建"合同审查 Agent"
  2. 支付一次性衍生费 $100
  3. 每次使用时 A 获得 20% 版税
```

### 6.2 场景二：企业知识库 Agent

```
场景：企业内部知识库
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

企业 D：
  1. 将内部培训资料创建为 Skill 资产
  2. 设定仅限内部使用的扩展权
  3. 员工通过 OpenClaw 访问

员工 E：
  1. 通过企业账号访问
  2. 使用内部知识库 Agent
  3. 使用记录自动记录供审计
```

### 6.3 场景三：跨平台 AI 助手

```
场景：AI 写作助手跨平台分发
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

开发者 F：
  1. 创建 AI 写作 Skill
  2. 通过 ECHO 扩展权授权给多个平台

平台 G (Telegram Bot)：
  1. 申请扩展权
  2. 获得授权后在 Telegram 提供服务
  3. 每次使用向 F 分润

用户 H：
  1. 在 Telegram 使用 AI 写作
  2. 费用自动分润给 F 和平台 G
```

## 7. 经济模型

### 7.1 收益分配比例

```
使用权收益分配 (每次调用)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  创作者/所有者    80%
  协议层          15%
  生态基金        5%

衍生权收益分配
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  一次性衍生费
  ├── 亲代创作者    70%
  ├── 亲代生态      20%
  └── 协议层        10%

  衍生使用版税 (每次调用)
  ├── 衍生品所有者  60%
  ├── 亲代 (n代)    累计 30%
  └── 协议层        10%

扩展权收益分配
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  场景使用费
  ├── 资产所有者    75%
  ├── 场景受益人    15%
  └── 协议层        10%
```

### 7.2 定价模型

```typescript
type PricingModel =
  | { type: 'TimesBased'; pricePerUse: bigint }
  | { type: 'DurationBased'; pricePerMinute: bigint; minMinutes: number }
  | { type: 'Subscription'; pricePerMonth: bigint; features: string[] }
  | { type: 'Freemium'; freeUses: number; pricePerUseAfter: bigint }
  | { type: 'Hybrid'; base: bigint; usage: bigint; maxMonthly: bigint };
```

## 8. 技术实现路径

### 8.1 第一阶段：基础框架 ✅

- [x] EchoAgentFactory 合约设计
- [x] EchoAgentRegistry 合约设计
- [x] ECHO Protocol TypeScript SDK
- [x] 简单的能力注册和执行

### 8.2 第二阶段：核心功能 ✅

- [x] 完整权限裁决引擎
- [x] 计费结算系统
- [x] 衍生权管理
- [x] 扩展权管理

### 8.3 第三阶段：生态完善 ✅

- [x] 市场前端界面 (React Demo)
- [x] 开发者 SDK
- [ ] 监控和数据分析
- [ ] 安全审计

## 9. 部署信息

### 9.1 在线 Demo

- **URL**: https://pubial7bv6tj.space.minimaxi.com
- **版本**: v2.0
- **状态**: 生产就绪

### 9.2 本地运行

```bash
cd /workspace/echonexus-demo
pnpm install
pnpm run dev
```

### 9.3 技术栈

| 组件 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| UI 库 | Tailwind CSS |
| 图表 | Recharts |
| Web3 | ethers.js v6 |
| 图标 | Lucide React |

## 10. 风险与挑战

| 风险 | 缓解措施 |
|------|---------|
| 合约安全 | 完整安全审计，多签控制 |
| 定价操纵 | 建议价机制，争议解决 |
| 版权争议 | 链上存证，仲裁机制 |
| 技术门槛 | 提供低代码工具，SDK |
| 监管合规 | KYC/AML 集成，地区限制 |

---

**附录 A: 文件清单**

```
/workspace/echonexus-design.md           # 设计文档
/workspace/echonexus-demo/               # React Demo
├── src/
│   ├── services/
│   │   ├── echoSimulator.ts             # ECHO 模拟层
│   │   └── agentEngine.ts               # Agent 执行引擎
│   ├── contracts/
│   │   └── echo.ts                      # 合约 ABI
│   ├── hooks/
│   │   ├── useWallet.tsx                # 钱包连接
│   │   └── useEcho.tsx                  # 合约交互
│   └── components/hub/
│       └── EchoNexusHub.tsx             # 主组件
└── package.json
```
