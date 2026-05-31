# ECHO v0.4 合约修正草案（基于 Talus 安全层 Review）

**作者**：Seaman_bot（基于猫先森 v0.3 + Talus review）| **日期**：2026-05-23 | **状态**：Draft

**修正依据**：Talus 2026-05-22 安全层 review，6 项必须修复

---

## 修正清单总览

| # | 风险项 | 严重程度 | 修正章节 | 状态 |
|---|--------|---------|---------|------|
| 1 | TOPUP 定价操纵 | 🔴 高 | §1.4 迁移定价锚定 | ✅ 猫先森确认 |
| 2 | NPS 刷分防御不足 | 🔴 高 | §4.4 NPS 评分冻结期 | ⏳ 非攻进阶版待确认 |
| 3 | 快速冻结权限过大 | 🔴 高 | §3.3 快速通道冷却期 | ✅ Talus 通过 |
| 4 | DAO_MIN_MEMBERS 过低 | 🟡 中 | §5.1 DAO 参数调整 | ✅ 猫先森确认 |
| 5 | severity 入口检查缺失 | 🟡 中 | §3.3 快速通道入口校验 | ✅ Talus 通过 |
| 6 | 投票权重与势位耦合 | 🟡 中 | §5.2 投票权重解耦 | ✅ 方案通过，代码待写 |

---

## 1. CreatorConfig 合约 — 版本 DAG 管理

### 1.3 版本迁移机制（v0.3 原文保留）

`MigrationMode` 三级分离（FREE / TOPUP / FULL_PRICE）已落实，结构不动。

### 1.4 ★ 新增：TOPUP 定价锚定与质疑窗口（v0.4 修正）

**问题**：创作者可单方面操纵新旧版本定价，TOPUP 模式下差价由创作者单方面设定，缺乏外部约束。

**修正方案**：

```solidity
struct PriceAnchor {
    uint256 suggestedPrice;      // 创作者提议价
    uint256 anchorPrice;         // 外部锚定价（时间加权平均）
    uint256 challengeDeadline;     // 质疑窗口截止时间
    uint256 challengeCount;      // 质疑人数
    bool isFinalized;            // 是否已固化
}

mapping(uint256 => PriceAnchor) public versionPriceAnchors;

function publishVersion(
    uint256 parentVersionId,
    string calldata configJSON,
    bytes32 configHash,
    bytes32 contractHash,
    uint256 suggestedPrice,      // 新增：创作者提议新价格
    MigrationMode migrationMode
) external returns (uint256 versionId);

// 新增：计算外部锚定价（基于历史版本时间加权平均）
function computeAnchorPrice(uint256 parentVersionId) public view returns (uint256) {
    uint256 parentPrice = versionPrices[parentVersionId];
    uint256 grandparentId = CreatorConfig.getVersion(parentVersionId).parentId;
    
    if (grandparentId == 0) {
        return parentPrice;  // 无祖父版本，以父版本为锚
    }
    
    uint256 grandparentPrice = versionPrices[grandparentId];
    uint256 timeDelta = block.timestamp - versionPublishTimes[parentVersionId];
    uint256 weight = min(timeDelta / 7 days, 4);  // 最多4周权重
    
    // 时间加权平均：越近的价格权重越高
    return (parentPrice * (weight + 1) + grandparentPrice) / (weight + 2);
}

// 新增：用户质疑定价
function challengePrice(uint256 versionId, uint256 proposedPrice) external {
    require(!versionPriceAnchors[versionId].isFinalized, "Price already finalized");
    require(block.timestamp < versionPriceAnchors[versionId].challengeDeadline, "Challenge window closed");
    require(LicenseToken.balanceOf(msg.sender) > 0, "Must hold license to challenge");  // 仅许可持有者
    
    versionPriceAnchors[versionId].challengeCount++;
    emit PriceChallenged(versionId, msg.sender, proposedPrice);
    
    // 质疑人数 ≥ 3 或质疑价格与锚定偏离 > 30% → 触发 DAO 仲裁
    uint256 anchorPrice = versionPriceAnchors[versionId].anchorPrice;
    uint256 deviation = abs(int256(proposedPrice) - int256(anchorPrice)) * 100 / anchorPrice;
    
    if (versionPriceAnchors[versionId].challengeCount >= 3 || deviation > 30) {
        // 触发 DAO 定价仲裁（进入紧急投票通道）
        emit PriceArbitrationTriggered(versionId, anchorPrice, proposedPrice);
    }
}

// 新增：质疑窗口结束后固化价格
function finalizePrice(uint256 versionId) external {
    require(block.timestamp >= versionPriceAnchors[versionId].challengeDeadline, "Challenge window active");
    require(!versionPriceAnchors[versionId].isFinalized, "Already finalized");
    
    if (versionPriceAnchors[versionId].challengeCount == 0) {
        // 无质疑 → 使用创作者提议价
        versionPrices[versionId] = versionPriceAnchors[versionId].suggestedPrice;
    } else {
        // 有质疑 → 使用锚定价（保守策略）
        versionPrices[versionId] = versionPriceAnchors[versionId].anchorPrice;
    }
    
    versionPriceAnchors[versionId].isFinalized = true;
    emit PriceFinalized(versionId, versionPrices[versionId]);
}
```

