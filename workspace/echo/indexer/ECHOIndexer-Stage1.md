# ECHO Indexer Prototype

## 阶段一：简化版（只监听3个事件，出度计数）

### 目标
- 监听 Qitmeer QNG Mainnet 上 ECHO v0.4 合约事件
- 输出：节点出度计数 + 四权快照 + 编排图谱
- 供前端 Mock 数据使用

### 技术栈
- ethers.js v6
- Node.js 18+
- Qitmeer RPC: https://qng.rpc.qitmeer.io

## 事件签名（已锁定）

```javascript
// NodeCreated(bytes32 indexed nodeId, address indexed creator, bytes32 indexed parentNode, uint8 usageRight, uint8 deriveRight, uint8 expandRight, uint8 benefitRight)
const NODE_CREATED_TOPIC = ethers.id("NodeCreated(bytes32,address,bytes32,uint8,uint8,uint8,uint8)");

// QuadrantSet(bytes32 indexed nodeId, uint8 usageRight, uint8 deriveRight, uint8 expandRight, uint8 benefitRight)
const QUADRANT_SET_TOPIC = ethers.id("QuadrantSet(bytes32,uint8,uint8,uint8,uint8)");

// EdgeDeclared(bytes32 indexed fromNode, bytes32 indexed toNode, uint8 edgeType)
const EDGE_DECLARED_TOPIC = ethers.id("EdgeDeclared(bytes32,bytes32,uint8)");
```

## 数据结构

```typescript
interface NodeRecord {
  nodeId: string;
  creator: string;
  parentNode: string;        // 0x0 = 创世
  fourRights: {
    usage: number;    // 0|1|2
    derive: number;   // 0|1|2
    expand: number;   // 0|1|2
    benefit: number;  // 0|1|2
  };
  outDegree: number;          // 被引用次数
  inDegree: number;           // 引用他人次数
  edges: EdgeRecord[];
  createdAt: number;         // blockNumber
  updatedAt: number;          // blockNumber
}

interface EdgeRecord {
  fromNode: string;
  toNode: string;
  edgeType: number;  // 1=继述/花, 2=重构/实, 3=融合/空, 4=映射/风
  declaredAt: number; // blockNumber
}
```

## 核心逻辑

```javascript
class ECHOIndexer {
  constructor(rpcUrl, contractAddress, fromBlock) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.contractAddress = contractAddress;
    this.fromBlock = fromBlock;
    this.nodes = new Map(); // nodeId -> NodeRecord
    this.edges = new Map(); // edgeId -> EdgeRecord
  }

  async scan() {
    const latestBlock = await this.provider.getBlockNumber();
    const logs = await this.provider.getLogs({
      address: this.contractAddress,
      fromBlock: this.fromBlock,
      toBlock: latestBlock,
      topics: [
        [NODE_CREATED_TOPIC, QUADRANT_SET_TOPIC, EDGE_DECLARED_TOPIC]
      ]
    });

    for (const log of logs) {
      await this.processLog(log);
    }
  }

  async processLog(log) {
    const topic = log.topics[0];
    const data = log.data;
    const blockNumber = log.blockNumber;

    switch(topic) {
      case NODE_CREATED_TOPIC:
        this.processNodeCreated(log, blockNumber);
        break;
      case QUADRANT_SET_TOPIC:
        this.processQuadrantSet(log, blockNumber);
        break;
      case EDGE_DECLARED_TOPIC:
        this.processEdgeDeclared(log, blockNumber);
        break;
    }
  }

  processNodeCreated(log, blockNumber) {
    const nodeId = log.topics[1]; // indexed
    const creator = ethers.getAddress("0x" + log.topics[2].slice(26)); // indexed
    const parentNode = log.topics[3]; // indexed
    const data = ethers.AbiCoder.defaultAbiCoder().decode(
      ["uint8", "uint8", "uint8", "uint8"],
      log.data
    );

    const node = {
      nodeId,
      creator,
      parentNode: parentNode === ethers.zeroPadValue("0x00", 32) ? null : parentNode,
      fourRights: {
        usage: data[0],
        derive: data[1],
        expand: data[2],
        benefit: data[3]
      },
      outDegree: 0,
      inDegree: 0,
      edges: [],
      createdAt: blockNumber,
      updatedAt: blockNumber
    };

    this.nodes.set(nodeId, node);
  }

  processQuadrantSet(log, blockNumber) {
    const nodeId = log.topics[1]; // indexed
    const data = ethers.AbiCoder.defaultAbiCoder().decode(
      ["uint8", "uint8", "uint8", "uint8"],
      log.data
    );

    const node = this.nodes.get(nodeId);
    if (node) {
      node.fourRights = {
        usage: data[0],
        derive: data[1],
        expand: data[2],
        benefit: data[3]
      };
      node.updatedAt = blockNumber;
    }
  }

  processEdgeDeclared(log, blockNumber) {
    const fromNode = log.topics[1]; // indexed
    const toNode = log.topics[2];   // indexed
    const data = ethers.AbiCoder.defaultAbiCoder().decode(
      ["uint8"],
      log.data
    );
    const edgeType = data[0];

    const edge = {
      fromNode,
      toNode,
      edgeType,
      declaredAt: blockNumber
    };

    const edgeId = ethers.keccak256(ethers.concat([fromNode, toNode]));
    this.edges.set(edgeId, edge);

    // 更新出度/入度
    const from = this.nodes.get(fromNode);
    const to = this.nodes.get(toNode);
    if (to) {
      to.outDegree++; // toNode 被 fromNode 引用，出度+1
      to.edges.push(edge);
    }
    if (from) {
      from.inDegree++; // fromNode 引用了 toNode，入度+1
    }
  }

  exportGraph() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      summary: {
        totalNodes: this.nodes.size,
        totalEdges: this.edges.size,
        topNodesByOutDegree: Array.from(this.nodes.values())
          .sort((a, b) => b.outDegree - a.outDegree)
          .slice(0, 10)
      }
    };
  }
}
```

## 使用方式

```javascript
const indexer = new ECHOIndexer(
  "https://qng.rpc.qitmeer.io",
  "0x63016360C0A68Fad0529B85a320c94117994c56a", // CreatorConfig
  17796114 // 部署区块号
);

await indexer.scan();
const graph = indexer.exportGraph();
console.log(JSON.stringify(graph, null, 2));
```

## 待确认（21:00 对齐会）

1. `NodeCreated` 的 `parentNode` 语义：0x0 = 创世节点？
2. `QuadrantSet` 是覆盖全量还是增量更新？
3. `EdgeDeclared` 的 `edgeType` 映射到六相：1=继述/花, 2=重构/实, 3=融合/空, 4=映射/风
4. 时间戳：是否需要 `blockNumber` 或 `block.timestamp` 算公示期？
5. 合约地址确认：`CreatorConfig` 是 `0x63016360C0A68Fad0529B85a320c94117994c56a`？

## 下一步（阶段二）

- 完整势位引擎（递归 + 环检测 + 衰减）
- The Graph Subgraph（如果 Qitmeer 支持）
- 实时推送（ethers.js `provider.on`）
