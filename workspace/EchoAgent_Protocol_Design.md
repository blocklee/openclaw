# EchoAgent Protocol
## 基于四权分离的数字资产协议与 AI Agent 融合设计

---

## 一、项目概述

### 1.1 名称
**EchoAgent Protocol**（简称 EAP）

### 1.2 定位
面向 AI Agent 生态的数字资产所有权经济协议，旨在实现高价值技能/知识库在 AI 原生工作方式下的流通与变现。

### 1.3 核心价值主张
让 AI 技能和知识库像数字资产一样，具备明确的所有者、可控的使用规则、可组合的衍生方式，以及可扩展的应用场景，最终形成一个可持续发展的 AI 技能经济生态。

### 1.4 与 OpenClaw 的关系
- **底层基础设施**：OpenClaw 提供 Agent 运行时、skill 标准化框架、插件体系
- **EchoAgent 定位**：在 OpenClaw 之上构建资产层和经济层
- **有机融合**：复用 OpenClaw 的 skill 生态，将 ECHO 四权分离协议映射到 skill 的发布、分发、使用、衍生、扩展全生命周期

---

## 二、核心概念映射

### 2.1 资产类型定义

| 资产类型 | 定义 | 示例 |
|---------|------|------|
| **Skill Asset（技能资产）** | 可被 AI Agent 调用的标准化技能模块 | "法律合同审查技能"、"Logo 设计技能" |
| **Knowledge Asset（知识资产）** | 结构化的知识库，可被 Agent 查询和使用 | "某领域知识库"、"产品手册" |
| **Workflow Asset（工作流资产）** | 多个技能/知识的组合，形成完整工作流 | "从线索到签单的完整销售流程" |
| **Agent Template（智能体模板）** | 预配置的 Agent 配置，包含技能组合和参数 | "法律顾问 Agent"、"电商运营 Agent" |

### 2.2 四权在 Agent 生态的映射

| 权利 | 在 AI Agent 场景的定义 | 实现机制 |
|------|----------------------|---------|
| **所有权（Ownership）** | 持有该资产在链上的唯一标识，享有最终处置权 | NFT 表示，持有者地址记录在合约中 |
| **使用权（Usage Right）** | 按规则调用该技能/知识，每次调用需验证并付费 | 合约验证 + 计量扣费 |
| **衍生权（Derivative Right）** | 能否基于原始技能开发新技能（须保留原始引用） | 合约授权 + 衍生合约引用原资产 |
| **扩展权（Extension Right）** | 能否在其他平台、应用、场景中使用该技能 | 扩展场景授权 + 额外付费 |

---

## 三、系统架构

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户层                                │
│  技能开发者 │ 知识库所有者 │ 企业/个人用户 │ 二次开发者       │
└─────────────┬───────────────┬───────────────┬───────────────┘
              │               │               │
              ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Agent 层                                │
│  EchoAgent Runtime（基于 OpenClaw Agent）                    │
│  - Skill Executor（技能执行器）                              │
│  - Knowledge Retriever（知识检索器）                          │
│  - Workflow Orchestrator（工作流编排器）                       │
│  - 四权验证模块（Rights Verification）                        │
└─────────────┬───────────────┬───────────────┬───────────────┘
              │               │               │
              ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                    资产层（EchoChain）                         │
│  Skill Registry │ Knowledge Registry │ Derivative Registry    │
│  Extension Rights Manager │ Usage Ledger                      │
└─────────────┬───────────────┬───────────────┬───────────────┘
              │               │               │
              ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                    合约层（ECHO Protocol）                    │
│  Asset Factory │ Rights Controller │ Revenue Distributor     │
│  NFT Registry │ License Manager │ Extension Gateway           │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 各层职责

**合约层（EchoChain）**
- 资产创建（Asset Factory）：注册新资产，生成 NFT
- 权限控制（Rights Controller）：验证使用权、衍生权、扩展权
- 收益分配（Revenue Distributor）：自动将收益分发给相关方
- 授权管理（License Manager）：管理不同类型的授权规则

**资产层（EchoRegistry）**
- Skill Registry：技能资产的元数据、版本、依赖关系
- Knowledge Registry：知识库的索引、向量嵌入、访问权限
- Derivative Registry：追踪技能的衍生关系图谱
- Extension Registry：记录资产的扩展场景授权

