import { ethers } from 'hardhat';

(async () => {
  try {
    let _totalSupply: number = 3;
    let _mintPriceGWei: number = 8;
    let _mintStart: number = +new Date('3000-07-24') / 1000;
    let _publicSale: number = _mintStart + 60 * 60;
    let _mintEnd: number = _publicSale + 60 * 60;

    const nft = await ethers.deployContract('MyTestToken', [
      _totalSupply,
      _mintPriceGWei,
      _mintStart,
      _publicSale,
      _mintEnd,
    ]);
    await nft.waitForDeployment();

    console.log(`Deployed at ${await nft.getAddress()}`);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
})();
