---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: c91a7d3e8353fb98e824b70ea790c08e
    PropagateID: c91a7d3e8353fb98e824b70ea790c08e
    ReservedCode1: 3045022074ed9a2ed5777a1ab8acbc335898f018a613d7c4f81c3ef8c03822478088a82c022100e715ef0a536bfb49a2c6ead5212d7c35c158d08c4be6f85c844419b6d06045e0
    ReservedCode2: 30450221009f2e6630164a2f079d52c36f16c03ad1120fd7bfb1aa914b31427c64c09d1c9602201546d862a6829d2ff52fec8a58659d717802ed1935734e4dce80bb303fec6043
---

# EchoNexus: AI Agent 能力资产化协议

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

#### 2.2.1 EchoAgent (能力代理层)

```typescript
interface EchoAgent {
  // 资产身份
  echoAssetId: string;           // ECHO NFT Token ID
  assetOwner: string;            // 资产所有者地址

  // 能力元数据
  skillManifest: SkillManifest;  // Skill 定义
  capabilityDesc: string;        // 能力描述
  pricing: PricingModel;         // 定价模型

  // 权限状态
  permissions: PermissionState;  // 当前权限状态
  usageRights: UsageRights;      // 使用权状态
  derivativeTerms: DerivTerms;    // 衍生条款
}

// Skill Manifest 定义
interface SkillManifest {
  skillId: string;
  name: string;
  description: string;
  version: string;
  entryPoint: string;            // 执行入口
  parameters: ParameterSchema[]; // 输入参数定义
  outputFormat: string;          // 输出格式
  capabilities: string[];        // 能力标签
  dependencies: string[];        // 依赖的其他 Skills
}
```

#### 2.2.2 能力路由 (Capability Router)

```
请求流程:
User Request → 能力解析 → 权限验证 → 链上计费 → 执行调度 → 结果返回

┌─────────────────────────────────────────────────────────────┐
│                    Capability Router                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Request Parser                                           │
│     ├─ Intent Detection (任务意图识别)                        │
│     ├─ Parameter Extraction (参数提取)                        │
│     └─ Capability Matching (能力匹配)                         │
│                                                              │
│  2. Permission Resolver                                      │
│     ├─ Ownership Check (所有权验证)                           │
│     ├─ Usage Rights Check (使用权检查)                         │
│     ├─ Extension Rights Check (扩展权检查)                     │
│     └─ Derivative Rights Check (衍生权检查)                    │
│                                                              │
│  3. Billing Engine                                            │
│     ├─ Pricing Calculation (定价计算)                         │
│     ├─ Payment Escrow (支付托管)                              │
│     └─ Revenue Distribution (收益分润)                        │
│                                                              │
│  4. Execution Dispatcher                                      │
│     ├─ Skill Selection (选择最优 Skill)                        │
│     ├─ Chain Execution (链上执行记录)                           │
│     └─ Result Aggregation (结果聚合)                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 2.2.3 权限裁决 (Permission Arbiter)

```typescript
// 权限裁决决策树
interface ArbiterDecision {
  requestId: string;
  requestedCapability: string;
  requester: string;
  rightsCheck: {
    ownership: boolean;      // 所有权匹配
    usageAvailable: boolean; // 使用权可用
    extensionGranted: boolean; // 扩展权已授权
    derivativeEligible: boolean; // 衍生权合规
  };
  verdict: 'APPROVED' | 'DENIED' | 'CONDITIONAL' | 'ESCALATE';
  conditions?: string[];     // 附加条件
  settlementPlan: SettlementPlan;
}

// 裁决规则引擎
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
// 计费模型
interface PricingModel {
  type: 'TimesBased' | 'DurationBased' | 'Subscription';

  // TimesBased: 按次计费
  pricePerUse?: number;
  maxUses?: number;

  // DurationBased: 时长计费
  pricePerMinute?: number;
  pricePerHour?: number;

  // Subscription: 订阅制
  subscriptionFee?: number;
  subscriptionPeriod?: 'daily' | 'weekly' | 'monthly';
}

// 分润计划
interface RevenueDistribution {
  // 基础分润 (使用权)
  usageRevenue: {
    assetOwner: number;      // 资产所有者: 80%
    protocol: number;        // 协议费: 15%
    ecosystem: number;       // 生态基金: 5%
  };

  // 衍生分润 (衍生权)
  derivativeRevenue: {
    upfrontFee: number;      // 一次性衍生费
    usageRoyalty: number;    // 使用版税
    parentShares: ParentShare[]; // 亲代分润表
  };

