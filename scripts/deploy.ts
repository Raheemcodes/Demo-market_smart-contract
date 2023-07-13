import { ethers } from 'hardhat';

(async () => {
  try {
    let _totalSupply: number = 50;
    let _mintPriceGWei: number = 8;
    let _mintStart: number = Math.ceil(Date.now() / 1000) + 60;
    let _presale: number = 60 * 5;
    let _publicsale: number = 60 * 60;

    const nft = await ethers.deployContract('AzukiTrans', [
      _totalSupply,
      _mintPriceGWei,
      _mintStart,
      _presale,
      _publicsale,
    ]);

    console.log(
      _totalSupply,
      _mintPriceGWei,
      _mintStart,
      _presale,
      _publicsale
    );

    await nft.waitForDeployment();

    console.log(`Deployed at ${await nft.getAddress()}`);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
})();
