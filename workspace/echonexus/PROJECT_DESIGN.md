# EchoNexus 完整项目设计书

## 1. 项目概述

### 1.1 项目名称

**EchoNexus** - AI Agent 能力资产化协议

### 1.2 核心定位

**EchoNexus = ECHO 区块链协议 × OpenClaw AI Agent 执行引擎**

将 AI Agent 的 Skills/Knowledge 转化为可交易的链上资产，实现 **"能力即资产，调用即分润"** 的原生 AI 经济体系。

### 1.3 问题背景

当前 AI Agent 生态存在的问题：

- **静态绑定**：能力与平台绑定，创作者无法自由流通变现
- **确权困难**：知识资产的所有权不清晰，衍生创作难以获得回报
- **分润不透明**：依赖中心化平台清分，创作者和衍生者收益无法保障
- **授权低效**：手动审批授权，无法自动化大规模流转

### 1.4 解决方案

基于 ECHO 四权分离协议，结合 OpenClaw 执行引擎：

| ECHO 协议四权 | EchoNexus AI 能力映射 |
|---|---|
| **所有权 (Ownership)** | Agent/Skill 创作者的完整控制权 |
| **使用权 (Usage)** | 按次/按时长付费调用 Agent 能力 |
| **衍生权 (Derivative)** | 基于已有 Skill 构建组合 Skill |
| **扩展权 (Extension)** | 跨平台/场景授权使用能力 |

---

## 2. 架构设计

### 2.1 整体架构（四层优化设计）

```
┌─────────────────────────────────────────────────────────────────┐
│                       用户交互层 (Frontend)                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │  市场界面   │ │ 创作者工作台 │ │ 用户控制台  │ │ 开发者面板 │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                    EchoNexus Hub 调度层                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │  能力路由   │ │  权限裁决   │ │  计费结算   │ │  能力注册  │ │
│  │   Router    │ │   Arbiter   │ │ Settlement │ │  Registry  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │  语义索引   │ │  使用追踪   │ │  分润引擎   │ │  事件通知  │ │
│  │  Semantic  │ │   Tracker   │ │ Distributor │ │  Notifier  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   ECHO 合约层    │  │   索引层(IPFS)  │  │ OpenClaw 执行层 │
│  - 资产存证      │  │  - 元数据索引   │  │  - Agent 运行   │
│  - 权限管理      │  │  - 语义向量    │  │  - Skill 调用   │
│  - 自动分润      │  │  - 能力发现    │  │  - 结果返回     │
│  - 事件日志      │  │  - 推荐引擎    │  │  - 沙箱隔离     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### 2.2 层级职责说明

**1. 用户交互层**
- 面向创作者：技能创建、价格管理、收益查看
- 面向消费者：浏览市场、搜索技能、租赁使用
- 面向开发者：SDK 文档、API 集成

**2. EchoNexus Hub 调度层（核心）**
- **能力路由**：语义匹配用户请求到最合适的 Skill
- **权限裁决**：基于四权模型自动化权限检查
- **计费结算**：根据定价模型计算费用
- **能力注册**：标准化注册流程，版本管理
- **语义索引**：链下向量索引，支持语义搜索
- **使用追踪**：完整的审计日志
- **分润引擎**：根据规则计算各方分成
- **事件通知**：推送交易和分润事件

**3. ECHO 合约层**
- 资产 NFT 铸造
- 权限管理（租赁/衍生/扩展）
- 自动分润执行
- 事件日志上链

**4. 索引层（新增优化）**
- 元数据存储（IPFS）
- 语义向量索引
- 能力发现和推荐
- 减轻链上存储压力，节省 Gas

**5. OpenClaw 执行层**
- 实际执行 Skill 能力
- 沙箱隔离保证安全
- 返回结果给用户

### 2.3 核心流程设计

#### 技能资产化流程（创作者）

```
创作者在 OpenClaw 开发 Skill
       ↓
填写元数据（名称、描述、分类、标签）
       ↓
