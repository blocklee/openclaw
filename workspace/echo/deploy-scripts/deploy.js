// ECHO v0.4 Qitmeer Mainnet 部署脚本（增强日志版）
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
  
  const gasEstimate = await factory.getDeployTransaction(...args);
  console.log(`  预估 gas:`, gasEstimate);
  
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
  console.log("ECHO v0.4 Qitmeer Mainnet 部署");
  console.log("═══════════════════════════════════════════════");
  console.log("部署账户:", wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("账户余额:", ethers.formatEther(balance), "MEER");

  if (balance < ethers.parseEther("0.5")) {
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
    // 1. GovernanceDAO
    const governanceDAO = await deployContract("GovernanceDAO", wallet);
    const daoAddress = await governanceDAO.getAddress();
    deploymentInfo.contracts.GovernanceDAO = daoAddress;
    const daoMin = await governanceDAO.daoMinMembers();
    console.log("   daoMinMembers:", daoMin.toString());

    // 2. AgentJury
    const agentJury = await deployContract("AgentJury", wallet, daoAddress);
    const juryAddress = await agentJury.getAddress();
    deploymentInfo.contracts.AgentJury = juryAddress;

    // 3. LicenseNFT
    const licenseNFT = await deployContract("LicenseNFT", wallet);
    deploymentInfo.contracts.LicenseNFT = await licenseNFT.getAddress();

    // 4. CreatorConfig
    const creatorConfig = await deployContract("CreatorConfig", wallet);
    deploymentInfo.contracts.CreatorConfig = await creatorConfig.getAddress();

    // 5. PotentialEngine
    const potentialEngine = await deployContract("PotentialEngine", wallet);
    const engineAddress = await potentialEngine.getAddress();
    deploymentInfo.contracts.PotentialEngine = engineAddress;

    // 6. ExitGasPool
    const exitGasPool = await deployContract("ExitGasPool", wallet);
    deploymentInfo.contracts.ExitGasPool = await exitGasPool.getAddress();

    // 7. AgentReputation
    const agentReputation = await deployContract("AgentReputation", wallet);
    deploymentInfo.contracts.AgentReputation = await agentReputation.getAddress();

    // 8. EmergencyIntervention
    const emergency = await deployContract("EmergencyIntervention", wallet);
    const emergencyAddress = await emergency.getAddress();
    deploymentInfo.contracts.EmergencyIntervention = emergencyAddress;

    // 9. 配置关系
    console.log("\n[9/9] 配置合约关系...");
    try {
      const tx1 = await governanceDAO.setEmergencyContract(emergencyAddress);
      await tx1.wait();
      console.log("✅ emergencyContract 已设置");
      
      const tx2 = await governanceDAO.setPotentialEngine(engineAddress);
      await tx2.wait();
      console.log("✅ potentialEngine 已设置");
    } catch (e) {
      console.log("⚠️ 配置跳过:", e.message);
    }

    // 保存结果
    const filename = `deployment-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n═══════════════════════════════════════════════");
    console.log("✅ ECHO v0.4 部署完成！");
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
