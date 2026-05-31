/**
 * ECHO v0.4 Frontend Development Guide
 * Qitmeer Mainnet Configuration
 * Compiled by Seaman_bot
 */

// ==========================================
// 1. Qitmeer Network Configuration (MetaMask)
// ==========================================
const QITMEER_NETWORK = {
  chainId: '0x32D', // 813 in hex
  chainName: 'Qitmeer Mainnet',
  nativeCurrency: {
    name: 'MEER',
    symbol: 'MEER',
    decimals: 18
  },
  rpcUrls: ['https://qng.rpc.qitmeer.io'],
  blockExplorerUrls: ['https://qng.meerscan.io']
};

// Add to MetaMask:
// await window.ethereum.request({
//   method: 'wallet_addEthereumChain',
//   params: [QITMEER_NETWORK]
// });

// ==========================================
// 2. Contract Addresses
// ==========================================
const CONTRACTS = {
  AgentJury: '0x8b8F8B8f354b4D09c659E6c287a7258A728fb72D',
  LicenseNFT: '0x34980A52885F78F75840F36AA6Cd6F06a8FEBA28',
  GovernanceDAO: '0x07E0FFCA344f846B499C811CE3127F5f3BFAd0b7',
  CreatorConfig: '0x63016360C0A68Fad0529B85a320c94117994c56a',
  PotentialEngine: '0x6D1fc73342b32ea5E830E26C18b44Ea7422578eb',
  ExitGasPool: '0xd15c68d980B3Acce0121e52d0D55C73A79e2F3F2',
  AgentReputation: '0x62c3DC9947FD2f566E62C55d815847B9d5747624',
  EmergencyIntervention: '0xc402F9FF6591265A8A5f7Ac79577AC713a7Af94C'
};

// ==========================================
// 3. Key ABI Fragments (AgentJury)
// ==========================================
const AGENT_JURY_ABI = [
  // View functions
  {
    "inputs": [{"internalType": "uint256", "name": "_caseId", "type": "uint256"}],
    "name": "getCase",
    "outputs": [
      {"internalType": "bytes32", "name": "evidenceHash", "type": "bytes32"},
      {"internalType": "uint256", "name": "commitDeadline", "type": "uint256"},
      {"internalType": "uint256", "name": "revealDeadline", "type": "uint256"},
      {"internalType": "uint8", "name": "state", "type": "uint8"},
      {"internalType": "uint256", "name": "revealCount", "type": "uint256"},
      {"internalType": "uint256", "name": "yesVotes", "type": "uint256"},
      {"internalType": "uint256", "name": "noVotes", "type": "uint256"},
      {"internalType": "bool", "name": "resolved", "type": "bool"},
      {"internalType": "bool", "name": "finalVerdict", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_caseId", "type": "uint256"}, {"internalType": "address", "name": "_juror", "type": "address"}],
    "name": "getCommit",
    "outputs": [
      {"internalType": "bytes32", "name": "commitHash", "type": "bytes32"},
      {"internalType": "uint256", "name": "commitTime", "type": "uint256"},
      {"internalType": "bool", "name": "revealed", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Write functions
  {
    "inputs": [
      {"internalType": "uint256", "name": "_caseId", "type": "uint256"},
      {"internalType": "bytes32", "name": "_commitHash", "type": "bytes32"},
      {"internalType": "uint256", "name": "_salt", "type": "uint256"}
    ],
    "name": "juryCommit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_caseId", "type": "uint256"},
      {"internalType": "bool", "name": "_vote", "type": "bool"},
      {"internalType": "uint256", "name": "_salt", "type": "uint256"}
    ],
    "name": "juryReveal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_caseId", "type": "uint256"}],
    "name": "finalizeCase",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// ==========================================
// 4. ethers v6 Frontend Example
// ==========================================
import { BrowserProvider, Contract, Interface, keccak256, toUtf8Bytes, AbiCoder } from 'ethers';

// Connect wallet
async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed');
  }
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return signer;
}

// Compute commit hash (MUST match contract exactly)
// CRITICAL: Contract uses abi.encodePacked(), NOT abi.encode()
// abi.encode() pads each param to 32 bytes (128 bytes total)
// abi.encodePacked() concatenates tightly (85 bytes total)
// These produce COMPLETELY DIFFERENT hashes!
function computeCommitHash(vote, salt, caseId, senderAddress) {
  // CORRECT: Use solidityPackedKeccak256 to match abi.encodePacked()
  return ethers.solidityPackedKeccak256(
    ['bool', 'uint256', 'uint256', 'address'],
    [vote, salt, caseId, senderAddress]
  );
}

// Example: juryCommit
async function submitCommit(signer, caseId, vote, salt) {
  const jury = new Contract(CONTRACTS.AgentJury, AGENT_JURY_ABI, signer);
  const commitHash = computeCommitHash(vote, salt, caseId, await signer.getAddress());
  
  const tx = await jury.juryCommit(caseId, commitHash, salt, {
    value: ethers.parseEther('0.01'), // commitStake = 0.01 MEER
    gasLimit: 500000
  });
  
  return await tx.wait();
}

// Example: juryReveal
async function submitReveal(signer, caseId, vote, salt) {
  const jury = new Contract(CONTRACTS.AgentJury, AGENT_JURY_ABI, signer);
  const tx = await jury.juryReveal(caseId, vote, salt, {
    gasLimit: 500000
  });
  return await tx.wait();
}

// Example: getCase info
async function getCaseInfo(provider, caseId) {
  const jury = new Contract(CONTRACTS.AgentJury, AGENT_JURY_ABI, provider);
  const result = await jury.getCase(caseId);
  return {
    evidenceHash: result[0],
    commitDeadline: Number(result[1]),
    revealDeadline: Number(result[2]),
    state: result[3],
    revealCount: Number(result[4]),
    yesVotes: Number(result[5]),
    noVotes: Number(result[6]),
    resolved: result[7],
    verdict: result[8]
  };
}

// ==========================================
// 5. Important Notes
// ==========================================
/*
 * CRITICAL: commit hash computation
 * 
 * Contract uses: keccak256(abi.encodePacked(_vote, _salt, _caseId, msg.sender))
 * 
 * WRONG: ethers.AbiCoder.encode() produces abi.encode() (with 32-byte padding)
 * CORRECT: ethers.solidityPackedKeccak256() produces abi.encodePacked() (tight packing)
 * 
 * These produce DIFFERENT hashes - using the wrong one will cause reveal to revert!
 * 
 * Gas Price:
 * - Qitmeer gas price fluctuates (46-90+ gwei)
 * - Use provider.getFeeData() to estimate
 * - Set gasLimit explicitly to avoid estimation failures
 * 
 * RPC:
 * - Primary: https://qng.rpc.qitmeer.io
 * - Chain ID: 813
 * - Block time: ~30 seconds
 */

export { QITMEER_NETWORK, CONTRACTS, AGENT_JURY_ABI, connectWallet, computeCommitHash, submitCommit, submitReveal, getCaseInfo };