设置定价模型（按次/时长/订阅/免费+付费/混合）
       ↓
设置衍生条款（一次性费用 + 版税百分比）
       ↓
设置扩展权限（是否允许跨场景，最大分润）
       ↓
生成语义向量 → 上传 IPFS
       ↓
调用 ECHO 合约 mint() → 生成 Skill NFT
       ↓
资产上线市场 → 可被搜索/租赁/使用
```

#### 用户调用流程（消费者）

```
用户在 OpenClaw / EchoNexus 发起请求
       ↓
语义索引匹配 → 推荐候选 Skill
       ↓
权限裁决 Arbiter → 检查用户权限
  ├─ 所有者 → 直接通过
  ├─ 已租赁 → 检查剩余次数/时长
  ├─ 未租赁 → 提示租赁/按次付费
  └─ 扩展场景 → 检查授权 + 场景分润
       ↓
权限不通过 → 提示需要付费/租赁
       ↓
权限通过 → 触发 useECHO() → 链上扣费
       ↓
OpenClaw 执行 Skill → 返回结果
       ↓
收益自动分润 → 按比例打入各相关地址
```

---

## 3. 数据模型

### 3.1 ECHO 核心接口（已有协议保持不变）

```
资产层
├── 1.1 资产创建和租用
│   mint() → 原创资产
│   createDerivative() → 衍生资产（需付 upfrontFee）
│   rentEcho() → 租赁使用权
│   selfDerive() → 自衍生（一次mint父+子+建立关系）
│
├── 1.2 费用与状态设置
│   updateRentalInfo() → 定价（TimesBased/DurationBased）
│   setExtensible() → 授权拓展 + 分润比例上限
│   setDerivTerms() → 衍生条款（upfrontFee + usageRoyalty）
│
使用权层（IECHO）
├── 1.3 使用权管理
│   useECHO() → 触发分润
│   userOf() / getRemainingTimes / getUseStatus → 状态查询
│
租赁分润层（IECHORentable）
├── 1.4 可租赁 + 分润
│   EchoRented → 租赁事件
│   RevenueDistributedBase → 使用分润给资产owner
│
授权管理层
├── 1.5 拓展权授权（OwnerDirect 模式）
│   approvePermission() / revokePermission()
│
├── 1.6 拓展权申请（RequestBased 模式）
│   requestPermission() → 消费合约主动申请
│   approvePermissionRequest() / rejectPermissionRequest()
│   updateSceneBeneficiary() → 更新场景受益人
│
├── 1.7 拓展使用和分润
│   useECHOOf() → 场景内使用
│   RevenueDistributedForScene → 场景分润
│
衍生层（IECHODerivable）
├── 1.8 衍生权管理
│   requestAsDerivative() → 发起衍生请求
│   approveDerivativeRequest() / rejectDerivativeRequest()
│   getDerivativeGraph() → 衍生图谱查询
│   getParentShareList() → 亲代分润表
│
├── 1.9 衍生分润
│   DerivFeePaid → 一次性衍生费
│   DerivRevenueDistributed → 衍生品使用时向父代分润
```

### 3.2 EchoNexus 扩展类型定义

```typescript
// 定价模型
type PricingModelType = 'TimesBased' | 'DurationBased' | 'Subscription' | 'Freemium' | 'Hybrid';

