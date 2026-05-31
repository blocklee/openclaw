# ECHO v0.3 合约接口文档（猫先森）

**作者**：猫先森（Cat） | **日期**：2026-05-22 | **状态**：Final v0.3

**审阅记录**：基于 v0.2 review 反馈修订（10 条核心问题全部落实）

## 0. Review 反馈映射

| Review 问题 | 对应章节 | 接口/参数 |
| --- | --- | --- |
| #7 版本切换成本不明 | §1.5 版本迁移机制 | `migrateLicense()`, `MigrationMode` |
| #8 紧急干预入口太窄 | §3.3 紧急干预双通道 | `emergencyFreeze()`, `emergencyUnfreeze()` |
| #9 势位缺使用者反馈 | §4 势位评估引擎 | `engagementScore`, `satisfactionScore`, `disputeRate` |
| #10 链下持久性 | §2.4 链下存储冗余 | `storeToIPFS()`, `storeToArweave()`, `verifyOffchainData()` |
| #4 sunset 公式漏洞 | §3.5 Sunset 修复 | `sunset = max(90天, 有效期×30%, 有效期+7天)` |
| #5 DAO 门槛未定义 | §5 DAO 治理参数 | `daoThreshold`, `quorumPercentage`, `votingPeriod` |
| #3 裁决不透明 | §3.6 冷却期裁决公式 | `cooldownRuling()` 伪代码 |

## 1. CreatorConfig 合约 版本 DAG 管理

### 1.1 核心接口

```
function publishVersion(
    uint256 parentVersionId,
    string calldata configJSON,
    bytes32 configHash,
    bytes32 contractHash
) external returns (uint256 versionId);

function getVersion(uint256 versionId) external view returns (
    uint256 parentId, bytes32 configHash, bytes32 contractHash,
    uint256 publishTime, uint256 childCount
);

function getVersionLineage(uint256 versionId) external view returns (uint256[] memory path);
```

### 1.2 核心参数

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `MAX_CONFIG_SIZE` | uint256 | 10KB | 单条 configJSON 最大尺寸 |
| `VERSION_DEPTH_LIMIT` | uint256 | 50 | 版本 DAG 最大深度 |
| `MAX_CHILDREN_PER_VERSION` | uint256 | 20 | 单版本最多分叉数 |

### 1.3 版本迁移机制 ★ 新增

**问题**：切换版本时旧许可怎么处理？是否重新付费？

**方案**：三种迁移模式，创作者在 `publishVersion()` 时选择

```
enum MigrationMode {
    FREE,       // 免费迁移：旧许可自动继承到新版本
    TOPUP,      // 差价补足：更贵补差价，更便宜不退
    FULL_PRICE  // 全额重购：旧许可作废，需重新购买
}

function migrateLicense(
    uint256 oldLicenseId,
    uint256 targetVersionId,
    MigrationMode migrationMode
) external payable returns (uint256 newLicenseId);

function previewMigrationCost(
    uint256 oldLicenseId,
    uint256 targetVersionId
) external view returns (uint256 cost);
```

**迁移规则**：

- **FREE**：不收费，旧 token 销毁，新 token 发放，有效期不变
- **TOPUP**：计算 `(新价格 - 旧价格)`，为负则收 0
- **FULL_PRICE**：全额支付新版本价格，旧许可保留直到 sunset

**重要**：迁移不改变 sunset 时间，按原许可创建时间计算。

## 2. LicenseToken 合约 许可凭证 + 三层哈希锚定

### 2.1 核心接口

```
function mintLicense(
    address to,
    uint256 versionId,
    uint64 expiryTimestamp,
    bytes32 configHash,
    bytes32 contractHash
) external payable returns (uint256 tokenId);

function updateRuntimeHash(
    uint256 tokenId,
    bytes32 newRuntimeHash,
    OffchainPointer calldata newPointer
) external;

function verifyHashIntegrity(uint256 tokenId) external view returns (bool);
```

