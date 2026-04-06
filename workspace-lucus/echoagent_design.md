# EchoAgent：基于 ECHO 协议的 AI Agent 能力资产化

> **定位**：将 OpenClaw Agent 能力（Skills）资产化，通过 ECHO 协议实现能力路由、权限裁决与计费结算
> **版本**：v0.2 — 2026-03-30（基于 Skill 资产化重构）

---

## 一、名字与定位

**名字：EchoAgent**

「Echo」一语双关：
1. **ECHO 协议** — 本系统构建于 ECHO 协议之上，依赖其资产租赁/分润/衍生机制
2. **回声、响应** — Agent 对用户请求的响应；能力的传播与复制

**一句话描述**：一个让 AI Agent 能力（Skills）成为可交易 ECHO 资产的协议层，连接 OpenClaw 执行引擎与 ECHO 链上结算。

---

## 二、核心概念映射

| ECHO 协议概念 | EchoAgent 映射 | 说明 |
|---|---|---|
| ECHO 资产 | **Skill ECHO 资产** | 一个 OpenClaw Skill 映射为链上 ECHO 资产 |
| mint() | **Skill 注册** | 将 Skill 能力上链，生成 ECHO 资产 |
| createDerivative() | **能力衍生** | 基于已有 Skill 克隆/微调出新 Skill |
| selfDerive() | **自助衍生** | 用户自助创建子 Skill（一次完成父子+关系建立）|
| rentEcho() | **能力租用** | 用户支付费用，获得 Skill 使用权限 |
| authorizedAsUser() | **Owner 赠予** | Skill Owner 主动授权用户免费试用 |
| updateRentalInfo() | **定价更新** | 修改租用定价（按次/按时长）|
| setExtensible() | **开放衍生权限** | 允许/禁止他人基于此 Skill 创建衍生品 |
| setDerivTerms() | **衍生条款** | upfrontFee（创建费）+ usageRoyalty（持续版税）|
| useECHO() | **能力执行** | 用户触发 Skill 执行，触发分润 |
| useECHOOf() | **场景执行** | 第三方场景合约调用 Skill |
| RevenueDistributedBase | **基础分润** | 使用费 → Skill Owner |
| RevenueDistributedForScene | **场景分润** | 使用费 → 场景受益人（渠道/合作方）|
| DerivRevenueDistributed | **衍生版税** | 父代 Skill Owner 持续获得子代使用费分成 |
| DerivFeePaid | **衍生创建费** | 子 Skill 创建时一次性付给父代 |
| sceneShare | **场景分润比例** | 第三方渠道/场景可分得的使用费比例 |
| unlicensed derivative | **未授权衍生** | 未授权衍生品，使用和进一步衍生均受限 |

---

## 三、核心设计：Skill 资产化

### 3.1 为什么是 Skill 而不是 Agent

| 层级 | 定位 | 可资产化 | 说明 |
|---|---|---|---|
| **Skill** | 单一独立能力单元 | ✅ | 最小资产单元，开发者可自由定义粒度 |
| **Agent** | Skills + Prompt + Model 的组合 | ❌ | 产品形态，引用 Skills，不直接资产化 |
| **Session** | Agent 实例化后的会话 | ❌ | 运行时状态 |

**关键点**：
- 同一个 Skill 可以被多个 Agent 引用（像 npm 包）
- Skill 可独立版本迭代（v1 → v2），ECHO 资产元数据指向具体版本
- 用户可以只租用单个 Skill，而不是整个 Agent

### 3.2 Skill ECHO 资产结构

```solidity
struct SkillAsset {
    uint256 tokenId;           // ECHO 资产 ID
    string name;               // Skill 名称
    string description;        // 能力描述
    string uri;                // 指向 Skill 配置（prompt/tools/dependencies）
    address owner;             // 资产所有者
    bool isExtensible;         // 是否允许衍生
    uint256 allowedShare;      // 衍生时分润上限
    string category;           // 分类：weather, doc, image, etc.
    string version;            // 版本号：1.0.0, 2.1.0
}
```

### 3.3 Agent 与 Skill 的关系

```
Agent（产品层）
    │
    ├── prompt: "你是一个专业的..."
    ├── model: "scnet/ MiniMax-M2.5"
    │
    └── skills: [Skill ECHO 资产列表]
              ├── skill_tokenId_101: "天气查询"
              ├── skill_tokenId_102: "飞书文档读取"
              └── skill_tokenId_103: "图像生成"
```

**租用方式**：
- 用户可以租用整个 Agent（自动获得所有引用 Skills 的使用权）
- 也可以单独租用某个 Skill（更细粒度）

---

