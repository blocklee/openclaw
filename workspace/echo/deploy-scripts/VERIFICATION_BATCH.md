# ECHO v0.4 合约批量验证脚本（Blockscout API）

## 合约列表

| 合约 | 地址 | 构造函数参数 |
|------|------|-------------|
| AgentReputation | 0x62c3DC9947FD2f566E62C55d815847B9d5747624 | 无 |
| GovernanceDAO | 0x07E0FFCA344f846B499C811CE3127F5f3BFAd0b7 | 无 |
| AgentJury | 0x8b8F8B8f354b4D09c659E6c287a7258A728fb72D | 无 |
| CreatorConfig | 0x63016360C0A68Fad0529B85a320c94117994c56a | 无 |
| PotentialEngine | 0x6D1fc73342b32ea5E830E26C18b44Ea7422578eb | 无 |
| ExitGasPool | 0xd15c68d980B3Acce0121e52d0D55C73A79e2F3F2 | 无 |
| EmergencyIntervention | 0xc402F9FF6591265A8A5f7Ac79577AC713a7Af94C | 无 |
| LicenseNFT | 0x34980A52885F78F75840F36AA6Cd6F06a8FEBA28 | 0xD8b299b5D236bCC251531531267FB4C433bd2245 |

## 编译参数
- Compiler: Solidity v0.8.20+commit.a1b79de6
- viaIR: true
- Optimizer: enabled, 200 runs
- EVM Version: shanghai
- License: MIT (type: 3)

## 验证 API
```bash
curl -X POST "https://qng.qitmeer.io/api/v2/smart-contracts/{address}/verification/via/flattened-code" \
  -H "Content-Type: application/json" \
  -d '{
    "compiler_version": "v0.8.20+commit.a1b79de6",
    "source_code": "<flattened_source>",
    "is_optimization_enabled": true,
    "optimization_runs": 200,
    "evm_version": "shanghai",
    "constructor_args": "<hex_args_or_empty>",
    "autodetect_constructor_args": true,
    "license_type": "3"
  }'
```

## LicenseNFT 构造函数 ABI-encoded
000000000000000000000000d8b299b5d236bcc251531531267fb4c433bd2245

## 源码位置
Flattened sources: `/tmp/{ContractName}_flat.sol`
原始源码: `/root/.openclaw/workspace/echo/deploy-scripts/contracts/`
