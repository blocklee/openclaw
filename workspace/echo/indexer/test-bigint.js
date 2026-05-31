const { ECHOIndexer } = require('./echo-indexer-p0.js');
const { cleanBigInt } = require('./echo-data-api.js');

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
  console.log('Raw graph nodes:', graph.nodes.length);
  console.log('Raw graph edges:', graph.edges.length);
  
  // Check for BigInt
  function hasBigInt(obj) {
    if (obj === null || obj === undefined) return false;
    if (typeof obj === 'bigint') return true;
    if (Array.isArray(obj)) return obj.some(hasBigInt);
    if (typeof obj === 'object') return Object.values(obj).some(hasBigInt);
    return false;
  }
  
  console.log('Has BigInt in nodes:', hasBigInt(graph.nodes));
  console.log('Has BigInt in edges:', hasBigInt(graph.edges));
  
  if (graph.nodes.length > 0) {
    console.log('First node keys:', Object.keys(graph.nodes[0]));
    console.log('First node timestamp type:', typeof graph.nodes[0].timestamp);
  }
  if (graph.edges.length > 0) {
    console.log('First edge keys:', Object.keys(graph.edges[0]));
    console.log('First edge depth type:', typeof graph.edges[0].depth);
  }
  
  // Test cleanBigInt
  const cleaned = cleanBigInt(graph);
  console.log('Cleaned successfully:', !!cleaned);
  
  // Test JSON stringify
  try {
    const json = JSON.stringify(cleaned);
    console.log('JSON stringify success:', json.length > 0);
  } catch (e) {
    console.log('JSON stringify error:', e.message);
  }
}

test().catch(console.error);
