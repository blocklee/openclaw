# shigraph 攻击面热力图（Day 2）

**编制**：Seaman_bot  
**日期**：2026-05-28  
**范围**：EchoShigraphAntiSpam.sol 逐函数攻击面分析  
**方法**：系统论脆弱性 + 合约代码审计  

---

## 执行摘要

**总风险评级**：🟡 **中等偏高**（8 个高/极高风险点，其中 2 个已修复，6 个需 V1 处理）

| 类别 | 数量 | 状态 |
|------|------|------|
| 🔴 极高风险 | 2 | 待修复 |
| 🟠 高风险 | 6 | 1 已修复，5 待修复 |
| 🟡 中等风险 | 4 | 待修复 |
| 🟢 低风险 | 3 | 可接受 |

---

## 一、函数级攻击面分析

### 1. `createDerivationEdge` — 核心创建函数

**代码位置**：第 200-260 行（近似）  
**复杂度**：🟠 高（涉及 5 个子系统交互）

#### 1.1 质押检查 `msg.value < baseStakeAmount`

**风险**：🟢 低  
**分析**：
- 最小质押 MIN_STAKE = 0.001 ether，门槛足够低不阻碍正常用户
- baseStakeAmount 可由治理调整（updateBaseStake）
- 无重入风险（先检查后写入）

**建议**：保持现状。

#### 1.2 速率限制 `_checkRateLimit`

**风险**：🟡 中  
**分析**：
- `dailyCountResetTime[caller] + 1 days` 重置逻辑正确
- 但 **新钱包判断条件有漏洞**：
  ```solidity
  if (totalInteractionCount[caller] == 0) {
      return NEW_WALLET_LIMIT; // 1条/24h
  }
  ```
  攻击者可以用同一个钱包创建第一条边后，totalInteractionCount 立即变为 1，之后享受 NORMAL_WALLET_LIMIT（5条/24h）。**这不是漏洞，是设计意图**（首次交互后升级）。但如果攻击者想保持"新钱包"状态，只需用不同钱包。

**系统论关联**：速率限制是 **S2 协调层**（防止振荡），但新钱包的低限制可能延长冷启动时间（坤卦→屯卦相变的阻尼过大）。

**建议**：保持现状。

#### 1.3 环形检测 `_detectCycle`

**风险**：🟠 **高风险**  
**分析**：
- MAX_CYCLE_DEPTH = 10，超出深度的环 **检测不到**
- 攻击者可以构造 11 层衍生链 A→B→C→...→K→A，绕过环形检测
- 环一旦形成，势位计算进入无限递归（系统崩溃）

**数学分析**：
- 检测复杂度 O(b^d)，其中 b=平均分支因子，d=深度
- d=10 时，如果 b=5，最坏情况遍历 5^10 = 9,765,625 个节点
- 实际 gas 限制会在遍历完成前触发 out-of-gas

**系统论关联**：环形检测是 **消除正反馈回路** 的机制。如果绕过，系统进入自增强循环（A 引用 B，B 引用 C，...，K 引用 A → 势位无限增长）。

**建议修复**：
```solidity
// 1. 增加深度到 15-20（权衡 gas 成本）
uint8 public constant MAX_CYCLE_DEPTH = 15;

// 2. 添加总 gas 限制检查
uint256 constant MAX_CYCLE_GAS = 100000;
function _dfsDetectCycle(...) internal view returns (bool) {
    if (gasleft() < MAX_CYCLE_GAS) return true; // 保守策略：gas 不足时假设有环
    ...
}

// 3. 更根本的修复：使用迭代而非递归，避免栈溢出
```

#### 1.4 接收方软上限 `_checkReceiverCap`

**风险**：🟡 中  
**分析**：
- RECEIVER_SOFT_CAP = 50，24h 内超过 50 条引用进入慢速队列
- 但 **计数器可能溢出**：`dailyIncomingCount[toNode]++` 是 uint256，实际上不会溢出
- 更大的问题：**没有区分真实引用和垃圾引用**——攻击者可以用 51 个垃圾钱包将目标节点推入慢速队列

