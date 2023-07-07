import { ethers } from 'hardhat';

(async () => {
  try {
    let _totalSupply: number = 3;
    let _mintPriceGWei: number = 8;
    let _mintStart: number = +new Date('3000-07-24') / 1000;
    let _presale: number = 60 * 60;
    let _publicsale: number = 60 * 60;

    const nft = await ethers.deployContract('MyTestToken', [
      _totalSupply,
      _mintPriceGWei,
      _mintStart,
      _presale,
      _publicsale,
    ]);
    await nft.waitForDeployment();

    console.log(`Deployed at ${await nft.getAddress()}`);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
})();