## 四、系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        User（用户层）                          │
│   普通用户 / 渠道合作方 / 场景应用开发者 / Skill Owner           │
└─────────────────────────┬───────────────────────────────────┘
                          │ 通过 Feishu / Web / API 等渠道交互
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    OpenClaw Gateway                          │
│                    （交互接入层）                              │
│   • 接收用户请求                                              │
│   • Session 管理（Agent 状态维护）                            │
│   • 路由到对应 Skill 执行                                     │
│   • 通过 Feishu/其他 Channel 返回结果                         │
└──────────┬──────────────────────────────┬───────────────────┘
           │                              │ Bridge（桥接层）
           ▼                              ▼
┌──────────────────────┐    ┌──────────────────────────────────┐
│   ECHO 合约层          │    │       EchoAgent Bridge            │
│   （链上结算层）        │    │   （链上 ↔ 链下同步引擎）          │
│                      │    │                                  │
│   • ECHO 资产         │    │   • 监听 ECHO 事件                │
│   • IECHO            │    │     （Rental/Auth/Deriv...）      │
│   • IECHORentable    │◄───│   • 权限状态同步到 OpenClaw        │
│   • IECHOPermissioned│    │   • Skill 执行结果回写链上          │
│   • IECHODerivable   │    │   • 触发链上分润                   │
│                      │    │   • 衍生图谱维护                   │
└──────────────────────┘    └──────────────────────────────────┘
```

---

## 五、分层模块设计

### 5.1 合约层（Chain Layer）

基于 ECHO 协议标准接口实现，EchoAgent 对其做以下扩展：

#### 核心合约

```
SkillRegistry
├── registerSkill(skillMetadata) → tokenId
│   └── 将 OpenClaw Skill 注册为 ECHO 资产
├── updateSkillURI(tokenId, uri)
│   └── 更新 Skill 元数据（能力描述、版本等）
└── getSkillInfo(tokenId) → SkillAsset

SkillRental（扩展 IECHORentable）
├── rentSkill(tokenId, useTimes) → 触发链上分润
│   └── payment → split → Owner / Scene / Parent
├── authorizeUser(user, tokenId, useTimes)
│   └── Owner 直接授权（免费赠送试用）
└── settleRemainingRental(tokenId)
    └── DurationBased 到期清算

SkillPermission（扩展 IECHOPermissioned + IECHOPermissionRequestable）
├── requestAccess(consumer, tokenId, proposedShare)
│   └── 场景应用申请接入某 Skill
├── approveAccess(consumer, tokenId)
│   └── Owner 审批场景接入
├── revokeAccess(consumer, tokenId)
│   └── 撤销场景接入权限
└── getBeneficiaryInfo(tokenId, consumer) → (share, beneficiary)

SkillDerivative（扩展 IECHODerivable）
├── cloneSkill(parentTokenId, childMetadata) → childTokenId
│   └── 基于已有 Skill 创建衍生 Skill
├── setDerivTerms(tokenId, enabled, terms)
│   └── 衍生条款：创建费 upfrontFee + 使用版税 usageRoyalty
└── getDerivativeGraph(tokenId) → DerivativeGraph
```

#### 关键数据结构

```solidity
// Skill 元数据
struct SkillMetadata {
    string name;           // Skill 名称
    string description;    // 能力描述
    string uri;            // 指向能力配置（prompt/tools/model）
    string category;       // 分类标签
    string version;        // 版本号
    address owner;         // 链上资产所有者
    bool isExtensible;     // 是否允许衍生
    uint256 allowedShare;  // 衍生时分润上限
}

// 衍生条款
struct DerivTerms {
    uint256 upfrontFee;      // 创建衍生品时一次性支付（wei）
    address paymentToken;    // 支付代币（ETH = address(0)）
    uint256 usageRoyalty;    // 每次使用付给父代的版税（bps）
}
```

### 5.2 Bridge 层（Bridge Engine）

Bridge 是整个系统的「翻译官」——负责链上事件与链下 Skill 执行的联动。

```
EchoAgent Bridge 模块
━━━━━━━━━━━━━━━━━━━━━━

EventWatcher（事件监听器）
├── 监听 NewRental → 授权用户 + 激活 Skill 会话
├── 监听 UserAuthorized → 给指定用户开通使用权限
├── 监听 PermissionApproved → 允许场景合约调用
├── 监听 DerivativeApproved → 建立父子 Skill 关系
└── 监听 DerivTermsUpdated → 更新分润规则

PermissionSyncer（权限同步器）
├── 维护 ActivePermissions 表：
│   { user, skillTokenId, remainingTimes, expiryTime, rentalType }
├── 定时对比链上状态 ↔ 本地缓存，处理偏差
└── 清理过期权限

