import { reset, time } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { TypedEventLog } from '../typechain-types/common';

describe('Offerring', () => {
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE'));
  const ADMIN_ROLE =
    '0x0000000000000000000000000000000000000000000000000000000000000000';
  let _totalSupply: number = 5;
  let _mintPriceGWei: number = 8;
  let _mintStart: number = Math.round(Date.now() / 1000) + 60;
  let _presale: number = 60 * 60;
  let _publicsale: number = 60 * 60;

  const transferArgs = {
    from: 0,
    to: 1,
    tokenId: 2,
  };

  let deployContract = async () => {
    const [owner, otherAccount, anotherAccount, ...accounts] =
      await ethers.getSigners();

    const AzukiDemo = await ethers.getContractFactory('AzukiDemo');
    const Offerring = await ethers.getContractFactory('Offerring');
    const nft = await AzukiDemo.deploy(
      _totalSupply,
      _mintPriceGWei,
      _mintStart,
      _presale,
      _publicsale
    );
    const offerring = await Offerring.deploy(nft);
    await time.increaseTo(_mintStart);

    return { offerring, nft, owner, otherAccount, anotherAccount, accounts };
  };

  afterEach(async () => {
    await reset();
  });

  describe('placeOffer()', async () => {
    it('should place an offer when invoked', async () => {
      const { offerring, nft, owner, otherAccount, anotherAccount } =
        await deployContract();
      const offer: number = 100;

      await offerring.placeOffer({ value: offer });
      const result = await offerring.offers(owner);

      expect(result).to.equal(BigInt(offer));
    });

    it('should increase totalNumOfOffers field by one', async () => {
      const { offerring, nft, owner, otherAccount, anotherAccount } =
        await deployContract();
      const offer: number = 100;

      const before = await offerring.totalNumOfOffers();
      await offerring.placeOffer({ value: offer });
      const after = await offerring.totalNumOfOffers();

      expect(after).to.equal(before + BigInt(1));
    });

    it('should emit OfferPlaced event when invoked', async () => {
      const { offerring, nft, owner, otherAccount, anotherAccount } =
        await deployContract();

      const offer: number = 100;

      const txResult = await offerring.placeOffer({ value: offer });
      expect(txResult)
        .emit(offerring, 'OfferPlaced')
        .withArgs(nft, owner, offer);
    });

    it('should throw an exception if account has placed an offer', async () => {
      const { offerring, nft, owner, otherAccount, anotherAccount } =
        await deployContract();

      const offer: number = 100;
      await offerring.placeOffer({ value: offer });

      await expect(offerring.placeOffer({ value: offer })).be.rejectedWith(
        'Cannot place more than one offer rather change your offer'
      );
    });

    it('should throw an exception if offer is 0', async () => {
      const { offerring, nft, owner, otherAccount, anotherAccount } =
        await deployContract();

      await expect(offerring.placeOffer({ value: 0 })).be.rejectedWith(
        'Offer must be > 0'
      );
    });
  });

  describe('updateOffer()', () => {
    it('', () => {});
  });
});