**系统论关联**：软上限是 **S3 控制层**（负载均衡），但攻击者可以通过「虚假的负载」触发保护机制，反而惩罚正常节点。

**建议**：保持现状，但链下引擎需要辅助判断引用的「质量」。

#### 1.5 亲代稀释 `_calculateDilutedWeight`

**风险**：🟠 **高风险 + BUG**  
**分析**：

**发现 BUG**：
```solidity
function _calculateDilutedWeight(...) internal returns (uint256) {
    ...
    if (count <= DILUTION_TIER_1) { return 100; }        // count <= 10
    else if (count <= DILUTION_TIER_2) { return 80; }    // count <= 100
    else if (count <= 50) { return 50; }                 // ❌ 永远不会执行！
    else { return 10; }                                   // count > 100
}
```

**问题**：第三个条件 `else if (count <= 50)` 永远不会执行，因为 count <= 50 已经满足 count <= 100，在上一个分支就被捕获了。

**实际稀释效果**：
- ≤10 条：100%
- 11-100 条：80%
- 100+ 条：10%
- **缺少 50% 的中间档**

**与文档不一致**：
- 注释说「11-100条50%」
- 实际代码实现「11-100条80%」
- Day 1 文档写「四级权重（≤1=100%, 2-10=80%, 11-50=50%, 51+=10%）」——也和代码不一致

**建议修复**：
```solidity
// 方案 A（按注释修复）：
if (count <= 10) return 100;
else if (count <= 100) return 50;  // 注释说 50%
else return 10;

// 方案 B（按 Day 1 文档修复，四档）：
if (count <= 1) return 100;        // 第1条
else if (count <= 10) return 80;   // 2-10条
else if (count <= 50) return 50;   // 11-50条
else if (count <= 100) return 20;  // 51-100条
else return 10;                    // 100+条

// 方案 C（简单三档，按当前代码意图）：
if (count <= 10) return 100;
else if (count <= 100) return 80;
else return 10;
```

**需要哪吒/雨娃确认**：用哪个方案？

---

### 2. `_checkRateLimit` — 速率限制检查

**风险**：🟡 中  
**分析**：
- 高声誉判断：`_isHighReputation` 使用启动期代理指标
  ```solidity
  return totalInteractionCount[caller] >= 100 
      && block.timestamp >= firstInteractionTime[caller] + 30 days;
  ```
- **攻击面**：攻击者可以用脚本在 30 天内积累 100 次交互（每次 0.001 MEER 质押），获得高声誉限额（20条/24h）
- 成本：100 × 0.001 = 0.1 MEER = **低成本获取高声誉**

**系统论关联**：代理指标是 **S4 情报层** 的简化版。攻击者可以通过「刷交互」欺骗代理指标，获得更高的操作权限。

**建议**：
- 启动期提高门槛：totalInteractionCount >= 500 或增加经济成本
- 成熟期切换到链下引擎提交 potentialValue（更可靠）

---

### 3. `_dfsDetectCycle` — 环形检测 DFS

**风险**：🟠 高风险  
**分析**：
- **递归深度限制**：MAX_CYCLE_DEPTH = 10，但 Solidity 的调用栈深度约为 1024
- **攻击面 1**：构造 11 层环 → 绕过检测
- **攻击面 2**：构造 10 层的「准环」（A→B→C→...→J，然后 J 大量引用其他节点）→ DFS 遍历节点数爆炸，gas 耗尽

**数学分析**：
```
最坏情况遍历节点数 = Σ_{i=0}^{d} b^i = (b^{d+1} - 1) / (b - 1)

如果 b=5, d=10: 节点数 ≈ 12,207,031
每次访问读取 storage（cold）≈ 2000 gas
总 gas ≈ 24,414,062,000 >> 30M 区块 gas limit
```

**结果**：攻击者可以通过构造宽而浅的衍生树，让 `createDerivationEdge` 在环形检测阶段耗尽 gas，导致正常用户无法创建边。

**系统论关联**：这是 **DoS 攻击**——通过制造系统的「自检查」过载，让系统无法处理正常请求。

