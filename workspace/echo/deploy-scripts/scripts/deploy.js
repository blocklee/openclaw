const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const CreatorConfig = await ethers.getContractFactory("CreatorConfig");
  const cc = await CreatorConfig.deploy(deployer.address);
  await cc.waitForDeployment();

  const EdgeDeclaration = await ethers.getContractFactory("EdgeDeclaration");
  const ed = await EdgeDeclaration.deploy(await cc.getAddress());
  await ed.waitForDeployment();

  const DeadlockInspector = await ethers.getContractFactory("DeadlockInspector");
  const di = await DeadlockInspector.deploy(await cc.getAddress(), await ed.getAddress());
  await di.waitForDeployment();

  const MilestoneEscrow = await ethers.getContractFactory("MilestoneEscrow");
  const me = await MilestoneEscrow.deploy(deployer.address);
  await me.waitForDeployment();

  console.log("CreatorConfig:", await cc.getAddress());
  console.log("EdgeDeclaration:", await ed.getAddress());
  console.log("DeadlockInspector:", await di.getAddress());
  console.log("MilestoneEscrow:", await me.getAddress());
}

main().catch(e => { console.error(e); process.exitCode = 1; });
