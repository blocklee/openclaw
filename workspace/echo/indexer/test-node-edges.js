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
  
  console.log('Node 0 edges:', graph.nodes[0].edges);
  console.log('Node 0 edges[0] keys:', Object.keys(graph.nodes[0].edges[0]));
  
  function hasBigInt(obj) {
    if (obj === null || obj === undefined) return false;
    if (typeof obj === 'bigint') return true;
    if (Array.isArray(obj)) return obj.some(hasBigInt);
    if (typeof obj === 'object') return Object.values(obj).some(hasBigInt);
    return false;
  }
  
  console.log('Node 0 has BigInt:', hasBigInt(graph.nodes[0]));
  console.log('Node 0 edges has BigInt:', hasBigInt(graph.nodes[0].edges));
}

test().catch(console.error);
