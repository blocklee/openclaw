const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.QNG_RPC_URL || "https://qng.rpc.qitmeer.io";

async function deployContract(name, wallet, ...args) {
  console.log(`\n部署 ${name}...`);
  const artifactPath = path.join(__dirname, "artifacts", "contracts", `${name}.sol`, `${name}.json`);
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  
  const contract = await factory.deploy(...args);
  console.log(`  交易哈希:`, contract.deploymentTransaction().hash);
  console.log(`  等待确认...`);
  
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`✅ ${name}: ${address}`);
  return contract;
}

async function main() {
  if (!PRIVATE_KEY) {
    console.error("❌ 请设置 PRIVATE_KEY");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL, { 
    name: "qngMainnet", 
    chainId: 813 
  });
  
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log("═══════════════════════════════════════════════");
  console.log("ECHO DeadlockInspectorP1 部署");
  console.log("═══════════════════════════════════════════════");
  console.log("部署账户:", wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("账户余额:", ethers.formatEther(balance), "MEER");

  try {
    const edgeDeclarationAddress = "0xC54e1B665c61b2Dc9831dc5a1C4D22670bea3C4a";
    const deadlockInspector = await deployContract("DeadlockInspectorP1", wallet, edgeDeclarationAddress);
    const deadlockInspectorAddress = await deadlockInspector.getAddress();

    console.log("\n═══════════════════════════════════════════════");
    console.log("✅ DeadlockInspectorP1 部署完成！");
    console.log("═══════════════════════════════════════════════");
    console.log("\n合约地址:");
    console.log(`DeadlockInspectorP1: ${deadlockInspectorAddress}`);
    console.log(`\n✅ 部署完成`);
    
  } catch (error) {
    console.error("\n❌ 部署失败:", error.message);
    if (error.transaction) {
      console.error("交易哈希:", error.transaction.hash);
    }
    process.exit(1);
  }
}

main();
