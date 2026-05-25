const ethers = require('ethers');
const RPC = 'https://qng.rpc.qitmeer.io';
const PRIVKEY = '0x2bfb…91a1';
const AGENTJURY_ADDR = '0x8b8F8B8f354b4D09c659E6c287a7258A728fb72D';
const provider = new ethers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(PRIVKEY, provider);

async function test() {
  const block = await provider.getBlockNumber();
  console.log('current block:', block, '(deadline was 2696614)');
  
  // Try reveal with salt as string
  const sel = '0x7b5016f9';
  const param = ethers.solidityPacked(['uint256', 'bool', 'uint256'], [0, true, BigInt(123)]).slice(2);
  
  console.log('Calling juryReveal(0, true, 123)...');
  try {
    const tx = await wallet.sendTransaction({ to: AGENTJURY_ADDR, data: sel + param, gasLimit: 300000 });
    const receipt = await tx.wait();
    console.log('status:', receipt.status === 1 ? 'SUCCESS' : 'FAILED');
    if (receipt.status !== 1) {
      console.log('revert - modifier let it through but reveal failed (mismatch)');
    }
  } catch(e) {
    console.log('error:', e.message);
  }
}
test().catch(e => console.error(e.message));