**Agent 层（EchoAgent Runtime）**
- 四权验证模块：每次技能调用前验证链上权限
- 计量计费模块：记录调用次数、计算费用
- 收益分账模块：将收入按规则分给各方
- 隐私保护模块：敏感知识加密，仅授权 Agent 可解密

---

## 四、商业模式设计

### 4.1 平台收入来源

| 收入类型 | 说明 | 比例 |
|---------|------|------|
| **交易手续费** | 每笔技能/知识调用收取的费用 | 5-10% |
| **上架费** | 技能/知识库发布时收取的审核费 |一次性，较低 |
| **扩展授权费** | 资产被用于扩展场景时收取 | 10-20% |
| **Gas 费代付** | 替用户代付链上 Gas，收取服务费 | 按次 |
| **增值服务** | 数据分析、流量推荐、排名推广 | 订阅/竞价 |

### 4.2 开发者收入模式

| 模式 | 适用场景 | 结算方式 |
|------|---------|---------|
| **按次付费（Pay-per-call）** | 技能调用、知识检索 | 每次成功调用后自动结算 |
| **订阅制（Subscription）** | 持续使用某个技能/知识库 | 月/年费，期限内无限调用 |
| **计量包（Credit Pack）** | 预先购买调用额度 | 按量扣减，不限技能 |
| **定制开发（Custom Dev）** | 基于某技能二次开发专属版本 | 一次性付费 |
| **收益分成（Revenue Share）** | 衍生技能的收入与原开发者分账 | 按衍生合同约定比例 |

### 4.3 定价策略建议

**技能定价公式：**
```
技能价格 = 基础成本 × 稀缺系数 × 质量系数 × 使用场景系数

其中：
- 基础成本：开发者COVER的基础费用
- 稀缺系数：该领域技能的稀缺程度（供需比）
- 质量系数：基于用户评价、历史调用成功率
- 使用场景系数：越高频的使用场景定价越高
```

**建议支持的定价粒度：**
- 按调用次数定价（适合低频工具类技能）
- 按时间定价（适合持续性服务，如"法律顾问 Agent"）
- 按输出量定价（适合内容生成类，如"生成一篇营销文案"）
- 混合定价（基础费 + 调用费）

### 4.4 分账模型

**基础分账规则：**
```
总收入 = 调用收入 + 订阅收入 + 衍生收入 + 扩展收入

分账优先级：
1. 平台手续费（先行扣除）
2. 知识源贡献费（如技能依赖知识库，知识源优先）
3. 原始开发者收益（根据衍生链向上追溯）
4. 衍生开发者收益（按衍生链比例分配）
```

**衍生技能分账示例：**
```
原始技能A被衍生出技能B（引用A）又被衍生出技能C（引用B）
B调用A时：A开发者获得 20% 分账
C调用B时：B开发者获得 15%，A开发者获得 5%（通过合约自动追溯）
```

---

## 五、技能标准化设计

### 5.1 技能结构规范（Skill Manifest）

每个技能发布时必须包含以下元数据：

```yaml
skill_id: string           # 链上唯一标识（合约地址）
version: string            # 语义化版本（semver）
owner: address             # 所有者钱包地址
manifest:
  name: string             # 技能名称
  description: string      # 技能描述
  category: string[]       # 分类标签
  input_schema: json-schema   # 输入参数规范
  output_schema: json-schema  # 输出结果规范
  requirements:            # 环境依赖
    openclaw_version: str  # 最低 OpenClaw 版本
    dependencies: string[] # 依赖的其他技能ID
    resources: string[]    # 需要的外部资源
rights:
  usage:                   # 使用权配置
    price_model: string    # per_call | subscription | credit
    price: number          # 价格
    currency: string       # 代币符号
  derivative:              # 衍生权配置
    allowed: boolean       # 是否允许衍生
    share_ratio: number    # 衍生收益分成比例（%）
    attribution: boolean   # 是否必须保留原始引用
  extension:               # 扩展权配置
    allowed: boolean       # 是否允许扩展场景
    price_model: string
    price: number
metadata:
  author: string
  created_at: timestamp
  updated_at: timestamp
  certification: string    # 认证等级（可选）
  rating: number          # 综合评分
```

### 5.2 技能分类体系

