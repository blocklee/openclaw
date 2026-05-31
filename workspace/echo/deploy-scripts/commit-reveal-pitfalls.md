# ECHO v0.4 commit-reveal 逻辑坑点文档

## 流程图

```
commitVote(bytes32 _commitHash)
  → 等待 reveal 窗口开启（至少 1 区块 / N 分钟）
revealVote(uint256 _caseId, bool _vote, uint256 _salt)
  → 合约验证 keccak256(abi.encodePacked(_caseId, _vote, _salt)) == commitHash
  → 计票
finalizeCase(uint256 _caseId)
  → 达到 supportCount + revealCount 阈值后结算
```

## 关键坑点

### 1. Salt 必须在客户端生成，绝对不能上链
- 错误的：在合约里生成 salt（泄露 = 可预测）
- 正确的：`const salt = Math.floor(Math.random() * 1000000)` 或 `crypto.randomBytes(32)`
- Salt 只在 reveal 阶段暴露，commit 阶段只传哈希

### 2. 哈希算法必须完全一致
- 前端：`ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['uint256', 'bool', 'uint256'], [caseId, vote, salt]))`
- 合约：`keccak256(abi.encodePacked(caseId, vote, salt))`
- ⚠️ abi.encode vs abi.encodePacked 结果不同！AgentJury.sol 里用的是 abi.encodePacked，前端必须匹配

### 3. Commit-reveal 时间窗口
- commit 后不能立即 reveal（需要至少 1 个区块确认，或合约定义的 minRevealDelay）
- 如果 reveal 太早，合约可能 revert "Too early"
- 建议前端：commit 后等 1-2 个区块（~30-60 秒）再 reveal

### 4. Case 6 实测数据（供参考）
```javascript
const caseId = 6;
const vote = true;  // 支持
const salt = 12345;
const commitHash = ethers.utils.keccak256(
  ethers.utils.defaultAbiCoder.encode(
    ['uint256', 'bool', 'uint256'],
    [caseId, vote, salt]
  )
);
// commitHash = "0x..." (64 位 hex)
await agentJury.commitVote(commitHash);
// 等 1 区块
await agentJury.revealVote(caseId, vote, salt);
```

### 5. Gas 注意
- commitVote: ~45000 gas
- revealVote: ~65000 gas（含哈希验证 + 状态更新）
- finalizeCase: ~80000 gas（结算 + 触发事件）

## 用户-facing 函数清单（AgentJury）

| 函数 | 参数 | 说明 |
|------|------|------|
| `commitVote(bytes32)` | commitHash | 提交加密投票 |
| `revealVote(uint256,bool,uint256)` | caseId, vote, salt | 解密投票 |
| `getCaseInfo(uint256)` | caseId | 查询案件状态 |
| `hasCommitted(address,uint256)` | voter, caseId | 查某地址是否已 commit |
| `hasRevealed(address,uint256)` | voter, caseId | 查某地址是否已 reveal |

## 其他合约用户-facing 函数速查

### LicenseNFT（购买许可）
- `purchaseLicense(uint256 _templateId, uint256 _durationDays)`
- `getLicenseInfo(uint256 _licenseId)`
- `isLicenseValid(address _holder, uint256 _templateId)`

### GovernanceDAO（治理参与）
- `createProposal(string _description, bytes _calldata)`
- `vote(uint256 _proposalId, bool _support)`
- `executeProposal(uint256 _proposalId)`

### PotentialEngine（评分查询）
- `getPotential(address _agent)` — 查 Agent 潜力分
- `getReputation(address _agent)` — 查信誉分

---
文档版本: 2026-05-25
整理者: Seaman_bot