  // 扩展分润 (扩展权)
  extensionRevenue: {
    sceneBeneficiary: number; // 场景受益人
    platformFee: number;      // 平台费
  };
}
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

### 2.4 OpenClaw 集成架构

```
EchoNexus 与 OpenClaw 集成
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌────────────────────────────────────────────────────────┐
│                   OpenClaw Gateway                     │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              EchoNexus Plugin                     │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │          EchoClaw Adapter                 │    │   │
│  │  │  - echo_agent:create                    │    │   │
│  │  │  - echo_agent:execute                    │    │   │
│  │  │  - echo_agent:rent                      │    │   │
│  │  │  - echo_agent:derivative                │    │   │
│  │  └─────────────────────────────────────────┘    │   │
│  │                                                  │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │          Skill Registry                  │    │   │
│  │  │  - on_chain_skills: query ECHO assets     │    │   │
│  │  │  - local_skills: OpenClaw native         │    │   │
│  │  │  - cached_skills: off-chain mirror        │    │   │
│  │  └─────────────────────────────────────────┘    │   │
│  │                                                  │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │          Execution Engine                │    │   │
│  │  │  - skill_dispatcher                      │    │   │
│  │  │  - billing_interceptor                   │    │   │
│  │  │  - revenue_settler                       │    │   │
│  │  └─────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                  OpenClaw Channels                    │
├────────────────────────────────────────────────────────┤
│  Telegram │ Discord │ Feishu │ DingTalk │ WeChat      │
└────────────────────────────────────────────────────────┘
```

## 3. 智能合约设计

### 3.1 EchoAgentFactory (代理工厂)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IECHORentable.sol";
import "./interfaces/IECHODerivable.sol";
import "./interfaces/IECHO.sol";

contract EchoAgentFactory is ERC721, Ownable {

    struct AgentAsset {
        uint256 echoAssetId;           // 关联的 ECHO NFT
        address originalCreator;        // 创作者
        string skillManifest;          // Skill 清单 (IPFS CID)
        address currentOperator;       // 当前运营者
        uint256 createdAt;
        bool isPublic;                 // 是否公开市场
    }

    mapping(uint256 => AgentAsset) public agentAssets;
    uint256 private _tokenIdCounter;

    // 事件
    event AgentAssetCreated(
        uint256 indexed tokenId,
        uint256 indexed echoAssetId,
        address indexed creator,
        string skillManifest
    );

    event SkillExecuted(
        uint256 indexed tokenId,
        address indexed executor,
        uint256 revenue,
        bytes32 executionId
    );

    // 创建 Agent 资产
    function createAgentAsset(
        uint256 echoAssetId,
        string memory skillManifest,
        address echoContract
    ) external returns (uint256) {
        // 验证 ECHO 所有权
        IECHO echo = IECHO(echoContract);
        require(
            echo.ownerOf(echoAssetId) == msg.sender,
            "Not the ECHO owner"
        );

        // 创建 Agent NFT
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(msg.sender, tokenId);

        // 存储资产数据
        agentAssets[tokenId] = AgentAsset({
            echoAssetId: echoAssetId,
            originalCreator: msg.sender,
            skillManifest: skillManifest,
            currentOperator: msg.sender,
            createdAt: block.timestamp,
            isPublic: true
        });

        emit AgentAssetCreated(tokenId, echoAssetId, msg.sender, skillManifest);
        return tokenId;
    }

    // 执行 Skill (带链上计费)
    function executeSkill(
        uint256 tokenId,
        bytes memory params,
        address echoContract
    ) external returns (bytes memory) {
        AgentAsset memory asset = agentAssets[tokenId];

        // 验证使用权
        IECHORentable rentable = IECHORentable(echoContract);
        require(
            rentable.userOf(asset.echoAssetId) == msg.sender ||
            asset.originalCreator == msg.sender,
            "No usage rights"
        );

        // 计算并分润
        uint256 price = _calculatePrice(asset.echoAssetId, echoContract);
        _distributeRevenue(tokenId, price, echoContract);

        emit SkillExecuted(tokenId, msg.sender, price, keccak256(params));

        // 返回执行结果 (实际执行在链下)
        return abi.encode(true, "Skill executed");
    }

    // 派生新 Agent
    function createDerivativeAgent(
        uint256 parentTokenId,
        string memory newManifest,
        address echoContract,
        bytes memory derivativeProof
    ) external returns (uint256) {
        AgentAsset memory parent = agentAssets[parentTokenId];

        // 验证衍生权
        IECHODerivable derivable = IECHODerivable(echoContract);
        require(
            derivable.isApprovedDerivative(parent.echoAssetId, msg.sender),
            "Derivative not approved"
        );

        uint256 parentEchoId = parent.echoAssetId;

        // 调用 ECHO 创建衍生资产
        uint256 derivativeEchoId = derivable.createDerivative(
            parentEchoId,
            derivativeProof
        );

        // 创建新的 Agent 资产
        uint256 newTokenId = _tokenIdCounter++;
        _safeMint(msg.sender, newTokenId);

        agentAssets[newTokenId] = AgentAsset({
            echoAssetId: derivativeEchoId,
            originalCreator: parent.originalCreator,
            skillManifest: newManifest,
            currentOperator: msg.sender,
            createdAt: block.timestamp,
            isPublic: true
        });

        return newTokenId;
    }

    // 价格计算
    function _calculatePrice(uint256 echoAssetId, address echoContract)
        internal view returns (uint256)
    {
        IECHORentable rentable = IECHORentable(echoContract);
        return rentable.getRentalPrice(echoAssetId);
    }

    // 收益分润
    function _distributeRevenue(
        uint256 tokenId,
        uint256 amount,
        address echoContract
    ) internal {
        AgentAsset memory asset = agentAssets[tokenId];
        IECHORentable rentable = IECHORentable(echoContract);

        // 向资产所有者分润
        rentable.distributeRevenue{value: amount}(
            asset.echoAssetId,
            payable(asset.originalCreator)
        );
    }
}
```

### 3.2 EchoAgentRegistry (注册表)

```solidity
contract EchoAgentRegistry {

    struct SkillMetadata {
        string name;
        string description;
        string version;
        string category;
        string[] capabilities;
        string manifestCid;       // IPFS 上的 Manifest
        string iconUrl;
        uint256 totalExecutions;
        uint256 avgRating;
    }

    mapping(uint256 => SkillMetadata) public skillRegistry;
    mapping(string => uint256[]) public categoryIndex;

    // 注册 Skill
    function registerSkill(
        uint256 agentTokenId,
        SkillMetadata memory metadata
    ) external {
        skillRegistry[agentTokenId] = metadata;
        categoryIndex[metadata.category].push(agentTokenId);
    }

    // 查询 Skill 列表
    function getSkillsByCategory(string memory category)
        external view returns (uint256[] memory)
    {
        return categoryIndex[category];
    }

    // 搜索 Skill
    function searchSkills(
        string memory query,
        uint256 limit
    ) external view returns (uint256[] memory) {
        // 实现关键词匹配和相关性排序
    }
}
```

## 4. OpenClaw 插件设计

### 4.1 echo-agent 插件

```typescript
// openclaw-plugin-echonexus/index.ts
import { OpenClawPlugin, Skill, ExecutionContext } from '@openclaw/core';
import { ethers } from 'ethers';
import { EchoAgentFactory, EchoAgentRegistry } from './contracts';