```
一级分类（Broad）
├── 专业服务（Professional Services）
│   ├── 法律（Legal）
│   ├── 财务（Finance）
│   ├── 医疗（Medical）
│   └── 咨询（Consulting）
├── 创意与内容（Creative & Content）
│   ├── 写作（Writing）
│   ├── 设计（Design）
│   ├── 音视频（Media）
│   └── 营销（Marketing）
├── 技术与开发（Technology & Dev）
│   ├── 编程（Coding）
│   ├── 数据（Data）
│   ├── 运维（DevOps）
│   └── 安全（Security）
├── 教育与研究（Education & Research）
│   ├── 课程（Courses）
│   ├── 研究（Research）
│   └── 语言（Language）
├── 商业与运营（Business & Operations）
│   ├── 销售（Sales）
│   ├── 客服（Customer Service）
│   ├── 人力资源（HR）
│   └── 供应链（Supply Chain）
└── 其他（Miscellaneous）
```

### 5.3 技能发现与匹配机制

**Agent 技能调用流程：**

```
1. 用户描述任务（自然语言）
2. Agent 解析任务，识别所需技能类型
3. 在链上 Skill Registry 中搜索匹配技能
4. 按以下权重排序：
   - 权限验证通过（使用权存在）
   - 分类匹配度（标签相关性）
   - 历史调用成功率
   - 用户评价和评分
   - 价格合理性
5. 展示最匹配的技能列表（含价格和使用条件）
6. 用户/Agent 选择后，触发合约验证 + 计量计费
7. 技能执行，结果返回
8. 收益自动分账，调用记录上链存证
```

### 5.4 技能质量保证体系

| 等级 | 标识 | 要求 | 权益 |
|------|------|------|------|
| **官方认证** | ✅ Verified | 平台人工审核 + 实际测试 | 流量加权、优先推荐 |
| **社区验证** | ⭐ Popular | 调用量 > 1000 + 评分 > 4.5 | 排名加权 |
| **内测阶段** | 🔧 Beta | 开发者自发布 | 逐步解锁功能 |
| **受限访问** | 🔒 Restricted | 需要申请或订阅审批 | 特定用户群体 |

---

## 六、合约设计（基于 ECHO Protocol）

### 6.1 核心合约列表

| 合约名称 | 功能 |
|---------|------|
| `SkillRegistry` | 技能资产的创建、注册、状态管理 |
| `KnowledgeRegistry` | 知识库的注册、权限管理 |
| `NFTToken` | 资产 NFT 铸造和转移 |
| `RightsController` | 四权验证逻辑 |
| `PricingEngine` | 定价模型和费用计算 |
| `RevenueDistributor` | 收益分账和自动转账 |
| `LicenseManager` | 许可证的颁发和撤销 |
| `DerivativeTracker` | 衍生关系追踪 |
| `ExtensionGateway` | 扩展场景授权管理 |
| `UsageLedger` | 调用记录存证 |

### 6.2 主要接口设计

**技能发布（SkillRegistry）**
```solidity
function registerSkill(
    string name,
    string metadataURI,
    RightsConfig usageRights,
    RightsConfig derivativeRights,
    RightsConfig extensionRights
) external returns (uint256 skillId);
```

**使用权验证与调用（RightsController）**
```solidity
function verifyAndCharge(
    uint256 skillId,
    address caller,
    bytes32 callSignature,  // 本次调用的唯一标识，防止重放
    uint256 maxCost
) external returns (bool allowed, uint256 charged);
```

**衍生授权（DerivativeTracker）**
```solidity
function registerDerivative(
    uint256 originalSkillId,
    uint256 derivativeSkillId,
    uint256 shareRatio
) external;
```

**扩展权授权（ExtensionGateway）**
```solidity
function grantExtension(
    uint256 skillId,
    address extender,
    string extensionScenario,
    uint256 extensionFee
) external returns (uint256 licenseId);
```

### 6.3 收益分配逻辑（RevenueDistributor）

```solidity
struct RevenueSplit {
    uint256 platformFee;      // 平台手续费
    uint256 originalOwner;    // 原始开发者
    uint256 knowledgeSource;  // 知识源贡献
    uint256 derivativeShare;  // 衍生开发者分成池
}

function distributeRevenue(
    uint256 skillId,
    uint256 amount,
    uint256 depth  // 衍生层级，用于追溯分账
) internal {
    RevenueSplit memory split = calculateSplit(skillId, depth);
    uint256 remaining = amount;
    
    // 1. 平台手续费
    uint256 platform = (amount * split.platformFee) / 10000;
    remaining -= platform;
    platformWallet.transfer(platform);
    
    // 2. 原始开发者
    uint256 ownerShare = (amount * split.originalOwner) / 10000;
    remaining -= ownerShare;
    skillOwner.transfer(ownerShare);
    
    // 3. 知识源（如有）
    if (split.knowledgeSource > 0) {
        uint256 knowledgeShare = (amount * split.knowledgeSource) / 10000;
        remaining -= knowledgeShare;
        knowledgeOwner.transfer(knowledgeShare);
    }
    
    // 4. 衍生分成池（按衍生链追溯）
    if (remaining > 0) {
        distributeDerivativeShare(skillId, remaining, depth);
    }
}
```

