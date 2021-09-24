import "@nomiclabs/hardhat-waffle";
import '@typechain/hardhat'
import { task } from "hardhat/config";
import { HardhatUserConfig } from "hardhat/config";

// import './tasks/populate';

const config: HardhatUserConfig = {
  // Your type-safe config goes here
  solidity: {
    version: "0.7.6"
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      // hardfork: "berlin",
      accounts: [
        // from/deployer is default the first address in accounts
        {
          privateKey: '0x044C7963E9A89D4F8B64AB23E02E97B2E00DD57FCB60F316AC69B77135003AEF',
          balance: '100000000000000000000',
        },
        // user1 in tests
        {
          privateKey: '0x523170AAE57904F24FFE1F61B7E4FF9E9A0CE7557987C2FC034EACB1C267B4AE',
          balance: '100000000000000000000',
        },
        // user2 in tests
        {
          privateKey: '0x67195c963ff445314e667112ab22f4a7404bad7f9746564eb409b9bb8c6aed32',
          balance: '100000000000000000000',
        },
      ],
    }
  },
  // typechain: {
  //   outDir: 'types',
  //   target: 'ethers-v5',
  //   alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
  //   // externalArtifacts: ['externalArtifacts/*.json'], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
  // },
};

export default config;


// Network stuff for later

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
// export default {
//   solidity: "0.8.4",
//   // networks: {
//   //   hardhat: {
//   //     // accounts: {
//   //     //   accountsBalance: "10",
//   //     // },
//   //     forking: {
//   //       enabled: true,
//   //       url: "https://xdai-archive.blockscout.com/",
//   //       blockNumber: 17615631, //17615631
//   //     },
//   //   },
//   // },
// };