export interface EchoAgentConfig {
  network: 'mainnet' | 'testnet';
  echoContract: string;
  agentFactory: string;
  provider: ethers.providers.Provider;
  wallet: ethers.Wallet;
}

export class EchoAgentPlugin implements OpenClawPlugin {
  name = 'echo-agent';
  version = '1.0.0';

  private config: EchoAgentConfig;
  private factory: EchoAgentFactory;
  private registry: EchoAgentRegistry;

  constructor(config: EchoAgentConfig) {
    this.config = config;
    this.factory = new EchoAgentFactory(
      config.agentFactory,
      config.provider
    );
    this.registry = new EchoAgentRegistry(
      config.agentFactory,
      config.provider
    );
  }

  // 获取插件提供的 Skills
  async getSkills(): Promise<Skill[]> {
    return [
      {
        id: 'echo_agent:create',
        name: '创建能力资产',
        description: '将 AI Skill 注册为 ECHO 可交易资产',
        parameters: [
          { name: 'skillManifest', type: 'object', required: true },
          { name: 'pricing', type: 'object', required: true },
          { name: 'permissions', type: 'object', required: true }
        ],
        handler: this.createAgentAsset.bind(this)
      },
      {
        id: 'echo_agent:execute',
        name: '执行能力',
        description: '通过 ECHO 协议执行链上注册的能力',
        parameters: [
          { name: 'assetId', type: 'number', required: true },
          { name: 'params', type: 'object', required: true }
        ],
        handler: this.executeSkill.bind(this)
      },
      {
        id: 'echo_agent:rent',
        name: '租用能力',
        description: '临时租用他人发布的能力资产',
        parameters: [
          { name: 'assetId', type: 'number', required: true },
          { name: 'duration', type: 'string', required: true }
        ],
        handler: this.rentSkill.bind(this)
      },
      {
        id: 'echo_agent:derivative',
        name: '衍生能力',
        description: '基于现有能力创建衍生作品',
        parameters: [
          { name: 'parentId', type: 'number', required: true },
          { name: 'newManifest', type: 'object', required: true }
        ],
        handler: this.createDerivative.bind(this)
      },
      {
        id: 'echo_agent:query',
        name: '查询能力市场',
        description: '搜索和浏览可用的能力资产',
        parameters: [
          { name: 'category', type: 'string', required: false },
          { name: 'query', type: 'string', required: false }
        ],
        handler: this.queryMarket.bind(this)
      }
    ];
  }