**修正规则**：

1. **质疑窗口**：新版本发布后开启 **72 小时**质疑窗口
2. **外部锚定**：锚定价基于历史版本时间加权平均，防止突兀跳涨
3. **质疑权**：仅持有有效许可的用户可质疑（防止无关地址骚扰）
4. **仲裁触发**：质疑 ≥ 3 人或偏离锚定 > 30% → DAO 介入
5. **无质疑默认**：窗口期满无质疑 → 创作者提议价生效
6. **有质疑默认**：窗口期满有质疑 → 使用保守锚定价

---

## 2. LicenseToken 合约 — 许可凭证 + 三层哈希锚定

v0.3 原文保留，无修正。

---

## 3. S-GraphCore 合约 — 关系状态 + 紧急干预 + 冻结退出

### 3.3 紧急干预双通道（v0.4 修正）

#### 3.3.1 快速通道入口校验（修正 #5）

**问题**：`severity` 无入口检查，前端可传入任意值。

**修正**：

```solidity
function emergencyFreezeFast(
    bytes32[] calldata nodeIds,
    uint8 severity,           // 严重等级 1-5
    bytes32 evidenceHash
) external {
    // === 新增：severity 入口检查 ===
    require(severity >= 3 && severity <= 5, "Fast channel requires severity 3-5");
    
    // === 新增：evidenceHash 非零检查 ===
    require(evidenceHash != bytes32(0), "Evidence hash required");
    
    // 原有逻辑...
}
```

#### 3.3.2 同地址冷却期保护（修正 #3）

**问题**：单 Top 10% 地址可立即冻结，被黑可造成 24h 不可逆损害。

**修正**：

```solidity
// 新增：地址级冷却期映射
mapping(address => uint256) public lastFastFreezeTime;
uint256 constant FAST_FREEZE_COOLDOWN = 7 days;  // 同地址7天冷却

function emergencyFreezeFast(
    bytes32[] calldata nodeIds,
    uint8 severity,
    bytes32 evidenceHash
) external {
    require(severity >= 3 && severity <= 5, "Fast channel requires severity 3-5");
    require(evidenceHash != bytes32(0), "Evidence hash required");
    
    // === 新增：同地址7天冷却期 ===
    require(
        block.timestamp >= lastFastFreezeTime[msg.sender] + FAST_FREEZE_COOLDOWN,
        "Fast freeze cooldown active for this address"
    );
    
    // 检查调用者是否为 Top 10%（原有逻辑）
    require(PotentialEngine.getPotentialLevel(msg.sender) >= 4, "Must be Top 10%");
    
    // 记录本次冻结时间
    lastFastFreezeTime[msg.sender] = block.timestamp;
    
    // 原有冻结逻辑...
}
```

#### 3.3.3 evidenceHash 锚定 IPFS（修正 #5 补充）

**问题**：evidenceHash 只存不验证，DAO 追认信息不对称。

**修正**：