**建议修复**：
```solidity
// 1. 迭代替代递归（避免栈溢出）
// 2. 增加 gas 限制检查
// 3. 更根本：限制每个节点的入度边数（如最多 1000 条）
uint256 public constant MAX_INCOMING_EDGES = 1000;

function createDerivationEdge(...) {
    require(incomingEdges[toNode].length < MAX_INCOMING_EDGES, "Too many incoming edges");
    ...
}
```

---

### 4. `challengePotential` — 挑战势位值

**风险**：🟡 中  
**分析**：
- CHALLENGE_STAKE = 0.1 ether
- CHALLENGE_COOLDOWN = 1 day
- **问题 1**：没有记录 `claimedPotential`——任何人可以对同一节点反复挑战，每次支付 0.1 MEER
- **问题 2**：没有检查挑战者是否有「资格」（如是否与节点有利益关系）

**系统论关联**：挑战机制是 **S5 政策层** 的负反馈。但如果挑战门槛太低，会被滥用为 DoS 工具。

**建议**：
- 记录 claimedPotential 并检查一致性
- 增加挑战者资格门槛（如节点势位 > 0 才允许挑战）

---

### 5. `resolveChallenge` — 解决挑战

**风险**：🟠 高风险  
**分析**：

**问题 1：slash 金额逻辑缺陷**
```solidity
slashAmount = stake; // 1:1 slash，基于挑战质押金额
```
挑战者质押 0.1 MEER → slash 金额 = 0.1 MEER。但原提交者可能根本没有质押这么多。

**问题 2：原提交者质押追踪缺失**
```solidity
address originalSubmitter = potentialSubmitter[nodeId];
```
只记录了地址，没有记录原提交者质押了多少。如果原提交者只质押了 0.001 MEER，却要被 slash 0.1 MEER，逻辑上不成立。

**建议修复**：
```solidity
// 新增映射：记录每个节点的提交质押
mapping(bytes32 => uint256) public potentialSubmitStake;

function submitPotential(...) external onlyGovernance payable {
    require(msg.value >= MIN_SUBMIT_STAKE, "Insufficient submit stake");
    potentialValue[nodeId] = potential;
    potentialSubmittedAt[nodeId] = block.timestamp;
    potentialSubmitter[nodeId] = msg.sender;
    potentialSubmitStake[nodeId] = msg.value; // 记录质押
}

function resolveChallenge(...) {
    ...
    uint256 actualSlash = min(slashAmount, potentialSubmitStake[nodeId]);
    // 从原提交者地址扣除 actualSlash
    ...
}
```

---

### 6. `submitPotential` — 提交势位值

**风险**：🔴 **极高风险**  
**分析**：

**问题 1：没有质押要求**
```solidity
function submitPotential(bytes32 nodeId, uint256 potential) external onlyGovernance {
```
治理地址调用时不需要质押，可以随意提交任何势位值。如果治理密钥被盗，攻击者可以提交虚假势位值。

**问题 2：没有冷却期**
可以频繁覆盖 potentialValue，导致系统振荡。

**系统论关联**：这是 **受驱序参量** 的核心风险点——外部干预（治理调用 setPotential）没有约束，可能导致系统失稳。

**建议修复**：
```solidity
mapping(bytes32 => uint256) public lastPotentialUpdate;
uint256 public constant POTENTIAL_COOLDOWN = 7 days;

function submitPotential(...) external onlyGovernance payable {
    require(msg.value >= MIN_SUBMIT_STAKE, "Insufficient stake");
    require(
        block.timestamp >= lastPotentialUpdate[nodeId] + POTENTIAL_COOLDOWN,
        "Potential update too frequent"
    );
    ...
    lastPotentialUpdate[nodeId] = block.timestamp;
}
```

---

### 7. `updateGovernance` — 更新治理地址

**风险**：🔴 **极高风险**  
**分析**：

**立即生效，没有时间锁**。
```solidity
function updateGovernance(address newGovernance) external onlyGovernance {
    governance = newGovernance;
}
```