  // 创建能力资产
  private async createAgentAsset(
    params: {
      skillManifest: SkillManifest;
      pricing: PricingModel;
      permissions: PermissionConfig;
    },
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const { skillManifest, pricing, permissions } = params;

    // 1. 验证 Skill 格式
    if (!this.validateManifest(skillManifest)) {
      throw new Error('Invalid skill manifest');
    }

    // 2. 通过 ECHO 合约创建资产
    const tx = await this.factory.createAgentAsset(
      0, // 新创建
      JSON.stringify(skillManifest),
      this.config.echoContract,
      {
        gasLimit: 500000
      }
    );
    await tx.wait();

    // 3. 注册 Skill 元数据
    await this.registry.registerSkill(
      tx.events[0].args.tokenId,
      {
        name: skillManifest.name,
        description: skillManifest.description,
        version: skillManifest.version,
        category: skillManifest.category,
        capabilities: skillManifest.capabilities,
        manifestCid: await this.uploadToIPFS(skillManifest),
        iconUrl: skillManifest.iconUrl,
        totalExecutions: 0,
        avgRating: 0
      }
    );

    // 4. 配置权限
    await this.configurePermissions(
      tx.events[0].args.tokenId,
      permissions
    );

    return {
      success: true,
      data: {
        assetId: tx.events[0].args.tokenId.toString(),
        echoAssetId: tx.events[0].args.echoAssetId.toString(),
        manifest: skillManifest
      }
    };
  }

  // 执行能力
  private async executeSkill(
    params: {
      assetId: number;
      params: Record<string, any>;
    },
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const { assetId, params: skillParams } = params;

    // 1. 权限裁决
    const decision = await this.arbitrate(params);
    if (decision.verdict === 'DENIED') {
      throw new Error(`Permission denied: ${decision.conditions}`);
    }

    // 2. 链上计费
    const price = await this.factory.getPrice(assetId);
    const balance = await this.config.provider.getBalance(
      context.wallet.address
    );
    if (balance < price) {
      throw new Error('Insufficient balance for execution');
    }

    // 3. 执行技能
    const result = await this.dispatchToOpenClaw(
      assetId,
      skillParams,
      context
    );

    // 4. 链上结算
    const tx = await this.factory.executeSkill(
      assetId,
      JSON.stringify(skillParams),
      this.config.echoContract,
      { value: price }
    );
    await tx.wait();

    return {
      success: true,
      data: {
        executionId: tx.hash,
        result: result.data,
        cost: price.toString()
      }
    };
  }

  // 租用能力
  private async rentSkill(
    params: {
      assetId: number;
      duration: 'hour' | 'day' | 'week';
    },
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const { assetId, duration } = params;

    // 调用 ECHO rentEcho
    const rentable = await this.getRentableContract();
    const durationBlocks = this.durationToBlocks(duration);

    const tx = await rentable.rentEcho(assetId, durationBlocks, {
      value: await rentable.getRentalPrice(assetId, durationBlocks)
    });
    await tx.wait();

    return {
      success: true,
      data: {
        rentalId: tx.hash,
        expiresAt: tx.events[0].args.expiresAt.toString(),
        assetId: assetId.toString()
      }
    };
  }

  // 衍生能力
  private async createDerivative(
    params: {
      parentId: number;
      newManifest: SkillManifest;
    },
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const { parentId, newManifest } = params;

    // 1. 验证衍生权
    const derivable = await this.getDerivableContract();
    const isApproved = await derivable.isApprovedDerivative(
      parentId,
      context.wallet.address
    );

    if (!isApproved) {
      // 发起衍生请求
      const requestTx = await derivable.requestAsDerivative(
        parentId,
        JSON.stringify(newManifest)
      );
      return {
        success: false,
        data: {
          pending: true,
          requestId: requestTx.hash,
          message: 'Derivative request submitted for approval'
        }
      };
    }

    // 2. 创建衍生资产
    const tx = await this.factory.createDerivativeAgent(
      parentId,
      JSON.stringify(newManifest),
      this.config.echoContract,
      '0x'
    );
    await tx.wait();

    return {
      success: true,
      data: {
        derivativeId: tx.events[0].args.tokenId.toString(),
        parentId: parentId.toString()
      }
    };
  }