ExecutionLogger（执行记录器）
├── 每次 useECHO() 执行后：
│   ├── 记录执行 hash → 链上备查
│   └── 触发 RevenueDistributed* 事件 → 触发分润
└── 批量上报模式：高频场景合并上链

SkillSessionManager（会话管理器）
├── rentEcho 触发 → 创建/激活 Skill Session
├── 有效期管理（DurationBased 到期自动挂起）
└── 会话与 Token 绑定防滥用
```

### 5.3 Agent 执行层（OpenClaw Agent Runtime）

OpenClaw 已有成熟的 Agent 运行时，EchoAgent 只需为其增加「能力包装」：

```
OpenClaw Agent × EchoAgent
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Skill 能力发布流程：
1. Skill 开发者在 OpenClaw 定义 Skill（prompt + tools + dependencies）
2. 调用 SkillRegistry.registerSkill() → 链上 ECHO 资产生成
3. 设置 updateRentalInfo() 定价
4. 用户看到的能力列表 = 链上 ECHO 资产元数据 + OpenClaw 执行能力

Skill 能力执行流程：
1. 用户通过 Channel（Feishu/网页）发起请求
2. OpenClaw Gateway 验证用户是否有对应 Skill 权限
3. Bridge 检查链上 rental 状态 + 剩余次数/时长
4. 权限合法 → 路由到对应 Skill 执行
5. 执行完成 → Bridge 记录执行日志 + 触发链上分润事件
6. 结果通过 Channel 返回用户

多 Skill 协作：
├── Agent 引用多个 Skills → 依次调用执行
├── 父 Skill 被调用时，可通过 sceneShare 分配给渠道
├── 衍生 Skill 执行时，自动触发 DerivRevenueDistributed 给父代
└── 完整执行链上链下双记录，可审计
```

---

## 六、计费与结算机制

### 6.1 三种计费模式

| 模式 | ECHO 对应 | 适用场景 |
|---|---|---|
| **TimesBased**（按次）| rentEcho(tokenId, useTimes) | 零散任务、单次咨询 |
| **DurationBased**（按时长）| rentEcho(tokenId, durationUnits) | 包月/包年订阅、持续服务 |
| **SceneBased**（场景分润）| useECHOOf() + sceneShare | 第三方应用接入、渠道分发 |

### 6.2 分润分配规则

```
使用费分润（每笔执行）
━━━━━━━━━━━━━━━━━━━━

用户支付 (P)
     │
     ├──► Platform Fee（平台抽成）───► 平台金库
     │
     ├──► Scene Share（场景分润）───► sceneBeneficiary（渠道/合作方）
     │         如果配置了 sceneShare
     │
     └──► Remaining ──► Owner（资产所有者）
                        │
                        ├──► 如果是衍生 Skill：
                        │      └──► Parent Royalty（衍生版税）
                        │            例：usageRoyalty = 500bps（5%）
                        │            父代持续获得子代使用费的 5%
                        │
                        └──► 如果是原创 Skill：全拿
```

```
衍生创建费分润（一次性）
━━━━━━━━━━━━━━━━━━━━━━

子 Skill 创建时支付 upfrontFee
     │
     └──► 100% ──► 父代 Owner（父 Skill 的所有者）
```

---

## 七、角色与权限矩阵

| 角色 | 可以做什么 | 约束 |
|---|---|---|
| **普通用户** | 租用 Skill、查看自己的使用记录 | 仅能使用已租用的 Skills |
| **Skill Owner** | 注册/注销 Skill、定价、审批授权/衍生、收取分润 | Owner 权限通过私钥/钱包管理 |
| **场景应用（Consumer）** | 申请接入某 Skill、经 Owner 审批后通过 useECHOOf() 调用 | 需 Owner 显式 approve |
| **渠道合作方（Scene）** | 分享 Skill 链接/嵌入、获得 sceneShare 分润 | 需在 Skill 设置中配置 sceneBeneficiary |
| **衍生 Skill Owner** | 创建衍生 Skill（自用或分发）、获得使用费、支付 upfrontFee 给父代 | 衍生品使用触发父代 royalty；unlicensed 衍生品受限 |
| **平台方（Platform）** | 收取平台费、处理争议、管理合约升级 | 平台金库地址由多签管理 |

---

## 八、完整交互流程示例

### 场景：一个用户租用"飞书文档操作" Skill

```
Step 1：Skill Owner 注册能力
━━━━━━━━━━━━━━━━━━━━━━━━━━
OpenClaw Skill 定义（prompt + tools + dependencies）
    │
    ▼