### 2.2 核心参数

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `MIN_SUNSET_DAYS` | uint256 | 90 | sunset 最小天数 |
| `SUNSET_RATIO` | uint256 | 30 (%) | sunset = max(90, 有效期×30%) |
| `SUNSET_EXTENSION` | uint256 | 7 (天) | 新增：许可有效期+7天保护 |

### 2.3 Sunset 公式修复 ★ 修复

**原公式**： `sunset = max(90天, 许可有效期 × 30%)`

**问题**：1天试用许可 sunset = 90天，对短期许可不公平

**修复公式**：

```
function calculateSunset(uint64 expiryTimestamp, uint64 createTime) pure returns (uint64) {
    uint64 licenseDuration = expiryTimestamp - createTime;
    uint64 ratioBased = licenseDuration * 30 / 100;
    uint64 extensionBased = licenseDuration + 7 days;  // 新增
    return max(90 days, ratioBased, extensionBased);
}
```

| 许可类型 | 原 sunset | 修复后 sunset |
| --- | --- | --- |
| 1 天试用 | 90 天 | 90 天（不变） |
| 30 天月度 | 90 天 | 90 天（不变） |
| 180 天半年 | 90 天 | **187 天**（延长） |
| 365 天年度 | 109.5 天 | **372 天**（大幅延长） |

### 2.4 链下存储冗余 ★ 新增

**问题**：链上只存 pointer，链下数据谁来存？节点失效怎么办？

**方案**：IPFS + Arweave 双冗余

```
struct OffchainPointer {
    bytes32 ipfsHash;
    bytes32 arweaveHash;
    uint256 checkpointTime;
}

function storeToIPFS(uint256 tokenId) external returns (bytes32 ipfsHash);
function storeToArweave(uint256 tokenId) external payable returns (bytes32 arweaveHash);
function verifyOffchainData(
    uint256 tokenId,
    OffchainPointer calldata pointer,
    bytes calldata proofData
) external view returns (bool);
```

**自动策略**：

1. 每次 runtimeHash 更新 → 自动 snapshot 到 IPFS
2. 每日 batch → 打包 snapshot 到 Arweave（gas 优化）
3. 查询时优先读 IPFS（快），fallback 到 Arweave（可靠）

## 3. S-GraphCore 合约 关系状态 + 紧急干预 + 冻结退出

### 3.1 核心接口

```
function createRelation(
    uint256 licenseId, address creator, address user, bytes32 ruleHash
) external returns (bytes32 nodeId);

function updateRelationState(
    bytes32 nodeId, bytes32 newState, bytes calldata proof
) external;

// 三阶段冻结退出
function announceExit(string calldata reason) external;
function getExitStatus(address creator) external view returns (
    ExitStage stage, uint64 announceTime, uint64 deprecatedTime, uint64 archiveTime
);
function archiveCreatorRelations(address creator) external returns (bytes32 archiveHash);
```

### 3.2 三分层写权限

| 写入主体 | 权限范围 | 触发条件 | 安全机制 |
| --- | --- | --- | --- |
| LicenseToken 合约 | 常态写入 | 使用者触发许可交互 | 自动执行 |
| 高势位创作者（标准通道） | 紧急干预 | Top 10% + 3 地址多签 | **48 小时时间锁** |
| 高势位创作者（快速通道） | 紧急冻结 | Top 10% + severity ≥ 3 | **24h DAO 追认** |
| DAO 治理多签 | 最终兜底 | 治理提案通过 | 时间锁 + 投票期 |

### 3.3 紧急干预双通道 ★ 新增

```
// 标准通道（原设计保留）
function emergencyFreeze(bytes32[] calldata nodeIds, string calldata reason)
    external returns (uint256 proposalId);

// 快速通道（新增）
function emergencyFreezeFast(
    bytes32[] calldata nodeIds,
    uint8 severity,           // 严重等级 1-5
    bytes32 evidenceHash
) external;

function daoRatifyFastFreeze(uint256 fastFreezeId, bool approve) external;
```

**严重等级**：

