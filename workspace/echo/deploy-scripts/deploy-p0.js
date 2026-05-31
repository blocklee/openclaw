// ECHO P0 Qitmeer Mainnet 部署脚本
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
  console.log("ECHO P0 Qitmeer Mainnet 部署");
  console.log("═══════════════════════════════════════════════");
  console.log("部署账户:", wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("账户余额:", ethers.formatEther(balance), "MEER");

  if (balance < ethers.parseEther("0.1")) {
    console.error("余额不足");
    process.exit(1);
  }

  const deploymentInfo = {
    network: "qngMainnet",
    chainId: 813,
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    contracts: {}
  };

  try {
    // 1. CreatorConfig
    const creatorConfig = await deployContract("CreatorConfig", wallet, wallet.address);
    const ccAddress = await creatorConfig.getAddress();
    deploymentInfo.contracts.CreatorConfig = ccAddress;

    // 2. EdgeDeclaration
    const edgeDeclaration = await deployContract("EdgeDeclaration", wallet, ccAddress);
    const edAddress = await edgeDeclaration.getAddress();
    deploymentInfo.contracts.EdgeDeclaration = edAddress;

    // 3. DeadlockInspector
    const deadlockInspector = await deployContract("DeadlockInspector", wallet, ccAddress, edAddress);
    const diAddress = await deadlockInspector.getAddress();
    deploymentInfo.contracts.DeadlockInspector = diAddress;

    // 4. MilestoneEscrow
    const milestoneEscrow = await deployContract("MilestoneEscrow", wallet, wallet.address);
    const meAddress = await milestoneEscrow.getAddress();
    deploymentInfo.contracts.MilestoneEscrow = meAddress;

    // 保存结果
    const filename = `deployment-p0-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n═══════════════════════════════════════════════");
    console.log("✅ ECHO P0 部署完成！");
    console.log("═══════════════════════════════════════════════");
    console.log("\n合约地址:");
    for (const [name, addr] of Object.entries(deploymentInfo.contracts)) {
      console.log(`${name}: ${addr}`);
      console.log(`  https://qng.meerscan.io/address/${addr}`);
    }
    console.log(`\n✅ 部署信息已保存: ${filename}`);
    
  } catch (error) {
    console.error("\n❌ 部署失败:", error.message);
    if (error.transaction) {
      console.error("交易哈希:", error.transaction.hash);
    }
    process.exit(1);
  }
}

main();