  // 查询市场
  private async queryMarket(
    params: {
      category?: string;
      query?: string;
      minRating?: number;
      sortBy?: 'popular' | 'recent' | 'rating';
    },
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const { category, query, minRating, sortBy } = params;

    let assetIds: number[];

    if (category) {
      assetIds = await this.registry.getSkillsByCategory(category);
    } else {
      assetIds = await this.registry.getAllSkills();
    }

    // 获取详细信息
    const assets = await Promise.all(
      assetIds.map(async (id) => {
        const [meta, price, stats] = await Promise.all([
          this.registry.getSkillMetadata(id),
          this.factory.getPrice(id),
          this.factory.getExecutionStats(id)
        ]);

        return {
          assetId: id,
          ...meta,
          price: price.toString(),
          ...stats
        };
      })
    );

    // 过滤和排序
    let filtered = assets;
    if (query) {
      filtered = filtered.filter(a =>
        a.name.includes(query) ||
        a.description.includes(query) ||
        a.capabilities.some(c => c.includes(query))
      );
    }
    if (minRating) {
      filtered = filtered.filter(a => a.avgRating >= minRating);
    }

    // 排序
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.totalExecutions - a.totalExecutions);
        break;
      case 'recent':
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'rating':
        filtered.sort((a, b) => b.avgRating - a.avgRating);
        break;
    }

    return {
      success: true,
      data: {
        total: filtered.length,
        assets: filtered.slice(0, 20) // 返回前20个
      }
    };
  }

  // 权限裁决
  private async arbitrate(
    params: { assetId: number }
  ): Promise<ArbiterDecision> {
    const asset = await this.factory.getAsset(params.assetId);
    const caller = this.config.wallet.address;

    // 所有权检查
    if (asset.owner === caller) {
      return { verdict: 'APPROVED', settlementPlan: null };
    }

    // 使用权检查
    const rentable = await this.getRentableContract();
    const usageRights = await rentable.userOf(asset.echoAssetId);

    if (usageRights === caller) {
      const remaining = await rentable.getRemainingTimes(asset.echoAssetId);
      if (remaining > 0) {
        return { verdict: 'APPROVED', settlementPlan: 'usage' };
      }
    }

    // 扩展权检查
    const extensible = await rentable.isExtensible(asset.echoAssetId);
    if (extensible) {
      const authorized = await rentable.hasExtension(
        asset.echoAssetId,
        caller
      );
      if (authorized) {
        return { verdict: 'CONDITIONAL', conditions: ['extension_fee'] };
      }
    }

    return { verdict: 'DENIED', conditions: ['No valid rights'] };
  }
}
```

## 5. 用例场景

### 5.1 场景一：专业领域顾问 Agent

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

### 5.2 场景二：企业知识库 Agent

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

### 5.3 场景三：跨平台 AI 助手

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

## 6. 经济模型

### 6.1 收益分配比例

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

### 6.2 定价模型

```typescript
// 支持的定价类型
type PricingModel =
  | { type: 'TimesBased'; pricePerUse: bigint }
  | { type: 'DurationBased'; pricePerMinute: bigint; minMinutes: number }
  | { type: 'Subscription'; pricePerMonth: bigint; features: string[] }
  | { type: 'Freemium'; freeUses: number; pricePerUseAfter: bigint }
  | { type: 'Hybrid'; base: bigint; usage: bigint; maxMonthly: bigint };
```

## 7. 技术实现路径

### 7.1 第一阶段：基础框架 (2周)

- [ ] EchoAgentFactory 合约部署
- [ ] EchoAgentRegistry 合约部署
- [ ] OpenClaw 插件基础架构
- [ ] 简单的能力注册和执行

### 7.2 第二阶段：核心功能 (3周)

- [ ] 完整权限裁决引擎
- [ ] 计费结算系统
- [ ] 衍生权管理
- [ ] 扩展权管理

### 7.3 第三阶段：生态完善 (2周)

- [ ] 市场前端界面
- [ ] 开发者 SDK
- [ ] 监控和数据分析
- [ ] 安全审计

## 8. 风险与挑战

| 风险 | 缓解措施 |
|------|---------|
| 合约安全 | 完整安全审计，多签控制 |
| 定价操纵 | 建议价机制，争议解决 |
| 版权争议 | 链上存证，仲裁机制 |
| 技术门槛 | 提供低代码工具，SDK |
| 监管合规 | KYC/AML 集成，地区限制 |