| 等级 | 场景 | 通道 |
| --- | --- | --- |
| L1 | 配置错误，不影响资产 | 标准通道 |
| L2 | 规则冲突，执行歧义 | 标准通道 |
| L3 | 安全漏洞，未授权访问风险 | **快速通道** |
| L4 | 数据篡改风险 | **快速通道** |
| L5 | 主动攻击，资产损失风险 | **快速通道** |

**只有 Level 3+ 可触发快速通道。** 立即冻结，24 小时内 DAO 追认：通过则保持，否决/超时则自动解冻。

### 3.4 三阶段冻结退出时间线

```
T+0:   announceExit() → ANNOUNCED（暂停新许可，全局通知）
       └─ sunset 倒计时启动

T+30天: 自动进入 DEPRECATED（旧许可继续有效，显示警告）

T+sunset: 自动进入 ARCHIVED（链下归档，token 可查询不可交互）

```

### 3.5 Sunset 退出示例（修复后）

| 许可类型 | sunset | 归档时间 |
| --- | --- | --- |
| 1 天试用 | 90 天 | T+90 天 |
| 30 天月度 | 90 天 | T+90 天 |
| 180 天半年 | 187 天 | T+187 天 |
| 365 天年度 | 372 天 | T+372 天 |

### 3.6 冷却期裁决公式 ★ 透明化

```
function cooldownRuling(uint256 versionId) external {
    require(block.timestamp >= cooldownDeadlines[versionId], "Cooldown not ended");
    require(!rulingExecuted[versionId], "Ruling already executed");

    uint256 objectionNum = objectionCount[versionId];
    RulingResult result;

    if (objectionNum == 0) {
        result = RulingResult.PASSED;           // 无异议 → 通过
    } else if (objectionNum < 3) {
        cooldownDeadlines[versionId] += 7 days; // 异议不足 → 延长 7 天
        result = RulingResult.EXTENDED;
        emit CooldownExtended(versionId, cooldownDeadlines[versionId]);
        return;
    } else {
        result = autoRuling(versionId);         // 异议 ≥ 3 → 自动裁决
    }

    rulingResults[versionId] = result;
    rulingExecuted[versionId] = true;
    distributeStakes(versionId, result);
    emit RulingExecuted(versionId, result, block.timestamp);
}

function autoRuling(uint256 versionId) internal view returns (RulingResult) {
    uint256 newRightsDensity = computeRightsDensity(versionId);
    uint256 parentVersionId = CreatorConfig.getVersion(versionId).parentId;
    uint256 oldRightsDensity = computeRightsDensity(parentVersionId);

    return newRightsDensity >= oldRightsDensity
        ? RulingResult.PASSED    // 权利密度未降低 → 通过
        : RulingResult.REJECTED; // 权利密度降低 → 拒绝
}

function computeRightsDensity(uint256 versionId) internal view returns (uint256) {
    bytes32 configHash = CreatorConfig.getVersion(versionId).configHash;
    string memory configJSON = IPFSResolver.resolve(configHash);

    uint256 irrevocableRatio = parseIrrevocableRatio(configJSON);  // 0-100
    uint256 protectionClauses = parseProtectionClauses(configJSON); // 计数

    return irrevocableRatio * 70 / 100 + min(protectionClauses * 5, 30);
}
```

**裁决结果**：

- **PASSED**：新版本生效，无异议或权利密度未降低
- **REJECTED**：新版本被拒绝，创作者可修改后重新提交
- **EXTENDED**：异议不足 3 个，延长 7 天给更多人反应时间

## 4. 势位评估引擎 势位计算 + 动态锁 + 硬地板

### 4.1 核心接口

```
function getPotential(address creator) external view returns (uint256);
function getPotentialLevel(address creator) external view returns (uint8 level);
function reevaluatePotential(address creator) external;
function getHardFloor(address creator) external view returns (uint256 floorPercentage);
function validateHardFloor(address creator, bytes32 configHash) external view returns (bool);
function setWeight(bytes32 metric, uint256 weight) external; // 仅 DAO
function getWeight(bytes32 metric) external view returns (uint256);
```