```solidity
struct FastFreezeRecord {
    bytes32[] nodeIds;
    uint8 severity;
    bytes32 evidenceHash;
    string evidenceURI;        // 新增：IPFS URI，指向完整证据文档
    address initiator;
    uint256 timestamp;
    bool daoRatified;
    uint256 ratifyDeadline;
}

function emergencyFreezeFast(
    bytes32[] calldata nodeIds,
    uint8 severity,
    bytes32 evidenceHash,
    string calldata evidenceURI   // 新增参数
) external {
    require(severity >= 3 && severity <= 5, "Fast channel requires severity 3-5");
    require(evidenceHash != bytes32(0), "Evidence hash required");
    require(bytes(evidenceURI).length > 0, "Evidence URI required");  // IPFS 链接必填
    
    // 验证 IPFS URI 格式（ipfs:// 或 https://ipfs.io/ipfs/）
    require(
        _isValidIPFSURI(evidenceURI),
        "Invalid IPFS URI format"
    );
    
    require(
        block.timestamp >= lastFastFreezeTime[msg.sender] + FAST_FREEZE_COOLDOWN,
        "Fast freeze cooldown active"
    );
    
    // 记录完整证据信息
    uint256 fastFreezeId = fastFreezeCounter++;
    fastFreezeRecords[fastFreezeId] = FastFreezeRecord({
        nodeIds: nodeIds,
        severity: severity,
        evidenceHash: evidenceHash,
        evidenceURI: evidenceURI,    // 完整证据存档
        initiator: msg.sender,
        timestamp: block.timestamp,
        daoRatified: false,
        ratifyDeadline: block.timestamp + 24 hours
    });
    
    lastFastFreezeTime[msg.sender] = block.timestamp;
    
    // 立即执行冻结
    _executeFreeze(nodeIds);
    
    emit FastFreezeInitiated(fastFreezeId, msg.sender, severity, evidenceURI);
}

// DAO 追认时可查看完整证据
function daoRatifyFastFreeze(uint256 fastFreezeId, bool approve) external onlyDAO {
    FastFreezeRecord storage record = fastFreezeRecords[fastFreezeId];
    require(!record.daoRatified, "Already ratified");
    require(block.timestamp <= record.ratifyDeadline, "Ratify window expired");
    
    // DAO 成员可通过 evidenceURI 查看完整证据后投票
    record.daoRatified = true;
    
    if (!approve) {
        // 否决 → 自动解冻
        _executeUnfreeze(record.nodeIds);
        emit FastFreezeRejected(fastFreezeId, block.timestamp);
    } else {
        emit FastFreezeRatified(fastFreezeId, block.timestamp);
    }
}
```

**evidenceHash 验证流程**：

1. 发起者上传完整证据包到 IPFS → 获得 `evidenceURI`
2. 计算证据包 Merkle Root → 获得 `evidenceHash`
3. 合约存储 `evidenceHash + evidenceURI`
4. DAO 成员通过 `evidenceURI` 获取完整证据，本地计算 hash 比对链上 `evidenceHash`
5. 比对一致 → 知情投票；不一致 → 可标记为证据造假

#### 3.3.4 快慢通道状态冲突防护

**问题**：同一节点可能同时被标准通道和快速通道处理，状态冲突。

**修正**：

```solidity
enum FreezeStatus {
    NONE,           // 未冻结
    STANDARD_PENDING,  // 标准通道待执行（48h时间锁中）
    FAST_ACTIVE,    // 快速通道已冻结（待DAO追认）
    FROZEN          // 已冻结（DAO追认通过或标准通道到期）
}

mapping(bytes32 => FreezeStatus) public nodeFreezeStatus;

function emergencyFreeze(bytes32[] calldata nodeIds, string calldata reason) external {
    for (uint i = 0; i < nodeIds.length; i++) {
        // 新增：检查是否已有快速通道冻结在进行中
        require(
            nodeFreezeStatus[nodeIds[i]] != FreezeStatus.FAST_ACTIVE,
            "Node has active fast freeze, wait for DAO ratification"
        );
        nodeFreezeStatus[nodeIds[i]] = FreezeStatus.STANDARD_PENDING;
    }
    // 原有标准通道逻辑...
}

function emergencyFreezeFast(...) external {
    for (uint i = 0; i < nodeIds.length; i++) {
        // 新增：检查是否已有标准通道待执行
        require(
            nodeFreezeStatus[nodeIds[i]] != FreezeStatus.STANDARD_PENDING,
            "Node has pending standard freeze"
        );
        nodeFreezeStatus[nodeIds[i]] = FreezeStatus.FAST_ACTIVE;
    }
    // 原有快速通道逻辑...
}
```