SkillRegistry.registerSkill()
    │
    ▼
ECHO 资产 Minted（tokenId = 201）
    │
    ▼
Owner 设置：updateRentalInfo(201, 0.0005 ETH, 0, address(0))
    │
    ▼
Skill 能力上架（用户可见）

Step 2：用户租用
━━━━━━━━━━━━━━━━━━━━━━━━━━
用户浏览 Skill 市场 → 选择 tokenId=201
    │
    ▼
用户支付 0.005 ETH（10 次使用）── rentEcho(201, 10)
    │
    ▼
链上：RentalInfo 写入 + EchoRented 事件
    │
    ▼
Bridge 监听 EchoRented → 写入 ActivePermissions
    │
    ▼
用户获得 10 次使用额度

Step 3：执行与分润
━━━━━━━━━━━━━━━━━━━━━━━━━━
用户发送请求："帮我读取飞书文档 xxx"
    │
    ▼
OpenClaw Gateway 路由 → tokenId=201 Skill
    │
    ▼
Bridge 权限检查（remainingTimes ≥ 1）── 通过
    │
    ▼
Skill 执行飞书文档读取
    │
    ▼
Bridge 记录 useECHO() 执行
    │
    ▼
触发链上分润事件
    │
    ├── RevenueDistributedBase → Owner 获得 0.0005 ETH
    └── remainingTimes - 1

Step 4：结果返回
━━━━━━━━━━━━━━━━━━━━━━━━━━
用户获得文档内容（Channel 返回）
    │
    ▼
remainingTimes = 9，下一次执行继续扣减

Step 5：衍生（可选）
━━━━━━━━━━━━━━━━━━━━━━━━━━
第三方开发者看到 tokenId=201 运营良好
    │
    ▼
调用 createDerivative(uri, [tokenId=201])
    │
    ▼
支付 upfrontFee → 父代 Owner
    │
    ▼
衍生 Skill ECHO 资产（tokenId=202）创建
    │
    ▼
后续 tokenId=202 每次使用：
    ├── 使用费的 N% → tokenId=201 Owner（usageRoyalty）
    └── 其余 → tokenId=202 Owner
```

---

## 九、技术实现路径建议

### 阶段一：最小可行产品（MVP）
```
目标：跑通「注册 → 租用 → 执行 → 分润」全流程

需要实现：
1. 扩展 ECHO 合约（或新建 SkillRegistry）
   - Skill 注册 + 元数据存储
   - 基本租用接口（复用 IECHORentable）
2. EchoAgent Bridge（单节点版本）
   - 轮询链上事件 → 同步权限
   - 执行日志 → 触发分润事件
3. OpenClaw 插件
   - capability_router skill
   - 使用前检查链上权限
4. Web UI
   - Skill 市场浏览
   - 租用下单
```

### 阶段二：多 Skill 协作 + 场景接入
```
新增：
- Agent 引用多个 Skills 的串联执行
- 第三方 Consumer 场景接入（扩展 IECHOPermissioned）
- 渠道分润配置（sceneBeneficiary）
```

### 阶段三：去中心化 + 治理
```
新增：
- DAO 治理（平台费使用、合约升级投票）
- Skill 信誉评分系统（链上记录执行质量）
- 跨链支持（ECHO 协议扩展到多链）
```

---

## 十、风险与挑战

| 风险 | 应对方案 |
|---|---|
| 链上状态同步延迟导致权限判定不准 | Bridge 双写 + 乐观锁，超时降级为「链下白名单」 |
| Skill 执行结果与链上分润记录不匹配 | 执行结果 hash 回写链上，可争议仲裁 |
| 未授权衍生品（unlicensed derivative）被使用 | Bridge 层检测 `isUnlicensed` 标记，拒绝服务 |
| 合约升级影响已有资产关系 | 代理模式（Proxy Pattern）实现平滑升级 |
| ECHO 协议本身不支持的能力（如流式输出）| Bridge 层做结果聚合，结果上链而非过程上链 |

---

## 十一、名字确认

**系统名：EchoAgent**

- **Agent** = 符合 OpenClaw 的 naming convention
- **Echo** = 呼应 ECHO 协议 + 能力响应的核心交互模式
- **品牌感**：简洁、有技术感、可注册商标

对应的 ECHO 资产系列可命名为：**EchoSkill #1, #2, ...**

---

## 附录：相关文档

- ECHO 协议接口原始文档：`ECHO合约接口.docx`
- OpenClaw Agent 文档：`/app/docs/`
- Feishu 集成文档：`/app/extensions/feishu/skills/feishu-doc/SKILL.md`