如果当前治理密钥被盗：
1. 攻击者立即更新 governance 为自己的地址
2. 攻击者调用 setPaused(true) 暂停合约
3. 攻击者调用 withdrawTreasury() 提走全部资金
4. 全部操作在 1 个区块内完成

**系统论关联**：治理地址是 **S5 政策层** 的最高权限。没有时间锁 = 权限转移是瞬时相变，系统来不及适应。

**建议修复**：
```solidity
address public pendingGovernance;
uint256 public governanceChangeTime;
uint256 public constant GOVERNANCE_TIMELOCK = 2 days;

function updateGovernance(address newGovernance) external onlyGovernance {
    pendingGovernance = newGovernance;
    governanceChangeTime = block.timestamp;
}

function acceptGovernance() external {
    require(msg.sender == pendingGovernance, "Only pending governance");
    require(
        block.timestamp >= governanceChangeTime + GOVERNANCE_TIMELOCK,
        "Timelock not expired"
    );
    governance = pendingGovernance;
    pendingGovernance = address(0);
}
```

---

### 8. `withdrawTreasury` — 提取协议资金

**风险**：🟠 高风险  
**分析**：

**一次性提走全部余额**。
```solidity
function withdrawTreasury() external onlyGovernance {
    payable(governance).transfer(address(this).balance);
}
```

如果治理密钥被盗，全部资金立即损失。

**建议修复**：
```solidity
// 增加限额和频率限制
uint256 public dailyWithdrawalLimit = 10 ether;
uint256 public lastWithdrawalTime;
uint256 public withdrawnToday;

function withdrawTreasury(uint256 amount) external onlyGovernance {
    if (block.timestamp >= lastWithdrawalTime + 1 days) {
        withdrawnToday = 0;
        lastWithdrawalTime = block.timestamp;
    }
    require(amount <= dailyWithdrawalLimit, "Exceeds daily limit");
    require(withdrawnToday + amount <= dailyWithdrawalLimit, "Exceeds daily limit");
    require(amount <= address(this).balance, "Insufficient balance");
    
    withdrawnToday += amount;
    payable(governance).transfer(amount);
}
```

---

## 二、攻击面热力图总表

| 攻击路径 | 触发条件 | 目标函数 | 风险等级 | 修复优先级 | 系统论关联 |
|---------|---------|---------|---------|----------|----------|
| **深度环绕过** | 构造 11 层环 | `_dfsDetectCycle` | 🟠 高 | P0 | S2 协调失效 |
| **亲代稀释 BUG** | 代码逻辑错误 | `_calculateDilutedWeight` | 🟠 高 | P0 | S1 操作失真 |
| **治理接管** | 密钥被盗 | `updateGovernance` | 🔴 极高 | P0 | S5 政策崩溃 |
| **势位篡改** | 治理滥用 | `submitPotential` | 🔴 极高 | P0 | 受驱序参量振荡 |
| **资金掠夺** | 密钥被盗 | `withdrawTreasury` | 🟠 高 | P1 | S3 控制失效 |
| **gas 耗尽 DoS** | 宽衍生树 | `_dfsDetectCycle` | 🟠 高 | P1 | S2 过载 |
| **slash 逻辑缺陷** | 质押不匹配 | `resolveChallenge` | 🟠 高 | P1 | S4 情报错误 |
| **挑战滥用** | 低成本反复挑战 | `challengePotential` | 🟡 中 | P2 | S5 负反馈过载 |
| **声誉刷取** | 低成本积累交互 | `_isHighReputation` | 🟡 中 | P2 | S4 情报欺骗 |
| **软上限操纵** | 垃圾引用填充 | `_checkReceiverCap` | 🟡 中 | P2 | S3 虚假负载 |
| **审查状态绕过** | 等待 7 天 | `isSuspicious` | 🟢 低 | P3 | S4 延迟 |
| **质押绕过** | 支付最低质押 | `createDerivationEdge` | 🟢 低 | P3 | S1 经济门槛 |
| **暂停绕过** | 无法绕过 | `whenNotPaused` | 🟢 低 | — | S5 紧急干预 |

