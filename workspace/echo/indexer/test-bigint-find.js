const { ECHOIndexer } = require('./echo-indexer-p0.js');

const indexer = new ECHOIndexer(
  'https://qng.rpc.qitmeer.io',
  {
    creatorConfig: '0x41BC79f909D8e6Cd132Bf46247f9b230FE7FBc3F',
    edgeDeclaration: '0xC54e1B665c61b2Dc9831dc5a1C4D22670bea3C4a',
    deadlockInspector: '0xCA9DF1149F663892F9957d622BE5dE6Efa08115D',
    milestoneEscrow: '0x4DE4cFD213a528D0b387564675AdAaC969AF0721'
  },
  2704379
);

async function test() {
  const graph = await indexer.scan();
  
  // Find all BigInt fields
  function findBigInt(obj, path = '') {
    if (obj === null || obj === undefined) return;
    if (typeof obj === 'bigint') {
      console.log(`BigInt found at: ${path} = ${obj}`);
      return;
    }
    if (Array.isArray(obj)) {
      obj.forEach((item, i) => findBigInt(item, `${path}[${i}]`));
    } else if (typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        findBigInt(value, `${path}.${key}`);
      });
    }
  }
  
  console.log('=== Searching for BigInt in nodes ===');
  graph.nodes.forEach((node, i) => {
    console.log(`\nNode ${i}:`);
    findBigInt(node, `nodes[${i}]`);
  });
  
  console.log('\n=== Searching for BigInt in edges ===');
  graph.edges.forEach((edge, i) => {
    console.log(`\nEdge ${i}:`);
    findBigInt(edge, `edges[${i}]`);
  });
}

test().catch(console.error);
