import { ethers } from 'hardhat';
import fs from 'fs';
import path from 'path';

(async () => {
  try {
    const nftAddress: string = fs
      .readFileSync(path.resolve('private', '.nftAddress'))
      .toString()
      .trim();

    const marketplace = await ethers.deployContract('NFTMarketPlace', [
      nftAddress,
    ]);

    await marketplace.waitForDeployment();

    console.log('arguments:', nftAddress);

    console.log(`Deployed at ${await marketplace.getAddress()}`);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
})();
