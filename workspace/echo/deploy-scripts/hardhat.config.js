require("@nomicfoundation/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

// Qitmeer Mainnet 配置
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x" + "0".repeat(64);
const QNG_MAINNET_RPC = process.env.QNG_RPC_URL || "https://qng.rpc.qitmeer.io";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },

  networks: {
    hardhat: {
      chainId: 31337
    },

    qngMainnet: {
      url: QNG_MAINNET_RPC,
      chainId: 813,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
      gas: "auto",
      timeout: 120000
    }
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },

  etherscan: {
    apiKey: {
      qngMainnet: "empty"
    },
    customChains: [
      {
        network: "qngMainnet",
        chainId: 813,
        urls: {
          apiURL: "https://qng.qitmeer.io/api",
          browserURL: "https://qng.qitmeer.io"
        }
      }
    ]
  }
};
