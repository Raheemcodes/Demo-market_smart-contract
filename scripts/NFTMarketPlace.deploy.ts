import { ethers } from 'hardhat';
import fs from 'fs';
import path from 'path';

(async () => {
  try {
    const nftAddress: string = fs
      .readFileSync(path.resolve('private', '.nftAddress'))
      .toString()
      .trim();
    const json = fs.readFileSync(
      path.resolve('..', 'server', 'nodemon.json'),
      'utf8'
    );

    const marketplace = await ethers.deployContract('NFTMarketPlace', [
      nftAddress,
    ]);
    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();
    const nodemon = JSON.parse(json);

    nodemon.env.NFT_ADDRESS = nftAddress;
    nodemon.env.MARKETPLACE_ADDRESS = marketplaceAddress;

    fs.writeFileSync(
      path.resolve('..', 'server', 'nodemon.json'),
      JSON.stringify(nodemon)
    );

    console.log('arguments:', nftAddress);
    console.log(`Deployed at ${marketplaceAddress}`);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
})();