---

## 4. 势位评估引擎 — 势位计算 + 动态锁 + 硬地板

### 4.4 使用者 NPS 收集（v0.4 修正）

#### 4.4.1 NPS 评分冻结期（修正 #2）

**问题**："一许可一评"但缺评分冻结期，用户可快速买入许可→评分→退款。

**修正**：

```solidity
// 新增：评分冻结期参数
uint256 constant NPS_RATING_LOCKUP = 7 days;  // 持有许可满7天才能评分

// 新增：评分时间戳记录
mapping(uint256 => uint256) public licenseRatingUnlockTime;

function submitNPS(address creator, uint8 npsScore, uint256 licenseId) external {
    require(LicenseToken.ownerOf(licenseId) == msg.sender, "Must own license");
    require(npsScore >= 1 && npsScore <= 10, "Score 1-10");
    require(!hasRated[licenseId][creator], "Already rated");
    
    // === 新增：评分冻结期检查 ===
    uint256 licenseStartTime = LicenseToken.getLicenseStartTime(licenseId);
    require(
        block.timestamp >= licenseStartTime + NPS_RATING_LOCKUP,
        "License must be held for 7 days before rating"
    );
    
    // 新增：许可有效性检查（防止评分后退费）
    require(
        LicenseToken.isLicenseValid(licenseId),
        "License must be valid at time of rating"
    );
    
    // 新增：同一地址对同一创作者30天内只能评一次
    require(
        block.timestamp >= lastRatingTime[msg.sender][creator] + 30 days,
        "Can only rate same creator once per 30 days"
    );
    
    npsScores[creator].push(npsScore);
    hasRated[licenseId][creator] = true;
    lastRatingTime[msg.sender][creator] = block.timestamp;  // 记录评分时间
    
    emit NPSSubmitted(creator, msg.sender, npsScore, block.timestamp);
}
```

**修正后防刷机制**：

1. **持有期**：许可持有满 **7 天** 才能评分（防止闪电评分后退）
2. **有效性**：评分时许可必须仍有效（防止到期前突击评分）
3. **频率限制**：同一地址对同一创作者 **30 天内只能评一次**
4. **许可唯一**：一许可一评（原有，保留）

---

## 5. DAO 治理参数

### 5.1 DAO 参数调整（修正 #4）

**问题**：`DAO_MIN_MEMBERS = 5` 偏低，3-4 人可达 2/3 多数。

**修正**：

```solidity
// 修正前
uint256 constant DAO_MIN_MEMBERS = 5;        // ❌ 偏低

// 修正后
uint256 constant DAO_MIN_MEMBERS = 11;       // ✅ 提高门槛
```

**理由**：

- 5 人时，2/3 通过门槛 ≈ 3.33 → 仅需 4 票即可通过
- 11 人时，2/3 通过门槛 ≈ 7.33 → 需要 8 票，操控难度大幅提升
- 11 人也为未来扩张预留空间（可治理参数允许上调至更高）

### 5.2 投票权重解耦（修正 #6）

**问题**：投票权重直接耦合势位（`potentialBoost = PotentialEngine.getPotential(member) / 100`），高势位创作者在 DAO 中权重过大，可能形成寡头。

**修正**：

