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
    console.error("错误: PRIVATE_KEY 未设置");
    process.exit(1);
  }
  
  console.log("开始部署 CardNFT + BattleGame 合约...");
  console.log("RPC:", RPC_URL);
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log("部署账户:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("账户余额:", ethers.formatEther(balance), "MEER");
  
  // ECHO 合约地址
  const CREATOR_CONFIG = '0x41BC79f909D8e6Cd132Bf46247f9b230FE7FBc3F';
  const EDGE_DECLARATION = '0xC54e1B665c61b2Dc9831dc5a1C4D22670bea3C4a';
  const MILESTONE_ESCROW = '0x1C2f10Df5a07b4bfa8D189C5c65EE5748Ba2AEf2';
  
  // 1. 部署 CardNFT
  const cardNFT = await deployContract("CardNFT", wallet, CREATOR_CONFIG, EDGE_DECLARATION);
  const cardNFTAddress = await cardNFT.getAddress();
  
  // 2. 部署 BattleGame
  const battleGame = await deployContract("BattleGame", wallet, cardNFTAddress, EDGE_DECLARATION, MILESTONE_ESCROW);
  const battleGameAddress = await battleGame.getAddress();
  
  // 保存部署信息
  const deploymentInfo = {
    network: "qngMainnet",
    deployer: wallet.address,
    cardNFT: cardNFTAddress,
    battleGame: battleGameAddress,
    echoContracts: {
      creatorConfig: CREATOR_CONFIG,
      edgeDeclaration: EDGE_DECLARATION,
      milestoneEscrow: MILESTONE_ESCROW
    },
    cardNFTTx: cardNFT.deploymentTransaction().hash,
    battleGameTx: battleGame.deploymentTransaction().hash,
    timestamp: Date.now()
  };
  
  const outputPath = path.join(__dirname, "deployment-card-battle.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n部署信息已保存:", outputPath);
  
  // 验证余额
  const finalBalance = await provider.getBalance(wallet.address);
  console.log("\n部署后余额:", ethers.formatEther(finalBalance), "MEER");
  console.log("消耗:", ethers.formatEther(balance - finalBalance), "MEER");
  
  console.log("\n部署完成！");
  console.log("CardNFT:", cardNFTAddress);
  console.log("BattleGame:", battleGameAddress);
  console.log("浏览器:");
  console.log("  CardNFT: https://qng.qitmeer.io/address/" + cardNFTAddress);
  console.log("  BattleGame: https://qng.qitmeer.io/address/" + battleGameAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("部署失败:", error);
    process.exit(1);
  });