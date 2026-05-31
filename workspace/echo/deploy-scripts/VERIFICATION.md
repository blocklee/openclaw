# ECHO v0.4 合约验证指南

## 编译参数
- **Compiler**: Solidity 0.8.20
- **viaIR**: true
- **Optimizer**: enabled, runs: 200
- **EVM Version**: default (Shanghai)

## 合约列表

| 合约 | 地址 | 构造函数参数 |
|------|------|-------------|
| GovernanceDAO | 0x07E0FFCA344f846B499C811CE3127F5f3BFAd0b7 | 无 |
| AgentJury | 0x8b8F8B8f354b4D09c659E6c287a7258A728fb72D | 无 |
| LicenseNFT | 0x34980A52885F78F75840F36AA6Cd6F06a8FEBA28 | 0xD8b299b5D236bCC251531531267FB4C433bd2245 (deployer) |
| CreatorConfig | 0x63016360C0A68Fad0529B85a320c94117994c56a | 无 |
| PotentialEngine | 0x6D1fc73342b32ea5E830E26C18b44Ea7422578eb | 无 |
| ExitGasPool | 0xd15c68d980B3Acce0121e52d0D55C73A79e2F3F2 | 无 |
| AgentReputation | 0x62c3DC9947FD2f566E62C55d815847B9d5747624 | 无 |
| EmergencyIntervention | 0xc402F9FF6591265A8A5f7Ac79577AC713a7Af94C | 无 |

## 验证步骤

1. 访问 https://qng.meerscan.io/verifyContract
2. 输入合约地址
3. 选择 Compiler: Solidity (Single file / Multi-part files)
4. 上传源代码（contracts 目录下所有 .sol 文件）
5. 设置编译参数：
   - Compiler version: v0.8.20+commit.unknown
   - Optimization: Yes, 200 runs
   - viaIR: Yes
6. 输入构造函数参数（ABI-encoded）
7. 提交验证

## ABI-encoded 构造函数参数

### LicenseNFT
地址参数: 0xD8b299b5D236bCC251531531267FB4C433bd2245
ABI-encoded: `000000000000000000000000d8b299b5d236bcc251531531267fb4c433bd2245`

其他合约无构造函数参数。

## 源代码位置
`/root/.openclaw/workspace/echo/deploy-scripts/contracts/`

## 验证包
已打包为 verification-package.tar.gz
