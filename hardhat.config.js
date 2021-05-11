require('@eth-optimism/hardhat-ovm');
require('@eth-optimism/plugins/hardhat/compiler');
require('@eth-optimism/plugins/hardhat/ethers');
require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle');
require("@tenderly/hardhat-tenderly");

module.exports = {
  mocha: {
    timeout: 300000,
  },
  networks: {
    rinkeby: {
      url: "http://3.85.224.26:8545",
      chainId: 28,
      gasPrice: 0,
      ovm: true,
    },
    local: {
      url: "http://localhost:8545",
      chainId: 28,
      gasPrice: 0,
      ovm: true,
      accounts: {
        mnemonic:"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
      }
    }
  },
  solidity: {
    compilers: [
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1
          }
        }
      },
    ],

  },
};