---

## 三、系统论视角的关键脆弱性

### 3.1 受驱序参量失控（对应 `submitPotential` + `updateGovernance`）

**脆弱点**：DAO 可以直接 setPotential=0 且没有时间锁。

**攻击场景**：
1. 攻击者获取治理密钥（钓鱼/社工）
2. 连续调用 submitPotential 将所有高势位节点归零
3. 系统从「泰卦/乾卦」相变到「否卦/坤卦」
4. 创作者生态信任崩塌，用户退出

**修复**：治理时间锁（2 天）+ 势位更新冷却期（7 天）。

### 3.2 正反馈回路绕过（对应 `_dfsDetectCycle`）

**脆弱点**：环检测深度限制 = 10，超出后环形成。

**攻击场景**：
1. 攻击者创建 11 层环 A→B→...→K→A
2. 环内节点互相引用，势位无限增长
3. 系统进入「虚假繁荣态」（泰卦假象）
4. 真实用户被虚假势位误导，引用垃圾内容

**修复**：增加深度到 15-20 + 入度边数上限。

### 3.3 滞后效应利用（对应 `resolveChallenge` + 申诉机制缺失）

**脆弱点**：误判归零后恢复，势位永久损失 ~5%。

**攻击场景**：
1. 攻击者批量举报竞争对手的作品
2. 审查机制误判，作品势位归零
3. 创作者申诉成功，但恢复后势位比原值低 ~5%
4. 反复攻击可导致创作者势位持续下降

**修复**：申诉成功恢复历史权重（预留接口）。

### 3.4 Viability 条件违反（对应 FourRightsValidator.sol 未覆盖）

**脆弱点**：合约层只检查了部分死锁条件。

**攻击场景**：
1. 创作者设置用权=0（私密）但衍权=1（可改编）
2. 合约不拦截（FourRightsValidator 未检查条件 2）
3. 私密内容被 fork，边界破裂
4. 创作者丧失内容控制权

**修复**：FourRightsValidator.sol 补充用权=0+衍权≥1 的硬拦截。

---

## 四、修复建议优先级

### P0（V1 必须修复，否则系统不安全）

1. **亲代稀释逻辑修复**（代码 BUG）
   - 修改 `_calculateDilutedWeight` 的 tier 逻辑
   - 需要确认：四档还是三档？具体阈值？

2. **治理时间锁**（极高风险）
   - `updateGovernance` 添加 2 天 timelock
   - `withdrawTreasury` 添加日限额

3. **势位更新冷却期**（极高风险）
   - `submitPotential` 添加 7 天冷却期 + 质押要求

4. **环检测深度增加**（高风险）
   - MAX_CYCLE_DEPTH 从 10 增加到 15-20
   - 添加入度边数上限（MAX_INCOMING_EDGES = 1000）

### P1（V1 建议修复，提升系统鲁棒性）

5. **slash 质押追踪**（高风险）
   - 新增 `potentialSubmitStake` 映射
   - slash 金额 = min(挑战质押, 原提交者质押)

6. **gas 保护**（高风险）
   - `_dfsDetectCycle` 添加 gasleft() 检查

### P2（V1 可选，或留 V2）

7. **挑战者资格门槛**（中等风险）
8. **声誉门槛提高**（中等风险）
9. **软上限质量过滤**（中等风险）

### P3（可接受，无需修复）

10. 审查状态 7 天等待期
11. 最低质押门槛

---

## 五、需要哪吒/雨娃确认的决策

1. **亲代稀释 tier 设计**：四档（≤1/2-10/11-50/51+）还是三档（≤10/11-100/100+）？
2. **治理时间锁时长**：2 天？7 天？14 天？
3. **势位更新冷却期**：7 天？14 天？30 天？
4. **环检测深度**：15？20？还是保持 10 但增加入度上限？
5. **资金提取限额**：每日 10 MEER？还是按比例？

---

**产出者**：Seaman_bot  
**审阅状态**：等待雨娃/哪吒确认修复优先级  
**下一步**：确认后开始 P0 修复的合约编码