interface PricingInfo {
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

// 衍生条款
interface DerivativeTerms {
  upfrontFee: bigint;
  usageRoyalty: number; // 百分比 0-100
}

// Skill 资产
interface EchoSkill {
  tokenId: string;
  owner: string;
  name: string;
  description: string;
  imageUrl?: string;
  category: string;
  tags: string[];
  // ECHO 协议
  rentalInfo: {
    pricing: PricingInfo;
    isActive: boolean;
  };
  derivativeTerms: DerivativeTerms;
  extensible: boolean;
  maxSceneRoyalty: number;
  // 元数据
  createdAt: number;
  totalUses: number;
  totalRevenue: bigint;
  // 集成
  metadataCid?: string;  // IPFS
  openClawSkillId?: string; // OpenClaw
}

// OpenClaw 集成元数据
interface EchoSkillMetadata {
  echoContractAddress: string;
  tokenId: string;
  chainId: number;
  permissionType: 'ownership' | 'rental' | 'extension';
}

// 权限检查结果
interface PermissionCheckResult {
  approved: boolean;
  reason: string;
  requiredAmount?: bigint;
}
```

### 3.3 权限裁决决策树

```
                    ┌─────────────────┐
                    │  权限裁决请求    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   所有权检查     │
                    └────────┬────────┘
                             │
          ┌──────────────────┴──────────────┐
          │                                  │
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
                     │   已租赁/已付费?   │        │   扩展权可用?     │
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

---

## 4. 经济模型（优化版）

### 4.1 使用权收益分配

**优化点：新增 OpenClaw 执行节点分成，激励生态基础设施建设**

| 参与方 | 比例 | 说明 |
|---|---|---|
| 创作者/资产所有者 | **75%** | 原创作者获得大部分收益 |
| OpenClaw 执行节点 | **8%** | 提供算力运行 Skill 的节点运营商 |
| EchoNexus 协议层 | **12%** | 协议开发和维护 |
| 生态基金 | **5%** | 社区激励、 grants、安全审计 |

```
  总费用 100%
   ├─ 75% → 创作者
   ├─  8% → OpenClaw 节点
   ├─ 12% → 协议
   └─  5% → 生态基金
```

### 4.2 衍生权收益分配

**一次性衍生费：**

| 参与方 | 比例 |
|---|---|
| 亲代创作者 | 70% |
| 亲代生态 | 20% |
| 协议层 | 10% |

**衍生使用版税（每次调用）：**

| 参与方 | 比例 |
|---|---|
| 衍生品所有者 | 60% |
| 所有亲代累计 | 30% |
| 协议层 | 10% |

> 支持多代衍生，每一代都按约定比例获得版税，自动累计分配。

### 4.3 扩展权收益分配

| 参与方 | 比例 |
|---|---|
| 资产所有者 | 75% |
| 场景受益人 | 15% |
| 协议层 | 10% |

---

## 5. 前端应用设计

### 5.1 页面结构

```
/          → 首页（介绍 + 精选技能）
/explore   → 探索市场（搜索 + 筛选 + 列表）
/create    → 创建技能（表单 mint）
/dashboard → 控制台（我的 + 统计）
/skill/:id → 技能详情（信息 + 执行）
```

### 5.2 核心功能模块

| 模块 | 功能 |
|---|---|
| 市场浏览 | 分类筛选、搜索、卡片展示 |
| 技能详情 | 信息展示、定价、权限说明、在线执行 |
| 创建技能 | 表单填写、定价设置、预言元数据、mint |
| 用户控制台 | 我的创建、我的租赁、收益统计、图表 |
| 技能执行 | 输入框、调用 OpenClaw、结果展示 |
| 钱包连接 | 连接断开、地址显示 |

### 5.3 技术栈

| 层次 | 技术选型 |
|---|---|
| 框架 | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + 自定义组件 |
| 路由 | React Router v6 |
| 状态管理 | Zustand |
| Web3 | ethers.js v6 + wagmi v2 |
| 图表 | Recharts |
| 图标 | Lucide React |

---

## 6. OpenClaw 集成方案

### 6.1 集成点

1. **Skill 注册**：创作者在 OpenClaw 开发完 Skill 后，在 EchoNexus 绑定 Skill ID
2. **权限检查**：OpenClaw 执行前调用 EchoNexus Arbiter 进行权限检查
3. **执行触发**：权限通过后，才允许执行，并触发 `useECHO()` 扣费分润
4. **结果返回**：执行完成后返回用户

### 6.2 扩展 OpenClaw Skill 定义

```typescript
// 在 OpenClaw Skill 中增加 echoMetadata 字段
interface OpenClawSkill {
  id: string;
  name: string;
  description: string;
  // ... 其他原有字段
  echoMetadata?: EchoSkillMetadata;
}
```

### 6.3 执行钩子

OpenClaw 在执行 Skill 前:

```typescript
if (skill.echoMetadata) {
  const checkResult = await echoNexus.checkPermission({
    tokenId: skill.echoMetadata.tokenId,
    userAddress: callerAddress,
    right: 'usage'
  });
  if (!checkResult.approved) {
    throw new Error(`权限不足: ${checkResult.reason}`);
  }
  // 触发扣费分润
  await echoNexus.triggerUse(skill.echoMetadata.tokenId);
}
// 继续执行
```

---

## 7. 用例场景

### 7.1 专业领域顾问 Agent

| 角色 | 动作 |
|---|---|
| **创作者 A (律师)** | 将法律咨询能力打包为 Skill → 设置 $0.5/次 → 设置衍生条款允许衍生但 20% 版税 |
| **用户 B** | 搜索法律类 Skill → 按次付费 → 获取 AI 法律建议 → 费用自动分润给 A |
| **开发者 C** | 基于 A 的 Skill 创建"合同审查 Agent" → 支付一次性衍生费 $100 → 每次使用 A 获得 20% 版税 |

### 7.2 企业知识库 Agent

| 角色 | 动作 |
|---|---|
| **企业 D** | 将内部培训资料创建为 Skill 资产 → 设置仅限内部使用的扩展权 → 员工通过 OpenClaw 访问 |
| **员工 E** | 通过企业账号访问 → 使用内部知识库 Agent → 使用记录自动记录供审计 |

> 特别适合内部知识沉淀和合规审计场景，确保知识资产的安全可控和可追溯。

### 7.3 跨平台 AI 助手

| 角色 | 动作 |
|---|---|
| **开发者 F** | 创建 AI 写作 Skill → 通过 ECHO 扩展权授权给多个平台 |
| **平台 G (Telegram Bot)** | 申请扩展权 → 获得授权后在 Telegram 提供服务 → 每次使用向 F 分润 |
| **用户 H** | 在 Telegram 使用 AI 写作 → 费用自动分润给 F 和平台 G |

---

## 8. 风险与应对

| 风险 | 应对方案 |
|---|---|
| **合约安全** | 多签控制，专业安全审计，漏洞赏金计划 |
| **定价操纵** | 社区建议价机制，争议解决仲裁 |
| **版权争议** | 链上存证，社区仲裁机制 |
| **技术门槛** | 提供低代码工具、SDK、详细文档 |
| **监管合规** | 支持 KYC/AML 集成，可配置地区限制 |

---

## 9. 开发 roadmap

### 阶段一：基础框架 ✓

- [x] ECHO 合约设计完成
- [x] TypeScript SDK 完成
- [x] 简单的能力注册和执行
- [x] React 前端应用框架

### 阶段二：核心功能 ✓

- [x] 完整权限裁决引擎
- [x] 计费结算系统
- [x] 衍生权管理
- [x] 扩展权管理

### 阶段三：生态完善 ⏳

- [ ] 语义索引引擎
- [ ] IPFS 元数据存储
- [ ] 监控和数据分析
- [ ] OpenClaw 深度集成
- [ ] 安全审计
- [ ] 上线主网

---

## 10. 总结

### 核心创新

1. **四权分离映射 AI 能力**：清晰界定所有权、使用权、衍生权、扩展权
2. **自动分润**：每次调用智能合约自动分配收益，原创者、衍生者、平台都获得相应回报
3. **OpenClaw 深度整合**：ECHO 负责确权，OpenClaw 负责执行
4. **可持续经济模型**：激励创作者、节点运营商、协议开发者各方参与

### 价值

- 对于**创作者**：你的知识技能可以轻松变现，持续获得收益
- 对于**用户**：按需付费使用高质量专业能力，无需订阅整份服务
- 对于**生态**：促进高价值知识经验在 AI 原生方式下自由流通

---

**项目口号：** *能力即资产，调用即分润*