---

## 七、扩展权（Extension Right）详细设计

### 7.1 扩展场景分类

| 扩展场景 | 说明 | 授权要求 |
|---------|------|---------|
| **跨平台使用** | 在其他 Agent 平台调用该技能 | 额外付费 20-50% |
| **商业集成** | 嵌入商业产品/服务中 | 商业授权协议 + 更高分成 |
| **数据训练** | 用于训练其他 AI 模型 | 单独谈判 |
| **转授权** | 将使用权转授权给第三方 | 原所有者审批 |
| **离线使用** | 在无网络环境下使用 | 本地执行许可 |

### 7.2 扩展权授权流程

```
1. 第三方应用请求扩展权
2. 合约查询原资产所有者地址
3. 原所有者审批授权 + 设置扩展费
4. 第三方签署扩展协议（链上存证）
5. 支付扩展授权费（代币）
6. ExtensionGateway 颁发扩展许可证
7. 许可证与调用方地址绑定，调用时验证
```

---

## 八、技术实现路线

### 8.1 阶段规划

**Phase 1：MVP（3个月）**
- 完成核心合约开发（SkillRegistry、RightsController、RevenueDistributor）
- 搭建基于 OpenClaw 的 Skill Executor
- 支持按次付费模式
- 接入 10-20 个内测技能
- 测试版上线

**Phase 2：生态建设（3-6个月）**
- 上线订阅制和计量包
- 开发知识库支持模块
- 完成衍生技能追踪合约
- 接入 100+ 技能/知识库
- 开放开发者上传

**Phase 3：规模化（6-12个月）**
- 完成扩展权授权模块
- 支持多链部署（ETH L2、Solana 等）
- 开发可视化管理工作台
- 引入平台治理代币
- 推动企业级合作

### 8.2 技术栈建议

| 模块 | 技术选型 |
|------|---------|
| 智能合约 | Solidity（EVM 系）|
| 链下服务 | Node.js / Go |
| Agent Runtime | OpenClaw（已有点）|
| 数据库 | PostgreSQL + Redis |
| 搜索/索引 | Elasticsearch |
| 知识向量 | Pinecone / Milvus |
| 消息队列 | Kafka / RabbitMQ |
| 前端 | Next.js + Tailwind |

### 8.3 关键风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| 技能盗版/盗用 | 开发者收益受损 | 链上存证 + 版权验证 |
| 计量作弊 | 收益分配不准 | TEE 可信执行环境 |
| 监管合规 | 限制某些技能发布 | 分级审核 + 地区限制 |
| 用户体验割裂 | 付费流程复杂 | 抽象支付入口，屏蔽链上复杂性 |
| 开发者门槛高 | 上架技能成本高 | 提供一键发布工具 + 模板 |

---

## 九、关键成功指标（KPIs）

| 阶段 | 指标 | 目标值 |
|------|------|-------|
| **MVP** | 内测技能数量 | 20+ |
| | 单日最高调用量 | 1,000 次 |
| | 开发者满意度 | > 4.0/5.0 |
| **生态建设** | 注册开发者数 | 500+ |
| | 上架技能/知识库 | 500+ |
| | 月活跃用户 | 10,000+ |
| | 累计交易额 | $1M+ |
| **规模化** | 头部企业客户 | 50+ |
| | 跨链资产数 | 10,000+ |
| | 生态 GMV | $50M+ |

---

## 十、开放性问题（待进一步讨论）

1. **治理模式**：平台治理代币的分配比例和投票机制如何设计？
2. **Gas 费处理**：链上操作 Gas 费由谁承担，如何对用户透明？
3. **争议解决**：技能质量/抄袭等争议如何仲裁？
4. **隐私保护**：敏感知识资产如何实现加密访问控制？
5. **国际化**：多链部署时资产跨链映射如何处理？
6. **税务合规**：数字资产收益的税务处理方案？

---

*文档版本：v0.1（初稿）*
*待补充：Echo 资产合约详细对接方案、UI/UX 设计初稿*
