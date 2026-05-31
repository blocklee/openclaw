const { run } = require("hardhat");

const contracts = [
  { name: "AgentReputation", address: "0x62c3DC9947FD2f566E62C55d815847B9d5747624", args: [] },
  { name: "GovernanceDAO", address: "0x07E0FFCA344f846B499C811CE3127F5f3BFAd0b7", args: [] },
  { name: "AgentJury", address: "0x8b8F8B8f354b4D09c659E6c287a7258A728fb72D", args: [] },
  { name: "CreatorConfig", address: "0x63016360C0A68Fad0529B85a320c94117994c56a", args: [] },
  { name: "PotentialEngine", address: "0x6D1fc73342b32ea5E830E26C18b44Ea7422578eb", args: [] },
  { name: "ExitGasPool", address: "0xd15c68d980B3Acce0121e52d0D55C73A79e2F3F2", args: [] },
  { name: "EmergencyIntervention", address: "0xc402F9FF6591265A8A5f7Ac79577AC713a7Af94C", args: [] },
  { name: "LicenseNFT", address: "0x34980A52885F78F75840F36AA6Cd6F06a8FEBA28", args: ["0xD8b299b5D236bCC251531531267FB4C433bd2245"] }
];

async function verifyAll() {
  console.log("Starting ECHO v0.4 contract verification on QNG Mainnet...\n");

  for (const { name, address, args } of contracts) {
    try {
      console.log(`Verifying ${name} at ${address}...`);
      await run("verify:verify", {
        address,
        constructorArguments: args,
        contract: `contracts/${name}.sol:${name}`
      });
      console.log(`✅ ${name} verified successfully!\n`);
    } catch (err) {
      if (err.message.includes("Already Verified")) {
        console.log(`⚠️ ${name} already verified.\n`);
      } else {
        console.error(`❌ ${name} failed:`, err.message, "\n");
      }
    }
  }

  console.log("Verification process complete.");
  console.log("Check status at: https://qng.meerscan.io/");
}

verifyAll().catch(console.error);
