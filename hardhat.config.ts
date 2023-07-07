import fs from 'fs';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import path from 'path';

const INFURA_API_KEY = fs
  .readFileSync(path.resolve('private', '.infura'))
  .toString()
  .trim();
const ETHERSCAN_API_KEY = fs
  .readFileSync(path.resolve('private', '.etherscan'))
  .toString()
  .trim();
const mnemonic = fs
  .readFileSync(path.resolve('private', '.secret'))
  .toString()
  .trim();

const config: HardhatUserConfig = {
  solidity: '0.8.18',
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: {
        mnemonic,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 10,
      },
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};

export default config;