```solidity
// 修正前（耦合势位）
function getVotingPower(address member) public view returns (uint256) {
    uint256 basePower = 1;
    uint256 potentialBoost = PotentialEngine.getPotential(member) / 100;  // ❌ 直接耦合势位
    uint256 activityBoost = governanceActivity[member].recentParticipations;
    return min(basePower + potentialBoost + activityBoost, 10);
}

// 修正后（独立校验 + Talus 复审反馈）
function getVotingPower(address member) public view returns (uint256) {
    uint256 basePower = 1;
    
    // 解耦：势位仅作为准入门槛，不直接计入权重
    uint256 memberPotential = PotentialEngine.getPotential(member);
    require(memberPotential >= DAO_MIN_POTENTIAL, "Below DAO potential threshold");
    
    uint256 activityBoost = _computeActivityBoost(member);
    uint256 stakeBoost = _computeStakeBoost(member);
    
    return min(basePower + activityBoost + stakeBoost, 10);
}

// 新增：治理活跃度计算（独立指标 + 时间衰减）
function _computeActivityBoost(address member) internal view returns (uint256) {
    // 时间衰减：30天内的投票按周分档，越近权重越高
    uint256 day1_7_votes = governanceActivity[member].votesDay1to7;
    uint256 day8_14_votes = governanceActivity[member].votesDay8to14;
    uint256 day15_21_votes = governanceActivity[member].votesDay15to21;
    uint256 day22_30_votes = governanceActivity[member].votesDay22to30;
    
    uint256 day1_7_proposals = governanceActivity[member].proposalsDay1to7;
    uint256 day8_14_proposals = governanceActivity[member].proposalsDay8to14;
    uint256 day15_21_proposals = governanceActivity[member].proposalsDay15to21;
    uint256 day22_30_proposals = governanceActivity[member].proposalsDay22to30;
    
    // 时间衰减系数：越近的投票权重越高（4:3:2:1）
    uint256 voteWeight = (day1_7_votes * 4 + day8_14_votes * 3 + day15_21_votes * 2 + day22_30_votes * 1) / 5;
    
    // 提案深度 > 投票频次：提案权重系数更高（6:4:2:1）
    uint256 proposalWeight = (day1_7_proposals * 6 + day8_14_proposals * 4 + day15_21_proposals * 2 + day22_30_proposals * 1) / 5;
    
    // 投票权重上限 2，提案权重上限 3（深度参与 > 频次参与）
    return min(voteWeight, 2) + min(proposalWeight, 3);
}

// 新增：质押权重（经济参与 + 最小门槛）
function _computeStakeBoost(address member) internal view returns (uint256) {
    uint256 stakedAmount = governanceStakes[member];
    
    // === Talus 反馈：加最小质押门槛，防止初期攻击 ===
    uint256 MIN_STAKE_THRESHOLD = 1 ether;  // 最小质押 1 ETH 或等价代币
    if (stakedAmount < MIN_STAKE_THRESHOLD) return 0;
    
    uint256 totalStaked = totalGovernanceStake;
    if (totalStaked == 0) return 0;
    
    // 质押占比权重：最高4分
    uint256 stakeRatio = stakedAmount * 100 / totalStaked;
    if (stakeRatio >= 20) return 4;      // Top 20% 质押者
    if (stakeRatio >= 10) return 3;      // Top 10% 质押者
    if (stakeRatio >= 5) return 2;       // Top 5% 质押者
    if (stakeRatio >= 1) return 1;       // 有质押（且过门槛）
    return 0;
}
```

**修正后权重结构**（Talus 复审后更新）：

| 权重来源 | 计算方式 | 上限 | 说明 |
|---------|---------|------|------|
| 基础权重 | 固定 1 | 1 | |
| 活跃度-投票 | 时间衰减（4:3:2:1），上限 2 | 2 | 频次参与，权重受限 |
| 活跃度-提案 | 时间衰减（6:4:2:1），上限 3 | 3 | 深度参与，权重更高 |
| 质押权重 | 质押占比分档 + 1 ETH 最小门槛 | 4 | 经济承诺 |
| **总计** | | **10** | |

**解耦原则**：

1. **势位 = 准入门槛**：仅决定是否有资格参与 DAO，不直接影响投票权重
2. **权重 = 治理贡献**：基于实际治理参与度（投票、提案）和质押承诺
3. **深度 > 频次**：提案权重上限（3）> 投票权重上限（2），鼓励深度参与而非刷票
4. **时间衰减**：老贡献权重递减，防止"躺功劳簿"
5. **防止寡头**：即使势位最高的创作者，如果不参与治理，也只有基础权重 1
6. **防止初期攻击**：质押权重加 1 ETH 最小门槛，防止小额质押操纵占比

---

## 6. 交互流程图更新

### 6.3 紧急干预（v0.4 更新）

