import { ethers } from 'hardhat';

(async () => {
  try {
    let _totalSupply: number = 100;
    let _mintPriceGWei: number = 1000_000;
    let _mintStart: number = Math.ceil(Date.now() / 1000) + 60;
    let _presale: number = 1;
    let _publicsale: number = 60 * 60 * 24 * 366 + 60 * 60;

    const nft = await ethers.deployContract('AzukiDemo', [
      _totalSupply,
      _mintPriceGWei,
      _mintStart,
      _presale,
      _publicsale,
    ]);

    await nft.waitForDeployment();

    console.log(
      'arguments:',
      _totalSupply,
      _mintPriceGWei,
      _mintStart,
      _presale,
      _publicsale
    );

    console.log(`Deployed at ${await nft.getAddress()}`);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
})();
