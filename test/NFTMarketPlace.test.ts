import { reset, time } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';

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

    const NFTDemo = await ethers.getContractFactory('NFTDemo');
    const NFTMarketPlace = await ethers.getContractFactory('NFTMarketPlace');
    const nft = await NFTDemo.deploy(
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
      const { marketplace, nft, owner } = await deployContract();

      const price: number = 3000;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      await marketplace.list(Number(tokenId), price);
      const listPrice = await marketplace.getPrice(owner, Number(tokenId));

      expect(price).to.equal(listPrice);
    });

    it('should increase totalTokenListed of List struct by one', async () => {
      const { marketplace, nft, owner } = await deployContract();

      const price: number = 3000;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      const totalTokenListed = await marketplace.getMyTotalListedToken();
      await marketplace.list(Number(tokenId), price);
      const newTotalTokenListed = await marketplace.getMyTotalListedToken();

      expect(newTotalTokenListed).to.equal(totalTokenListed + BigInt(1));
    });

    it('should increase the base totalTokenListed', async () => {
      const { marketplace, nft, owner } = await deployContract();

      const price: number = 3000;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      const totalTokenListed = await marketplace.getTotalListedToken();
      await marketplace.list(Number(tokenId), price);
      const newTotalTokenListed = await marketplace.getTotalListedToken();

      expect(newTotalTokenListed).to.equal(totalTokenListed + BigInt(1));
    });

    it('should emit ListCreated event', async () => {
      const { marketplace, nft, owner } = await deployContract();

      const price: number = 3000;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      const tx = await marketplace.list(Number(tokenId), price);

      expect(tx)
        .emit(marketplace, 'ListCreated')
        .withArgs(owner, tokenId, price);
    });

    it('should throw an exception if caller is not token owner', async () => {
      const { marketplace, nft, owner, otherAccount } = await deployContract();

      const price: number = 3000;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);

      await expect(
        marketplace.connect(otherAccount).list(Number(tokenId), price)
      ).to.be.rejectedWith("You're not the owner of this token");
    });

    it('should throw an exception if token owner has not approved this contract', async () => {
      const { marketplace, nft, owner } = await deployContract();

      const price: number = 3000;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);

      await expect(marketplace.list(Number(tokenId), price)).to.be.rejectedWith(
        'This contract is not approved to transfer this token'
      );
    });

    it('should throw an eception if token is listed', async () => {
      const { marketplace, nft, owner } = await deployContract();

      const price: number = 3000;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      await marketplace.list(Number(tokenId), price);

      await expect(marketplace.list(Number(tokenId), price)).to.be.rejectedWith(
        'Token has already been listed'
      );
    });

    it('should throw an exception if price <= 0', async () => {
      const { marketplace, nft, owner } = await deployContract();

      const price: number = 0;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);

      await expect(marketplace.list(Number(tokenId), price)).to.be.rejectedWith(
        'List price must be > 0'
      );
    });
  });

  describe('changeListPrice()', () => {
    it('should change token list price', async () => {
      const { marketplace, nft, owner } = await deployContract();

      const price: number = 10;
      const newPrice: number = 100;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      await marketplace.list(Number(tokenId), price);
      await marketplace.changeListPrice(Number(tokenId), newPrice);
      const listPrice = await marketplace.getPrice(owner, Number(tokenId));

      expect(newPrice).to.equal(listPrice);
    });

    it('should emit ListUpdated event', async () => {
      const { marketplace, nft, owner } = await deployContract();

      const price: number = 10;
      const newPrice: number = 100;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      await marketplace.list(Number(tokenId), price);
      const tx = await marketplace.changeListPrice(Number(tokenId), newPrice);

      expect(tx)
        .emit(marketplace, 'ListUpdated')
        .withArgs(owner, tokenId, newPrice);
    });

    it('should not change the state of totalTokenListed within seller List struct', async () => {
      const { marketplace, nft, owner } = await deployContract();

      const price: number = 10;
      const newPrice: number = 100;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      await marketplace.list(Number(tokenId), price);
      const before = await marketplace.getMyTotalListedToken();
      await marketplace.changeListPrice(Number(tokenId), newPrice);
      const after = await marketplace.getMyTotalListedToken();

      expect(before).to.equal(after);
    });

    it('should not change the state of base totalTokenListed', async () => {
      const { marketplace, nft, owner } = await deployContract();

      const price: number = 10;
      const newPrice: number = 100;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      await marketplace.list(Number(tokenId), price);
      const before = await marketplace.getTotalListedToken();
      await marketplace.changeListPrice(Number(tokenId), newPrice);
      const after = await marketplace.getTotalListedToken();

      expect(before).to.equal(after);
    });

    it('should throw an exception if caller is not token owner', async () => {
      const { marketplace, nft, owner, otherAccount } = await deployContract();

      const price: number = 3000;
      const newPrice: number = 10;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      await marketplace.list(Number(tokenId), price);

      await expect(
        marketplace
          .connect(otherAccount)
          .changeListPrice(Number(tokenId), newPrice)
      ).to.be.rejectedWith("You're not the owner of this token");
    });

    it('should throw an exception if contract is not approve to transfer token', async () => {
      const { marketplace, nft, owner } = await deployContract();

      const price: number = 3000;
      const newPrice: number = 10;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      await marketplace.list(Number(tokenId), price);
      await nft.connect(owner).setApprovalForAll(marketplace, false);

      await expect(
        marketplace.connect(owner).changeListPrice(Number(tokenId), newPrice)
      ).to.be.rejectedWith(
        'This contract is not approved to transfer this token'
      );
    });

    it('should throw an exception if token is not listed', async () => {
      const { marketplace, nft, owner } = await deployContract();

      const price: number = 10;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);

      await expect(
        marketplace.connect(owner).changeListPrice(Number(tokenId), price)
      ).to.be.rejectedWith('Token is not listed');
    });

    it('should throw an exception if price <= 0', async () => {
      const { marketplace, nft, owner } = await deployContract();

      const price: number = 3000;
      const newPrice: number = 0;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      await marketplace.list(Number(tokenId), price);

      await expect(
        marketplace.connect(owner).changeListPrice(Number(tokenId), newPrice)
      ).to.be.rejectedWith('List price must be > 0');
    });

    it('should throw an exception if entered price is same as list price', async () => {
      const { marketplace, nft, owner } = await deployContract();

      const price: number = 10;
      const newPrice: number = 10;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      await marketplace.list(Number(tokenId), price);

      await expect(
        marketplace.connect(owner).changeListPrice(Number(tokenId), newPrice)
      ).to.be.rejectedWith('Entered price already set');
    });
  });

  describe('unlist()', () => {
    it('should reset List price to default', async () => {
      const { marketplace, nft, owner } = await deployContract();

      const price: number = 10;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      await marketplace.list(Number(tokenId), price);
      await marketplace.connect(owner).unlist(Number(tokenId));
      const listPrice = await marketplace.getPrice(owner, Number(tokenId));

      expect(listPrice).to.equal(0);
    });

    it('should reduce totalTokenListed in List strut by one', async () => {
      const { marketplace, nft, owner } = await deployContract();

      const price: number = 10;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      await marketplace.list(Number(tokenId), price);
      const totalTokenListed = await marketplace.getMyTotalListedToken();
      await marketplace.connect(owner).unlist(Number(tokenId));
      const newTotalTokenListed = await marketplace.getMyTotalListedToken();

      expect(newTotalTokenListed).to.equal(totalTokenListed - BigInt(1));
    });

    it('should reduce base totalTokenListed by one', async () => {
      const { marketplace, nft, owner } = await deployContract();

      const price: number = 10;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      await marketplace.list(Number(tokenId), price);
      const totalTokenListed = await marketplace.getTotalListedToken();
      await marketplace.connect(owner).unlist(Number(tokenId));
      const newTotalTokenListed = await marketplace.getTotalListedToken();

      expect(newTotalTokenListed).to.equal(totalTokenListed - BigInt(1));
    });

    it('should emit ListRemoved event', async () => {
      const { marketplace, nft, owner } = await deployContract();

      const price: number = 10;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      await marketplace.list(Number(tokenId), price);
      const tx = await marketplace.connect(owner).unlist(Number(tokenId));

      expect(tx).emit(marketplace, 'ListRemoved').withArgs(owner, tokenId);
    });

    it('should throw an exception if not the token owner', async () => {
      const { marketplace, nft, owner, otherAccount } = await deployContract();

      const price: number = 10;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      await marketplace.list(Number(tokenId), price);

      await expect(
        marketplace.connect(otherAccount).unlist(Number(tokenId))
      ).to.be.rejectedWith("You're not the owner of this token");
    });

    it('should throw an exception if contract is not approved to transfer token', async () => {
      const { marketplace, nft, owner } = await deployContract();

      const price: number = 10;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      await marketplace.list(Number(tokenId), price);
      await nft.connect(owner).setApprovalForAll(marketplace, false);

      await expect(
        marketplace.connect(owner).unlist(Number(tokenId))
      ).to.be.rejectedWith(
        'This contract is not approved to transfer this token'
      );
    });

    it('should throw an exception if token is not listed', async () => {
      const { marketplace, nft, owner } = await deployContract();

      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);

      await expect(
        marketplace.connect(owner).unlist(Number(tokenId))
      ).to.be.rejectedWith('Token is not listed');
    });
  });

  describe('buy()', () => {
    it('should reset List price to default', async () => {
      const { marketplace, nft, owner, otherAccount } = await deployContract();

      const price: number = 10;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      await marketplace.list(Number(tokenId), price);
      await marketplace
        .connect(otherAccount)
        .buy(Number(tokenId), { value: price });
      const listPrice = await marketplace.getPrice(owner, Number(tokenId));

      expect(listPrice).to.equal(0);
    });

    it('should reduce totalTokenListed in List strut by one', async () => {
      const { marketplace, nft, owner, otherAccount } = await deployContract();

      const price: number = 10;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      await marketplace.list(Number(tokenId), price);
      const totalTokenListed = await marketplace.getMyTotalListedToken();
      await marketplace
        .connect(otherAccount)
        .buy(Number(tokenId), { value: price });
      const newTotalTokenListed = await marketplace.getMyTotalListedToken();

      expect(newTotalTokenListed).to.equal(totalTokenListed - BigInt(1));
    });

    it('should reduce base totalTokenListed by one', async () => {
      const { marketplace, nft, owner, otherAccount } = await deployContract();

      const price: number = 10;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      await marketplace.list(Number(tokenId), price);
      const totalTokenListed = await marketplace.getTotalListedToken();
      await marketplace
        .connect(otherAccount)
        .buy(Number(tokenId), { value: price });
      const newTotalTokenListed = await marketplace.getTotalListedToken();

      expect(newTotalTokenListed).to.equal(totalTokenListed - BigInt(1));
    });

    it('should transfer token ownership to buyer', async () => {
      const { marketplace, nft, owner, otherAccount } = await deployContract();
      const buyer = otherAccount;

      const price: number = 10;
      const { tokenId } = await safeMint(nft, owner, _mintPriceGWei);
      await nft.connect(owner).setApprovalForAll(marketplace, true);
      await marketplace.list(Number(tokenId), price);
      await marketplace.connect(buyer).buy(Number(tokenId), { value: price });
      const tokenOwner = await nft.ownerOf(Number(tokenId));

      expect(buyer.address).to.equal(tokenOwner);
    });

    it('should emit ListPurchased event', async () => {
      const { marketplace, nft, owner, otherAccount } = await deployContract();
      const buyer = otherAccount;
      const seller = owner;

      const price: number = 10;
      const { tokenId } = await safeMint(nft, seller, _mintPriceGWei);
      await nft.connect(seller).setApprovalForAll(marketplace, true);
      await marketplace.list(Number(tokenId), price);
      const tx = await marketplace
        .connect(buyer)
        .buy(Number(tokenId), { value: price });

      expect(tx)
        .emit(marketplace, 'ListPurchased')
        .withArgs(seller, buyer, price);
    });

    it('should throw an exception if contract is not approved to transfer token', async () => {
      const { marketplace, nft, owner, otherAccount } = await deployContract();
      const seller = owner;
      const buyer = otherAccount;

      const price: number = 10;
      const { tokenId } = await safeMint(nft, seller, _mintPriceGWei);
      await nft.connect(seller).setApprovalForAll(marketplace, true);
      await marketplace.connect(seller).list(Number(tokenId), price);
      await nft.connect(seller).setApprovalForAll(marketplace, false);

      await expect(
        marketplace.connect(buyer).buy(Number(tokenId), { value: price })
      ).to.be.rejectedWith(
        'This contract is not approved to transfer this token'
      );
    });

    it('should throw an exception if caller is token owner', async () => {
      const { marketplace, nft, owner } = await deployContract();
      const seller = owner;

      const price: number = 10;
      const { tokenId } = await safeMint(nft, seller, _mintPriceGWei);
      await nft.connect(seller).setApprovalForAll(marketplace, true);
      await marketplace.connect(seller).list(Number(tokenId), price);

      await expect(
        marketplace.connect(seller).buy(Number(tokenId), { value: price })
      ).to.be.rejectedWith("You can't buy your own nft rather unlist it");
    });

    it('should throw an exception if token is not listed', async () => {
      const { marketplace, nft, owner, otherAccount } = await deployContract();
      const buyer = otherAccount;
      const seller = owner;

      const price: number = 10;
      const { tokenId } = await safeMint(nft, seller, _mintPriceGWei);
      await nft.connect(seller).setApprovalForAll(marketplace, true);

      await expect(
        marketplace.connect(buyer).buy(Number(tokenId), { value: price })
      ).to.be.rejectedWith('Token is not listed');
    });

    it('should throw an exception if value sent is not equal to price', async () => {
      const { marketplace, nft, owner, otherAccount } = await deployContract();
      const buyer = otherAccount;
      const seller = owner;

      const price: number = 10;
      const value: number = 5;
      const { tokenId } = await safeMint(nft, seller, _mintPriceGWei);
      await nft.connect(seller).setApprovalForAll(marketplace, true);
      await marketplace.connect(seller).list(Number(tokenId), price);

      await expect(
        marketplace.connect(buyer).buy(Number(tokenId), { value })
      ).to.be.rejectedWith(`You sent ${value} wei instead of ${price} wei`);
    });
  });
});
