/**
 * ECHO Mock 数据生成器
 * 为前端并行开发提供结构一致的 Mock 数据
 * 格式与真实索引器输出一致，前端可直接切换
 */

const ethers = require('ethers');

// 生成随机 bytes32
function randomBytes32() {
  return ethers.hexlify(ethers.randomBytes(32));
}

// 生成随机地址
function randomAddress() {
  return ethers.Wallet.createRandom().address;
}

// 生成 Mock 节点
function generateMockNode(index, parentNode = null) {
  const nodeId = randomBytes32();
  const creator = randomAddress();
  
  // 四权配置：用权=1(社群) 衍权=2(开放) 扩权=2(自由) 益权=2(分成)
  const fourRights = {
    usage: 1,
    derive: 2,
    expand: 2,
    benefit: 2
  };

  return {
    nodeId,
    creator,
    parentNode: parentNode || ethers.zeroPadValue("0x00", 32),
    fourRights,
    outDegree: 0,
    inDegree: 0,
    edges: [],
    createdAt: Date.now() - Math.floor(Math.random() * 86400000), // 过去24h内
    updatedAt: Date.now()
  };
}

// 生成 Mock 边
function generateMockEdge(fromNode, toNode, edgeType = 1) {
  return {
    fromNode,
    toNode,
    edgeType, // 1=继述/花
    declaredAt: Date.now()
  };
}

// 生成完整 Mock 图谱
function generateMockGraph(nodeCount = 7, edgeCount = 12) {
  const nodes = [];
  const edges = [];
  
  // 生成节点
  const rootNode = generateMockNode(0, null);
  rootNode.fourRights = { usage: 1, derive: 2, expand: 2, benefit: 2 };
  nodes.push(rootNode);
  
  for (let i = 1; i < nodeCount; i++) {
    const parent = nodes[Math.floor(Math.random() * nodes.length)];
    const node = generateMockNode(i, parent.nodeId);
    nodes.push(node);
  }
  
  // 生成边（确保DAG，无环）
  for (let i = 0; i < edgeCount; i++) {
    const fromIdx = Math.floor(Math.random() * nodes.length);
    const toIdx = Math.floor(Math.random() * nodes.length);
    
    // 避免自环和反向引用（确保DAG）
    if (fromIdx !== toIdx && fromIdx < toIdx) {
      const edge = generateMockEdge(
        nodes[fromIdx].nodeId,
        nodes[toIdx].nodeId,
        Math.floor(Math.random() * 4) + 1 // 1-4
      );
      edges.push(edge);
      
      // 更新出度/入度
      nodes[toIdx].outDegree++;
      nodes[fromIdx].inDegree++;
      nodes[toIdx].edges.push(edge);
    }
  }
  
  return {
    nodes: nodes.map(n => ({
      nodeId: n.nodeId,
      creator: n.creator,
      parentNode: n.parentNode,
      fourRights: n.fourRights,
      outDegree: n.outDegree,
      inDegree: n.inDegree,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt
    })),
    edges: edges.map(e => ({
      fromNode: e.fromNode,
      toNode: e.toNode,
      edgeType: e.edgeType,
      declaredAt: e.declaredAt
    })),
    summary: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      topNodesByOutDegree: nodes
        .sort((a, b) => b.outDegree - a.outDegree)
        .slice(0, 5)
        .map(n => ({
          nodeId: n.nodeId,
          outDegree: n.outDegree,
          creator: n.creator
        }))
    }
  };
}

// 输出 Mock 数据
if (require.main === module) {
  const mockGraph = generateMockGraph(7, 12);
  console.log(JSON.stringify(mockGraph, null, 2));
}

module.exports = { generateMockGraph, generateMockNode, generateMockEdge };
