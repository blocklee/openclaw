const ethers = require('ethers');
const { keccak256, solidityPacked } = require('ethers');

const RPC = 'https://qng.rpc.qitmeer.io';
const PRIVKEY = '0x2bfbc52311b4481c1a39c61428109b78c2be0829aeda055dee68b6c40b4e91a1';
const AGENTJURY = '0x8b8F8B8f354b4D09c659E6c287a7258A728fb72D';

const provider = new ethers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(PRIVKEY, provider);

async function reveal() {
  console.log('Revealing Case 3...');
  console.log('wallet:', wallet.address);
  
  const block = await provider.getBlockNumber();
  console.log('current block:', block, '(revealDeadline 2697563)');
  
  // My correct reveal params from earlier:
  // juryReveal(3, true, 5678901) - I voted true with salt 5678901
  const caseId = 3;
  const vote = true;
  const salt = BigInt(5678901);
  
  // Check my commit first
  const commitHashStored = 'placeholder';
  
  // juryReveal selector: 7b5016f9
  const sel = '0x7b5016f9';
  const param = ethers.solidityPacked(['uint256', 'bool', 'uint256'], [caseId, vote, salt]).slice(2);
  
  console.log('Calling juryReveal(3, true, 5678901)...');
  
  const tx = await wallet.sendTransaction({
    to: AGENTJURY,
    data: sel + param,
    gasLimit: 300000
  });
  
  console.log('tx:', tx.hash);
  
  // Wait for confirmation
  const receipt = await tx.wait();
  console.log('status:', receipt.status === 1 ? 'SUCCESS' : 'FAILED');
  
  if (receipt.status !== 1) {
    // Parse error
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() === AGENTJURY.toLowerCase()) {
        console.log('Event data:', log.data);
      }
    }
  }
}

reveal().catch(e => console.error('Error:', e.message));