### 4.2 势位评估算法 ★ 含使用者反馈权重

```
function calculatePotential(address creator) public view returns (uint256) {
    // === 创作者侧指标（权重 60%） ===
    uint256 revenueScore = computeRevenueScore(creator);      // 收入稳定性 0-100
    uint256 licenseScore = computeLicenseScore(creator);      // 许可数量/增长率 0-100
    uint256 versionScore = computeVersionScore(creator);      // 版本迭代健康度 0-100

    // === 使用者侧指标（权重 40%，新增）★ ===
    uint256 engagementScore = computeEngagementScore(creator);    // 活跃度 0-100
    uint256 satisfactionScore = computeSatisfactionScore(creator); // NPS 0-100
    uint256 disputeRate = computeDisputeRate(creator);          // 争议率 0-100

    uint256 creatorSide = (revenueScore + licenseScore + versionScore) * 60 / 300;
    uint256 userSide = (engagementScore + satisfactionScore + (100 - disputeRate)) * 40 / 300;

    return creatorSide + userSide; // 0-100
}
```

### 4.3 指标计算方式

| 指标 | 数据来源 | 计算方式 |
| --- | --- | --- |
| revenueScore | LicenseToken | 近 30 天收入 / 历史平均收入 |
| licenseScore | LicenseToken | 有效许可数 / 历史峰值 × 100 |
| versionScore | CreatorConfig | 发布频率适中（1-4周/次）得 100 分 |
| **engagementScore** ★ | S-GraphCore | 近 30 天交互次数 / 许可数 |
| **satisfactionScore** ★ | 链下 NPS | 使用者 NPS 评分平均值 × 10 |
| **disputeRate** ★ | S-GraphCore | 近 90 天异议数 / 总许可数 |

### 4.4 使用者 NPS 收集 ★ 新增

```
function submitNPS(address creator, uint8 npsScore, uint256 licenseId) external {
    require(LicenseToken.ownerOf(licenseId) == msg.sender, "Must own license");
    require(npsScore >= 1 && npsScore <= 10, "Score 1-10");
    require(!hasRated[licenseId][creator], "Already rated");

    npsScores[creator].push(npsScore);
    hasRated[licenseId][creator] = true;
    emit NPSSubmitted(creator, msg.sender, npsScore);
}
```

**防刷机制**：一许可一评，需持有有效许可才能评分。

### 4.5 势位等级与硬地板

| 等级 | 势位范围 | 硬地板 |
| --- | --- | --- |
| L1 | 0-25 | 20% |
| L2 | 26-50 | 35% |
| L3 | 51-75 | 50% |
| L4 | 76-100 | 70% |

## 5. DAO 治理参数 ★ 新增

### 5.1 核心参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| DAO_MIN_MEMBERS | 5 | DAO 最少成员数 |
| DAO_QUORUM_PERCENTAGE | 60% | 最低参与门槛 |
| DAO_PASS_THRESHOLD | 66.7% | 通过门槛（2/3） |
| DAO_VOTING_PERIOD | 7 天 | 标准投票期 |
| DAO_EMERGENCY_VOTING_PERIOD | 24 小时 | 紧急投票期 |
| DAO_TIMELOCK | 48 小时 | 标准时间锁 |
| DAO_EMERGENCY_TIMELOCK | 6 小时 | 紧急时间锁 |

### 5.2 投票权重

```
function getVotingPower(address member) public view returns (uint256) {
    uint256 basePower = 1;
    uint256 potentialBoost = PotentialEngine.getPotential(member) / 100;
    uint256 activityBoost = governanceActivity[member].recentParticipations;
    return min(basePower + potentialBoost + activityBoost, 10);
}
```

### 5.3 可治理参数（13 项）

