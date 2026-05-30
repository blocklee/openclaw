# ECHO 协议游戏集成方案 — 《势位之战》

**Talus 交付 | 2026-05-29**

---

## 一、核心映射关系

| 游戏概念 | ECHO协议对应 |
|----------|-------------|
| 玩家铸造卡牌 | CreatorConfig.createNode() → 节点创建 |
| 卡牌四权（用/衍/扩/益）| Node的四权字段 (usage/derive/expand/benefit) |
| 牌组编排 | EdgeDeclaration.declareEdge() → 边创建 |
| 对战分账 | MilestoneEscrow.releaseMilestone() → 自动分账 |
| 六相气候态 | PhaseTransition事件 → phase值(0-5) |
| 势位计算 | /api/potential → 实时读链上四权+出度入度 |

---

## 二、SDK接入方案（2小时内交付）

**技术栈**: Node.js + ethers.js

**现有合约ABI**（已部署）:
- CreatorConfig: 0x1C2f10Df5a07b4bfa8D189C5c65EE5748Ba2AEf2
- EdgeDeclaration: 0xC54e...3C4a
- DeadlockInspectorP1: 0x4d233b2eB46f0Cd1b968Dc542dafC894B47d0b9F
- MilestoneEscrow: 0x4DE4...0721

**SDK核心接口**:

```javascript
const ethers = require('ethers');
const ABI = require('./echo-abis.json'); // 4合约ABI合并

const provider = new ethers.JsonRpcProvider('https://qng.rpc.meerfans.club');

const CreatorConfig = new ethers.Contract(
  '0x1C2f10Df5a07b4bfa8D189C5c65EE5748Ba2AEf2',
  ABI.CreatorConfig,
  provider
);

// 1. 创建卡牌节点
async function mintCard(signer, fourRights) {
  const tx = await CreatorConfig.connect(signer).createNode(
    fourRights.usage,
    fourRights.derive,
    fourRights.expand,
    fourRights.benefit
  );
  const receipt = await tx.wait();
  // 解析NodeCreated事件获取nodeId
  const event = receipt.logs.find(log => log.topics[0] === '0x4c...');
  return event.args.nodeId;
}

// 2. 编排边（卡牌编入牌组）
const EdgeDeclaration = new ethers.Contract(
  '0xC54e...3C4a', ABI.EdgeDeclaration, provider
);
async function declareEdge(signer, fromNode, toNode) {
  const tx = await EdgeDeclaration.connect(signer).declareEdge(fromNode, toNode);
  await tx.wait();
}

// 3. 读取势位
async function getPotential(nodeId) {
  const potential = await CreatorConfig.getNode(nodeId);
  return {
    usage: potential.rights[0],
    derive: potential.rights[1],
    expand: potential.rights[2],
    benefit: potential.rights[3]
  };
}
```

---

## 三、链上存证设计

### 3.1 卡牌铸造上链

```
用户铸造卡牌
  → createNode(usage, derive, expand, benefit)
  → NodeCreated事件emit(nodeId, creator, timestamp)
  → 索引器捕获 → /api/nodes更新
  → 前端显示卡牌四权
```

### 3.2 战斗结果存证

```
对战结束
  → 胜负双方权重计算
  → 编写EdgeDeclaration.declareEdge()记录对战关系
  → MilestoneEscrow.lockMilestone()锁定奖励池
  → PhaseTransition事件emit(phase=1)
  → 索引器监听 → 触发结算
  → releaseMilestone()释放奖励
```

### 3.3 贡献值记录

```
每次卡牌交互（铸造/编排/对战）
  → 写入EdgeDeclaration边列表
  → 索引器聚合 → /api/potential计算贡献权重
  → 用户获得势位提升
```

---

## 四、PhaseTransition触发逻辑

**现有MilestoneEscrow已emit的事件**:

| 操作 | phase值 | reasonCode |
|------|---------|------------|
| lockMilestone | 1 | 1 |
| releaseMilestone | 2 | 2 |
| emergencyRefund | 5 | 5 |

**游戏结算触发**:

```javascript
// 监听PhaseTransition事件
CreatorConfig.on('PhaseTransition', (nodeId, phase, reasonCode, timestamp) => {
  if (phase === 2 && reasonCode === 2) {
    // releaseMilestone触发 → 奖励已释放
    // 更新游戏状态：玩家获得分账
  }
});
```

---

## 五、D3势位图谱数据格式

/api/graph返回字段 → D3绑定映射:

```javascript
{
  id: node.nodeId,           // 节点唯一标识
  shiPosition: node.shiPosition, // x坐标(0-10000)
  phase: node.phase,        // 颜色(0-5=6种气候态)
  depth: node.depth,        // y坐标(纵向深度)
  edgeCount: node.outDegree + node.inDegree, // 节点度数
  fourRights: node.fourRights  // 卡牌四权
}

edges: [{
  source: edge.fromNode,    // 边起点
  target: edge.toNode,      // 边终点
  edgeType: edge.depth >= 3 ? 2 : edge.depth >= 2 ? 1 : 0  // 边样式
}]
```

---

## 六、交付时间线

| 里程碑 | 时间 | 产出 |
|--------|------|------|
| SDK接入方案 | 2小时内 | Node.js调用4合约的代码模板 |
| 链上存证文档 | 12小时内 | 本文档 |
| 原型集成 | 2天内 | 可运行的铸造+编排+分账Demo |

---

## 七、技术约束

1. **不重复造轮子**: 复用现有4个P1合约，不新部署游戏合约
2. **链上存证**: 所有关键操作通过事件上链，不可篡改
3. **实时势位**: /api/potential读链上数据，不做本地计算
4. **预言机**: 直接用链上PhaseTransition事件，不依赖外部预言机
