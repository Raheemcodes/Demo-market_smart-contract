import { expect } from 'chai';
import { reset, time } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { ethers } from 'hardhat';
import safeMint from './helper/safemint.helper';

describe('NFTMarketPlace', () => {
  let _totalSupply: number = 5;
  let _mintPriceGWei: number = 8;
  let _mintStart: number = Math.round(Date.now() / 1000) + 60;
  let _presale: number = 60 * 60;
  let _publicsale: number = 60 * 60;

  let deployContract = async () => {
    const [owner, otherAccount, anotherAccount, ...accounts] =
      await ethers.getSigners();

    const AzukiDemo = await ethers.getContractFactory('AzukiDemo');
    const NFTMarketPlace = await ethers.getContractFactory('NFTMarketPlace');
    const nft = await AzukiDemo.deploy(
      _totalSupply,
      _mintPriceGWei,
      _mintStart,
      _presale,
      _publicsale
    );
    const marketplace = await NFTMarketPlace.deploy(nft);
    await time.increaseTo(_mintStart + _presale);

    return { marketplace, nft, owner, otherAccount, anotherAccount, accounts };
  };

  afterEach(async () => {
    await reset();
  });

  describe('list()', () => {
    it('should set price for token in lists mapping', async () => {
      const { marketplace, nft, owner, otherAccount, anotherAccount } =
        await deployContract();

      const price: number = 3000;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      await marketplace.list(Number(tokenId), price);
      const listPrice = await marketplace.getPrice(owner, Number(tokenId));

      expect(price).to.equal(listPrice);
    });

    it('should increase totalTokenListed of List struct by one', async () => {
      const { marketplace, nft, owner, otherAccount, anotherAccount } =
        await deployContract();

      const price: number = 3000;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      const totalTokenListed = await marketplace.getMyTotalListedToken();
      await marketplace.list(Number(tokenId), price);
      const newTotalTokenListed = await marketplace.getMyTotalListedToken();

      expect(newTotalTokenListed).to.equal(totalTokenListed + BigInt(1));
    });

    it('should increase the base totalTokenListed', async () => {
      const { marketplace, nft, owner, otherAccount, anotherAccount } =
        await deployContract();

      const price: number = 3000;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      const totalTokenListed = await marketplace.getTotalListedToken();
      await marketplace.list(Number(tokenId), price);
      const newTotalTokenListed = await marketplace.getTotalListedToken();

      expect(newTotalTokenListed).to.equal(totalTokenListed + BigInt(1));
    });

    it('should emit ListCreated event', async () => {
      const { marketplace, nft, owner, otherAccount, anotherAccount } =
        await deployContract();

      const price: number = 3000;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      const tx = await marketplace.list(Number(tokenId), price);

      expect(tx)
        .emit(marketplace, 'ListCreated')
        .withArgs(nft, owner, tokenId, price);
    });

    it('should throw an exception if caller is not token owner', async () => {
      const { marketplace, nft, owner, otherAccount, anotherAccount } =
        await deployContract();

      const price: number = 3000;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);

      await expect(
        marketplace.connect(otherAccount).list(Number(tokenId), price)
      ).to.be.rejectedWith("You're not the owner of this token");
    });

    it('should throw an exception if token owner has not approved this contract', async () => {
      const { marketplace, nft, owner, otherAccount, anotherAccount } =
        await deployContract();

      const price: number = 3000;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);

      await expect(marketplace.list(Number(tokenId), price)).to.be.rejectedWith(
        'This contract is not approved to transfer this token'
      );
    });

    it('should throw an eception if token is listed', async () => {
      const { marketplace, nft, owner, otherAccount, anotherAccount } =
        await deployContract();

      const price: number = 3000;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      await marketplace.list(Number(tokenId), price);

      await expect(marketplace.list(Number(tokenId), price)).to.be.rejectedWith(
        'Token has already been listed'
      );
    });

    it('should throw an exception if price <= 0', async () => {
      const { marketplace, nft, owner, otherAccount, anotherAccount } =
        await deployContract();

      const price: number = 0;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);

      await expect(marketplace.list(Number(tokenId), price)).to.be.rejectedWith(
        'List price must be > 0'
      );
    });
  });
});