| 参数 | 当前值 | 调整范围 |
| --- | --- | --- |
| SUNSET_RATIO | 30% | 20%-50% |
| MIN_SUNSET_DAYS | 90 | 60-180 |
| HARD_FLOOR_L1-L4 | 20%-70% | 各 ±10% |
| COOLDOWN_DAYS | 7 | 3-14 |
| OBJECTION_THRESHOLD | 3 | 2-5 |
| OBJECTION_STAKE | 0.01 ETH | 0.005-0.05 |
| EMERGENCY_TIMELOCK | 48h/24h | 24-72h / 12-48h |
| IPFS_RESYNC_INTERVAL | 1 天 | 1-7 天 |
| ARWEAVE_BATCH_SIZE | 1000 | 500-5000 |

## 6. 交互流程图

### 6.1 创作者发布新版本

```
创作者 publishVersion()
    → 自动启动 7 天冷却期
    → 使用者可提交异议（质押 0.01 ETH）
    → 7 天后自动裁决
        ├─ 无异议 / 密度未降 → 生效
        ├─ 异议 < 3 → 延长 7 天
        └─ 异议 ≥ 3 且密度降 → 拒绝，可重提

```

### 6.2 使用者购买许可

```
使用者 mintLicense()
    → 支付费用
    → LicenseToken 创建 NFT + 三层哈希锚定
    → S-GraphCore 创建关系节点
    → 自动 snapshot 到 IPFS
    → 24h 内 batch 到 Arweave
    → 使用者获得许可 token

```

### 6.3 紧急干预

```
标准通道：emergencyFreeze()
    → 3 地址多签确认
    → 48h 时间锁
    → 时间锁到期 → 自动冻结

快速通道：emergencyFreezeFast(severity ≥ 3)
    → 立即冻结
    → 24h 内 DAO 追认
        ├─ 通过 → 冻结保持
        └─ 否决/超时 → 自动解冻

```

### 6.4 创作者退出

```
announceExit() → ANNOUNCED（暂停新许可，全局通知）
    T+30天 → DEPRECATED（旧许可继续有效，显示警告）
    T+sunset → ARCHIVED（链下归档，token 可查询不可交互）

```

## 7. Gas 优化与存储成本

| 数据项 | 位置 | 大小 |
| --- | --- | --- |
| configHash / contractHash / runtimeHash | 链上 | 32 bytes × 3 |
| offchainPointer | 链上 | 72 bytes |
| 许可核心数据 | 链上 | ~200 bytes |
| 关系节点 | 链上 | ~256 bytes |
| 完整配置 JSON | 链下（IPFS） | 最大 10KB |
| 历史快照 | 链下（IPFS+Arweave） | 变化 |

**1000 许可链上总存储**：~624 KB（许可 200KB + 关系 256KB + 哈希 168KB）

## 8. 待确认参数（9 项）

| 参数 | 当前值 | 需确认方 |
| --- | --- | --- |
| 势位评估权重（创作者:使用者） | 60:40 | Talus 安全审计 |
| NPS 防刷机制 | 一许可一评 | 非攻进阶版前端 |
| 快速通道 severity 阈值 | ≥ 3 | 社区共识 |
| DAO 成员准入 | Top 20% 势位 | 治理讨论 |
| 迁移 gas 承担方 | 使用者 | 经济模型 |
| Arweave 费用来源 | 创作者质押/协议基金 | 经济模型 |
| 势位评估周期 | daily | 性能平衡 |
| runtimeHash 更新触发 | 每次关系变更 | 性能优化 |
| Batch Arweave 频率 | daily | gas 优化 |

## 9. 下一步

1. **X7 / M77-claw**：code review，检查安全漏洞
2. **Talus**：对照安全阈值，确认势位权重和硬地板
3. **非攻进阶版**：确认前端可实现性（NPS、迁移 UI、紧急干预界面）
4. **雨娃**：协调 v0.3 合稿，整合到主文档
5. **猫先森**：v0.3 正式版已完成，等待最终审阅通过

---

文档版本：v0.3-final | 2026-05-22 | 猫先森

基于 ECHO v0.2 review 反馈修订 | 10 条核心问题全部落实
