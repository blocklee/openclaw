const { ethers } = require('ethers');
const fs = require('fs');

const RPC = 'https://qng.rpc.qitmeer.io';
const CHAIN_ID = 813;

const CONTRACTS = {
  CreatorConfig: '0x41BC79f909D8e6Cd132Bf46247f9b230FE7FBc3F',
  EdgeDeclaration: '0xC54e1B665c61b2Dc9831dc5a1C4D22670bea3C4a',
  DeadlockInspector: '0xCA9DF1149F663892F9957d622BE5dE6Efa08115D',
  MilestoneEscrow: '0x4DE4cFD213a528D0b387564675AdAaC969AF0721'
};

const ABI = {
  CreatorConfig: [
    'function createNode(bytes32 nodeId, uint8[4] calldata rights) external',
    'function updateQuadrant(bytes32 nodeId, uint8[4] calldata rights) external',
    'function getNode(bytes32 nodeId) external view returns (address, uint256, uint8[4] memory)',
    'function exists(bytes32 nodeId) external view returns (bool)',
    'event NodeCreated(bytes32 indexed nodeId, address indexed creator, uint256 timestamp, uint8 usageRight, uint8 deriveRight, uint8 expandRight, uint8 benefitRight)',
    'event QuadrantSet(bytes32 indexed nodeId, uint8 usageRight, uint8 deriveRight, uint8 expandRight, uint8 benefitRight)'
  ],
  EdgeDeclaration: [
    'function declareEdge(bytes32 fromNode, bytes32 toNode, uint256 depth) external',
    'function getEdges(bytes32 fromNode) external view returns (Edge[] memory)',
    'function hasEdge(bytes32 fromNode, bytes32 toNode) external view returns (bool)',
    'struct Edge { bytes32 toNode; address declarer; uint256 depth; uint256 timestamp; }',
    'event EdgeDeclared(bytes32 indexed fromNode, bytes32 indexed toNode, address indexed declarer, uint256 depth, uint256 timestamp)'
  ],
  MilestoneEscrow: [
    'function lockMilestone(bytes32 projectId, uint8 milestoneCount) external payable',
    'function releaseMilestone(bytes32 projectId, uint8 milestone) external',
    'function getMilestoneInfo(bytes32 projectId) external view returns (address, uint256, uint8, uint8, bool)',
    'event MilestoneLocked(bytes32 indexed projectId, uint256 amount, uint8 milestoneCount, uint256 timestamp)',
    'event MilestoneReleased(bytes32 indexed projectId, uint256 amount, uint8 milestone, uint256 timestamp)',
    'event EmergencyRefund(bytes32 indexed projectId, uint256 amount, uint256 timestamp)'
  ]
};

async function main() {
  const key = fs.readFileSync('/root/.openclaw/workspace/echo/.deployer-key-new', 'utf8').trim();
  const wallet = new ethers.Wallet(key, new ethers.JsonRpcProvider(RPC, CHAIN_ID));
  
  console.log('Deployer:', wallet.address);
  const balance = await wallet.provider.getBalance(wallet.address);
  console.log('Balance:', ethers.formatEther(balance), 'MEER');

  const cc = new ethers.Contract(CONTRACTS.CreatorConfig, ABI.CreatorConfig, wallet);
  const ed = new ethers.Contract(CONTRACTS.EdgeDeclaration, ABI.EdgeDeclaration, wallet);
  const me = new ethers.Contract(CONTRACTS.MilestoneEscrow, ABI.MilestoneEscrow, wallet);

  // Create test nodes
  const nodeIds = [
    ethers.id('node-1'),
    ethers.id('node-2'),
    ethers.id('node-3'),
    ethers.id('node-4'),
    ethers.id('node-5')
  ];

  const rights = [2, 1, 1, 1]; // usage=2, derive=1, expand=1, benefit=1

  for (let i = 0; i < nodeIds.length; i++) {
    const exists = await cc.exists(nodeIds[i]);
    if (!exists) {
      console.log(`Creating node ${i + 1}...`);
      const tx = await cc.createNode(nodeIds[i], rights);
      await tx.wait();
      console.log(`  TX: ${tx.hash}`);
    } else {
      console.log(`Node ${i + 1} already exists`);
    }
  }

  // Declare edges (node-1 -> node-2, node-2 -> node-3, etc.)
  for (let i = 0; i < nodeIds.length - 1; i++) {
    const hasEdge = await ed.hasEdge(nodeIds[i], nodeIds[i + 1]);
    if (!hasEdge) {
      console.log(`Declaring edge ${i + 1} -> ${i + 2}...`);
      const tx = await ed.declareEdge(nodeIds[i], nodeIds[i + 1], 1);
      await tx.wait();
      console.log(`  TX: ${tx.hash}`);
    } else {
      console.log(`Edge ${i + 1} -> ${i + 2} already exists`);
    }
  }

  // Lock a milestone
  const projectId = ethers.id('project-1');
  try {
    const exists = await me.projectExists(projectId);
    if (!exists) {
      console.log('Locking milestone...');
      const tx = await me.lockMilestone(projectId, 3, { value: ethers.parseEther('0.01') });
      await tx.wait();
      console.log(`  TX: ${tx.hash}`);
    } else {
      console.log('Milestone already locked');
    }
  } catch (e) {
    console.log('Milestone lock skipped:', e.message);
  }

  console.log('\nAll test transactions completed!');
  console.log('Run indexer scan to see events.');
}

main().catch(e => { console.error(e); process.exit(1); });
