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
  
  console.log("开始部署 PredictionMarket 合约...");
  console.log("RPC:", RPC_URL);
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log("部署账户:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("账户余额:", ethers.formatEther(balance), "MEER");
  
  // 7个Agent选项
  const agentOptions = [
    "雨娃",
    "猫先森", 
    "Seaman_bot",
    "Talus",
    "X7",
    "王岚的智能助手",
    "Amanda_AI助理"
  ];
  
  console.log("Agent选项:", agentOptions);
  
  // 部署 PredictionMarket
  const predictionMarket = await deployContract("PredictionMarket", wallet, agentOptions);
  const predictionMarketAddress = await predictionMarket.getAddress();
  
  // 验证 - 获取Agent选项
  const options = await predictionMarket.getAgentOptions();
  console.log("已设置Agent选项:", options);
  
  // 创建第一轮测试
  console.log("\n创建第一轮预测...");
  const createTx = await predictionMarket.createRound(
    "下一个 milestone 由哪个 Agent 达成？",
    24 * 60 * 60 // 24小时
  );
  await createTx.wait();
  
  const round = await predictionMarket.getRound(1);
  console.log("第一轮创建成功:");
  console.log("  问题:", round.question);
  console.log("  开始时间:", new Date(Number(round.startTime) * 1000).toISOString());
  console.log("  结束时间:", new Date(Number(round.endTime) * 1000).toISOString());
  console.log("  选项数:", round.options.length);
  
  // 保存部署信息
  const deploymentInfo = {
    network: "qngMainnet",
    deployer: wallet.address,
    predictionMarket: predictionMarketAddress,
    txHash: predictionMarket.deploymentTransaction().hash,
    agentOptions: options,
    timestamp: Date.now()
  };
  
  const outputPath = path.join(__dirname, "deployment-prediction-market.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n部署信息已保存:", outputPath);
  
  console.log("\n部署完成！");
  console.log("合约地址:", predictionMarketAddress);
  console.log("浏览器查看: https://qng.qitmeer.io/address/" + predictionMarketAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("部署失败:", error);
    process.exit(1);
  });