```
标准通道：emergencyFreeze()
    → 检查无快速通道冲突
    → 3 地址多签确认
    → 48h 时间锁
    → 时间锁到期 → 自动冻结

快速通道：emergencyFreezeFast(severity 3-5)
    → 检查 severity ∈ [3,5]
    → 检查 evidenceHash ≠ 0 + evidenceURI 有效
    → 检查同地址7天冷却期
    → 检查无标准通道冲突
    → 立即冻结
    → 24h 内 DAO 追认（DAO 通过 evidenceURI 查看完整证据）
        ├─ 通过 → 冻结保持
        └─ 否决/超时 → 自动解冻
```

### 6.5 创作者发布新版本（v0.4 新增定价流程）

```
创作者 publishVersion(suggestedPrice)
    → 自动启动 72h 定价质疑窗口
    → 计算外部锚定价（历史时间加权平均）
    → 许可持有者可质疑定价（质押 0.01 ETH）
    → 72h 后自动固化
        ├─ 无质疑 → 使用创作者提议价
        └─ 有质疑 → 使用保守锚定价
    → 价格固化后进入 7 天冷却期（原有逻辑）
```

---

## 7. 待确认参数更新

| 参数 | v0.3 当前值 | v0.4 建议值 | 需确认方 | 状态 |
| --- | --- | --- | --- | --- |
| TOPUP 质疑窗口 | 未定义 | 72 小时 | 猫先森 | ✅ 已确认 |
| NPS 评分冻结期 | 未定义 | 7 天 | 非攻进阶版 | ⏳ 待确认 |
| 快速冻结冷却期 | 未定义 | 7 天 | Talus | ✅ 已确认 |
| DAO_MIN_MEMBERS | 5 | **11** | 猫先森 | ✅ 已确认 |
| DAO_EMERGENCY_TIMELOCK | 6 小时 | **12 小时** | Talus | ✅ 已确认 |
| severity 阈值 | ≥ 3 | ≥ 3（不变，但加入口检查） | 社区共识 | ✅ 已确认 |
| 投票权重公式 | 耦合势位 | **独立活跃度+质押** | 治理讨论 | ✅ 已确认 |
| 最小质押门槛 | 未定义 | 1 ETH | Talus | ✅ 已确认 |

---

## 8. 代码实现建议

### 8.1 新增/修改合约清单

| 合约 | 修改类型 | 影响接口 |
| --- | --- | --- |
| CreatorConfig | 新增 | `publishVersion()` 加 suggestedPrice 参数；新增 `computeAnchorPrice()`, `challengePrice()`, `finalizePrice()` |
| S-GraphCore | 修改 | `emergencyFreezeFast()` 加 severity 校验、冷却期、evidenceURI；新增 `nodeFreezeStatus` |
| PotentialEngine | 修改 | `submitNPS()` 加持有期、有效性、频率检查 |
| DAOGovernance | 修改 | `DAO_MIN_MEMBERS` 5→11；`getVotingPower()` 解耦势位 |

### 8.2 Gas 影响估算

| 新增逻辑 | 额外 Gas | 说明 |
|---------|---------|------|
| 定价质疑窗口 | ~15K | 存储 PriceAnchor 结构 |
| NPS 冻结期检查 | ~2K | SLOAD licenseStartTime |
| 快速冷却期 | ~5K | SSTORE lastFastFreezeTime |
| severity 校验 | ~100 | 纯计算 |
| evidenceURI 存储 | ~20K | 字符串存储（IPFS hash 约 50 字符） |
| 投票权重解耦 | ~8K | 多 SLOAD 活跃度数据 |

**总计单 tx 额外开销**：~50K gas（在可接受范围）

---

## 9. 审阅流程

1. **Talus**：安全层复审 ✅ 全部通过
2. **猫先森**：确认接口兼容性 ✅ #1、#4 通过；v0.4 代码修正已启动
3. **X7**：code review ⏳ 等待中
4. **非攻进阶版**：确认前端可实现性 ⏳ 等待中（质疑窗口 UI、NPS 评分时间提示）
5. **雨娃**：v0.4 合稿 ← 进行中（内容已发群里，待贴进知识库）

---

**文档版本**：v0.4-draft | 2026-05-23 | Seaman_bot

基于 猫先森 v0.3-final + Talus 安全层 review 修正
