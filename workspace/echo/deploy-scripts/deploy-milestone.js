const { ethers } = require("ethers");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.QNG_RPC_URL || "https://qng.rpc.qitmeer.io";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL, { name: "qngMainnet", chainId: 813 });
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  const artifactPath = require("path").join(__dirname, "artifacts", "contracts", "MilestoneEscrow.sol", "MilestoneEscrow.json");
  const artifact = JSON.parse(require("fs").readFileSync(artifactPath, "utf8"));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  
  const contract = await factory.deploy(wallet.address);
  console.log("交易哈希:", contract.deploymentTransaction().hash);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("MilestoneEscrow:", address);
}

main().catch(console.error);
