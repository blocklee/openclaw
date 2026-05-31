require('dotenv').config();
const { ethers } = require('ethers');

// Qitmeer QNG Mainnet
const provider = new ethers.JsonRpcProvider('https://qng.rpc.qitmeer.io/');
const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const transfers = [
  { to: '0x93A3690890f3B0c01641e74fF10aE68E906F282a', amount: '2.0', name: 'Seaman_bot' },
  { to: '0x77F96f747baB6E25a76c32d325F34eE94A666604', amount: '1.0', name: '猫先森' },
];

async function main() {
  const deployerAddress = await deployer.getAddress();
  const balance = await provider.getBalance(deployerAddress);
  console.log('Deployer:', deployerAddress);
  console.log('Balance:', ethers.formatEther(balance), 'MEER');
  console.log('');

  for (const t of transfers) {
    try {
      const tx = await deployer.sendTransaction({
        to: t.to,
        value: ethers.parseEther(t.amount)
      });
      console.log(`[${t.name}] TX sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`[${t.name}] Confirmed! Block: ${receipt.blockNumber}`);
    } catch (e) {
      console.log(`[${t.name}] FAILED: ${e.message}`);
    }
    console.log('');
  }
}

main().catch(console.error);
