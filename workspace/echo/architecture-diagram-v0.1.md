# ECHO 协议架构图 v0.1

**Talus 架构设计 | 2026-05-29**

---

## 一、整体架构（分层）

```
┌─────────────────────────────────────────────┐
│                 前端层                        │
│  四权配置UI | 编排可视化 | 势位图谱 | 节点/边管理   │
└──────────────────────┬──────────────────────┘
                       │ GraphQL / REST
┌──────────────────────▼──────────────────────┐
│               索引器层 (Seaman_bot)            │
│  事件监听 → 势位计算 → shigraph → API输出     │
└──────────────────────┬──────────────────────┘
                       │ 链上事件
┌──────────────────────▼──────────────────────┐
│               合约层 (已部署)                  │
│  CreatorConfig │ EdgeDeclaration             │
│  DeadlockInspector │ MilestoneEscrow       │
└─────────────────────────────────────────────┘
```

---

## 二、已部署合约（主网）

| 合约 | 地址 |
|------|------|
| CreatorConfig | 0x8acaba7e15b2ae3026746e4d6d19c2aa9e64b0c3da2faef104aecd5cc8a72805 |
| EdgeDeclaration | 0x1f31779fbe3fc14a685ca649765d11570b3af1395814159946c876c31d23acb6 |
| DeadlockInspector | 0x30d62244d0c4c405815daf51a229d22aeda113c86ae74d0f7ff0f906fd5d6e0d |
| MilestoneEscrow | 0xd6e6bfb1d079a7fa1efc0187622f88481020aee29f11be4708f3882ebbcc5b5f |

---

## 三、核心事件（7个已锁定）

| 事件 | Topic0 | 索引字段 |
|------|--------|----------|
| NodeCreated(bytes32,address,uint256,uint8,uint8,uint8,uint8) | 0x4c... | nodeId, creator |
| EdgeDeclared(bytes32,bytes32,address,uint256,uint256) | 0x8b... | fromNode, toNode |
| QuadrantSet(bytes32,uint8,uint8,uint8,uint8) | 0x2a... | nodeId |
| AssemblyApproved(bytes32,string) | ... | assemblyId |
| AssemblyRejected(bytes32,string) | ... | assemblyId |
| MilestoneLocked(bytes32,uint256,uint8,uint256) | 0x9f... | projectId |
| MilestoneReleased(bytes32,uint256,uint8,uint256) | 0x7d... | projectId |

---

## 四、六相映射（事件→相位）

| 相位 | 编码 | 触发事件 |
|------|------|----------|
| 肇始 | 0 | NodeCreated（新节点创世） |
| 通变 | 1 | QuadrantSet（四权配置变更） |
| 流行 | 2 | EdgeDeclared（关系建立/扩散） |
| 差等 | 3 | AssemblyRejected（争议仲裁） |
| 继述 | 4 | MilestoneReleased（里程碑释放/继承） |
| 性命 | 5 | AssemblyApproved（闭环确认） |

---

## 五、PhaseTransition 事件（P1已部署）

```solidity
event PhaseTransition(
    bytes32 indexed nodeId,
    uint8 indexed phase,     // 0=肇始 1=通变 2=流行 3=差等 4=继述 5=性命
    uint8 reasonCode,        // 1=lock 2=released 3=deadlock_cleared 4=sunrise 5=unset 0=undefined
    uint256 timestamp
);
```

**归属：MilestoneEscrow P1 (0x1C2f10Df5a07b4bfa8D189C5c65EE5748Ba2AEf2)**

**实际触发映射（源码确认）：**
- lockMilestone → phase=1, reasonCode=1（通变/sunrise）
- releaseMilestone → phase=2, reasonCode=2（流行）
- emergencyRefund → phase=5, reasonCode=5（性命/sunset）
- bindMilestonePhase(projectId, 3) → phase=3, reasonCode可传3（差等/死锁解除）

**注意：DeadlockInspectorP1的AssemblyRejected事件不直接触发PhaseTransition，需通过bindMilestonePhase间接关联到phase=3**

---

## 六、插件层约束（外部组件只能被调用）

| 插件 | 约束 |
|------|------|
| IDeadlockInspector | checkModuleComposability + checkAssemblyDeadlock 可被调用，不能写入四权默认值 |
| IMilestoneEscrow | lockMilestone + releaseMilestone 插件层，不污染核心四权逻辑 |

---

## 七、前端数据格式（已确认）

| 字段 | 类型 | 说明 |
|------|------|------|
| edgeType | uint8 | 0=继承 1=衍生 2=扩展 |
| shiPosition | uint16 | 0-10000 整数（精度） |
| centuryPotential | - | 已废弃，用 edgeCount + depth 替代 |
| nodeId | bytes32 | 链上节点标识 |
| depth | uint256 | 嵌入深度 |

---

## 八、DeadlockInspectorP1 接口（P1已部署）

**地址：0x4d233b2eB46f0Cd1b968Dc542dafC894B47d0b9F**

```solidity
function inspect(bytes32 nodeId) external view returns (
    bool isDeadlocked,
    uint8 blockingQuadrant,
    bytes32[] memory blockingEdges
);

function checkModuleComposability(bytes32 nodeId) external view returns (bool ok);

function checkAssemblyDeadlock(bytes32[] calldata nodeIds) external view returns (
    bool ok,
    string memory reason
);

function approveAssembly(bytes32[] calldata nodeIds) external;
// → emit AssemblyApproved(assemblyId, reason) 或 AssemblyRejected(assemblyId, reason)

// AssemblyRejected触发时 → phase=3（差等）
```

---

## 九、三个关键问题（21:00对齐会已讨论）

1. **差等相位（3）触发条件** — reasonCode=3=deadlock_cleared 时触发，需要等猫先森P1合约部署完成才能验证

2. **震卦"变化"和乾卦"流行"区分度** — 震=流行中的跳变（事件驱动），乾=流行中的渐变（边累积），两者都涉及边但语义不同

3. **八卦完整覆盖六相** — 基本覆盖，但需X7确认坎卦的"冲突"语义是否对应差等相位

---

## 十、架构图交付状态

- 接口层（4合约+7事件topic0）✅
- 分层架构 ✅
- 六相映射 ✅
- 插件层约束 ✅
- reasonCode(uint8)标注 ✅
- PhaseTransition事件定义 ✅
- P1新增接口标注 ✅

**22:00前交付完成。**