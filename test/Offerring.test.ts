import { reset, time } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import safeMint from './helper/safemint.helper';

describe('Offerring', () => {
  let _totalSupply: number = 5;
  let _mintPriceGWei: number = 8;
  let _mintStart: number = Math.round(Date.now() / 1000) + 60;
  let _presale: number = 60 * 60;
  let _publicsale: number = 60 * 60;

  let deployContract = async () => {
    const [owner, otherAccount, anotherAccount, ...accounts] =
      await ethers.getSigners();

    const NFTDemo = await ethers.getContractFactory('NFTDemo');
    const Offerring = await ethers.getContractFactory('Offerring');
    const nft = await NFTDemo.deploy(
      _totalSupply,
      _mintPriceGWei,
      _mintStart,
      _presale,
      _publicsale
    );
    const offerring = await Offerring.deploy(nft);
    await time.increaseTo(_mintStart + _presale);

    return { offerring, nft, owner, otherAccount, anotherAccount, accounts };
  };

  afterEach(async () => {
    await reset();
  });

  describe('placeOffer()', async () => {
    it('should place an offer', async () => {
      const { offerring, owner } = await deployContract();
      const offer: number = 100;

      await offerring.placeOffer({ value: offer });
      const result = await offerring.getOffer(owner);

      expect(result).to.equal(BigInt(offer));
    });

    it('should increase totalNumOfOffers field by one', async () => {
      const { offerring } = await deployContract();
      const offer: number = 100;

      const before = await offerring.getTotalNumOfOffers();
      await offerring.placeOffer({ value: offer });
      const after = await offerring.getTotalNumOfOffers();

      expect(after).to.equal(before + BigInt(1));
    });

    it('should emit OfferPlaced event', async () => {
      const { offerring, nft, owner } = await deployContract();

      const offer: number = 100;

      const txResult = await offerring.placeOffer({ value: offer });
      expect(txResult).emit(offerring, 'OfferPlaced').withArgs(owner, offer);
    });

    it('should increase contract balance by price sent', async () => {
      const { offerring, nft, owner } = await deployContract();

      const offer: number = 100;
      const balanceBefore = await offerring.getBalance();
      await offerring.placeOffer({ value: offer });
      const balanceAfter = await offerring.getBalance();

      expect(balanceAfter).to.equal(balanceBefore + BigInt(offer));
    });

    it('should throw an exception if account has placed an offer', async () => {
      const { offerring } = await deployContract();

      const offer: number = 100;
      await offerring.placeOffer({ value: offer });

      await expect(offerring.placeOffer({ value: offer })).be.rejectedWith(
        'Cannot place more than one offer rather change your offer'
      );
    });

    it('should throw an exception if offer is 0', async () => {
      const { offerring } = await deployContract();

      await expect(offerring.placeOffer({ value: 0 })).be.rejectedWith(
        'Offer must be > 0'
      );
    });
  });

  describe('updateOffer()', () => {
    it('should update accounts offer with value sent', async () => {
      const { offerring, owner } = await deployContract();

      const formerOffer: number = 100;
      const newOffer: number = 200;
      await offerring.placeOffer({ value: formerOffer });
      await offerring.updateOffer({ value: newOffer });
      const result = await offerring.getOffer(owner);

      expect(newOffer).to.equal(result);
    });

    it('should not change totalNumOfOffers', async () => {
      const { offerring } = await deployContract();

      const offer: number = 100;
      const newOffer: number = 30;
      await offerring.placeOffer({ value: offer });
      const totalOffer = await offerring.getTotalNumOfOffers();
      await offerring.updateOffer({ value: newOffer });
      const newTotalOffer = await offerring.getTotalNumOfOffers();

      expect(newTotalOffer).to.equal(totalOffer);
    });

    it('should emit OfferUpdated event', async () => {
      const { offerring, nft, owner } = await deployContract();

      const formOffer: number = 100;
      const newOffer: number = 200;
      await offerring.placeOffer({ value: formOffer });
      const tx = await offerring.updateOffer({ value: newOffer });

      expect(tx)
        .emit(offerring, 'OfferUpdated')
        .withArgs(owner, formOffer, newOffer);
    });

    it('should subtract from offer from contract balance and add new offer', async () => {
      const { offerring, nft, owner } = await deployContract();

      const offer: number = 100;
      const newOffer: number = 200;
      await offerring.placeOffer({ value: offer });
      const balanceBefore = await offerring.getBalance();
      await offerring.updateOffer({ value: newOffer });
      const balanceAfter = await offerring.getBalance();

      expect(balanceAfter).to.equal(
        balanceBefore - BigInt(offer) + BigInt(newOffer)
      );
    });

    it("should throw an exception if user hasn't placed an offer", async () => {
      const { offerring } = await deployContract();

      const offer: number = 100;

      await expect(offerring.updateOffer({ value: offer })).to.be.rejectedWith(
        'No offer have been placed by this buyer'
      );
    });

    it('should throw an excetion new offer is 0', async () => {
      const { offerring } = await deployContract();

      const formerOffer: number = 100;
      const newOffer: number = 0;
      await offerring.placeOffer({ value: formerOffer });

      await expect(
        offerring.updateOffer({ value: newOffer })
      ).to.be.rejectedWith('Offer must be > 0');
    });

    it('should throw an excetion value equals offer', async () => {
      const { offerring } = await deployContract();

      const formerOffer: number = 100;
      const newOffer: number = 100;
      await offerring.placeOffer({ value: formerOffer });

      await expect(
        offerring.updateOffer({ value: newOffer })
      ).to.be.rejectedWith('Sent value is same as current offer');
    });
  });

  describe('increaseOffer()', () => {
    it('should offer by value sent', async () => {
      const { offerring, owner } = await deployContract();

      const formerOffer: number = 100;
      const extraOffer: number = 20;
      await offerring.placeOffer({ value: formerOffer });
      await offerring.increaseOffer({ value: extraOffer });
      const offer = await offerring.getOffer(owner);

      expect(offer).to.equal(formerOffer + extraOffer);
    });

    it('should not change totalNumOfOffers', async () => {
      const { offerring } = await deployContract();

      const offer: number = 100;
      const newOffer: number = 30;
      await offerring.placeOffer({ value: offer });
      const totalOffer = await offerring.getTotalNumOfOffers();
      await offerring.increaseOffer({ value: newOffer });
      const newTotalOffer = await offerring.getTotalNumOfOffers();

      expect(newTotalOffer).to.equal(totalOffer);
    });

    it('should emit OfferIncreased event', async () => {
      const { offerring, nft, owner } = await deployContract();

      const formerOffer: number = 100;
      const extraOffer: number = 20;
      await offerring.placeOffer({ value: formerOffer });
      const tx = await offerring.increaseOffer({ value: extraOffer });
      const offer = await offerring.getOffer(owner);

      expect(tx)
        .emit(offerring, 'OfferIncreased')
        .withArgs(owner, formerOffer, offer);
    });

    it('should increase  contract balance by new offer sent', async () => {
      const { offerring, nft, owner } = await deployContract();

      const offer: number = 100;
      const extraOffer: number = 20;
      await offerring.placeOffer({ value: offer });
      const balanceBefore = await offerring.getBalance();
      await offerring.increaseOffer({ value: extraOffer });
      const balanceAfter = await offerring.getBalance();

      expect(balanceAfter).to.equal(balanceBefore + BigInt(extraOffer));
    });

    it("should throw an exception if invoker hasn't placed an offer", async () => {
      const { offerring } = await deployContract();

      const extraOffer: number = 20;

      await expect(
        offerring.increaseOffer({ value: extraOffer })
      ).to.be.rejectedWith('No offer have been placed by this buyer');
    });

    it('should throw an exception if value sent if 0', async () => {
      const { offerring } = await deployContract();

      const formerOffer: number = 100;
      const extraOffer: number = 0;
      await offerring.placeOffer({ value: formerOffer });

      await expect(
        offerring.increaseOffer({ value: extraOffer })
      ).to.be.rejectedWith('Offer must be > 0');
    });
  });

  describe('reduceOfferTo()', () => {
    it('should reduce offer by value passed as argument', async () => {
      const { offerring, owner } = await deployContract();

      const from: number = 100;
      const to: number = 10;
      await offerring.placeOffer({ value: from });
      await offerring.reduceOfferTo(to);
      const offer = await offerring.getOffer(owner);

      expect(to).to.equal(offer);
    });

    it('should not change totalNumOfOffers', async () => {
      const { offerring } = await deployContract();

      const from: number = 100;
      const to: number = 10;
      await offerring.placeOffer({ value: from });
      const totalOffer = await offerring.getTotalNumOfOffers();
      await offerring.reduceOfferTo(to);
      const newTotalOffer = await offerring.getTotalNumOfOffers();

      expect(newTotalOffer).to.equal(totalOffer);
    });

    it('should emit OfferReduced event', async () => {
      const { offerring, nft, owner } = await deployContract();

      const from: number = 100;
      const to: number = 10;
      await offerring.placeOffer({ value: from });
      const tx = await offerring.reduceOfferTo(to);

      expect(tx).emit(offerring, 'OfferReduced').withArgs(owner, from, to);
    });

    it('should reduce contract balance by new difference between buyers balance and offer passed', async () => {
      const { offerring, nft, owner } = await deployContract();

      const from: number = 100;
      const to: number = 10;
      await offerring.placeOffer({ value: from });
      const balanceBefore = await offerring.getBalance();
      await offerring.reduceOfferTo(to);
      const balanceAfter = await offerring.getBalance();

      expect(balanceAfter).to.equal(balanceBefore - (BigInt(100) - BigInt(to)));
    });

    it('should throw an exception if offer has not been placed', async () => {
      const { offerring } = await deployContract();

      const to: number = 10;

      await expect(offerring.reduceOfferTo(to)).to.be.rejectedWith(
        'No offer have been placed by this buyer'
      );
    });

    it('should throw an exception if argument passed is 0', async () => {
      const { offerring } = await deployContract();

      const from: number = 100;
      const to: number = 0;
      await offerring.placeOffer({ value: from });

      await expect(offerring.reduceOfferTo(to)).to.be.rejectedWith(
        'Entered input must be > 0'
      );
    });

    it('should throw an exception if argument passed >= current offer', async () => {
      const { offerring } = await deployContract();

      const from: number = 100;
      const to: number = 101;
      await offerring.placeOffer({ value: from });

      await expect(offerring.reduceOfferTo(to)).to.be.rejectedWith(
        'Entered input must be < currentOffer'
      );
    });
  });

  describe('withdrawOffer()', () => {
    it('should set offers account to 0', async () => {
      const { offerring, owner } = await deployContract();

      const formerOffer: number = 100;
      await offerring.placeOffer({ value: formerOffer });
      await offerring.withdrawOffer();
      const newOffer = await offerring.getOffer(owner);

      expect(newOffer).to.equal(0);
    });

    it('should reduce totalNumOfOffers by one', async () => {
      const { offerring } = await deployContract();

      const offer: number = 100;
      await offerring.placeOffer({ value: offer });
      const totalOffer = await offerring.getTotalNumOfOffers();
      await offerring.withdrawOffer();
      const newTotalOffer = await offerring.getTotalNumOfOffers();

      expect(newTotalOffer).to.equal(totalOffer - BigInt(1));
    });

    it('should emit OfferWithdrawn evnt', async () => {
      const { offerring, nft, owner } = await deployContract();

      const offer: number = 100;
      await offerring.placeOffer({ value: offer });
      const tx = await offerring.withdrawOffer();

      expect(tx).emit(offerring, 'OfferWithdrawn').withArgs(owner, offer);
    });

    it('should reduce contract balance by buyer offer', async () => {
      const { offerring, nft, owner } = await deployContract();

      const offer: number = 100;
      await offerring.placeOffer({ value: offer });
      const balanceBefore = await offerring.getBalance();
      await offerring.withdrawOffer();
      const balanceAfter = await offerring.getBalance();

      expect(balanceAfter).to.equal(balanceBefore - BigInt(offer));
    });

    it('should throw an exception if offer has not been placed', async () => {
      const { offerring } = await deployContract();

      await expect(offerring.withdrawOffer()).to.be.rejectedWith(
        'No offer have been placed by this buyer'
      );
    });
  });

  describe('takeupOffer()', () => {
    it('should transfer nft from seller to buyer', async () => {
      const { offerring, nft, owner, otherAccount } = await deployContract();
      const buyer = owner;
      const seller = otherAccount;

      await offerring.connect(buyer).placeOffer({ value: 100 });
      const { tokenId } = await safeMint(nft, seller, _mintPriceGWei);
      await nft.connect(seller).setApprovalForAll(offerring, true);
      await offerring.connect(seller).takeupOffer(buyer, Number(tokenId));
      const nftOwner = await nft.ownerOf(Number(tokenId));

      expect(buyer.address).to.equal(nftOwner);
    });

    it('should set buyer offer value to default', async () => {
      const { offerring, nft, owner, otherAccount } = await deployContract();
      const buyer = owner;
      const seller = otherAccount;

      await offerring.connect(buyer).placeOffer({ value: 100 });
      const { tokenId } = await safeMint(nft, seller, _mintPriceGWei);
      await nft.connect(seller).setApprovalForAll(offerring, true);
      await offerring.connect(seller).takeupOffer(buyer, Number(tokenId));
      const offer = await offerring.getOffer(buyer);

      expect(offer).to.equal(0);
    });

    it('should reduce totalNumOfOffers by one', async () => {
      const { offerring, nft, owner, otherAccount } = await deployContract();
      const buyer = owner;
      const seller = otherAccount;

      await offerring.connect(buyer).placeOffer({ value: 100 });
      const { tokenId } = await safeMint(nft, seller, _mintPriceGWei);
      await nft.connect(seller).setApprovalForAll(offerring, true);
      const totalOffers = await offerring.getTotalNumOfOffers();
      await offerring.connect(seller).takeupOffer(buyer, Number(tokenId));
      const newTotalOffers = await offerring.getTotalNumOfOffers();

      expect(newTotalOffers).to.equal(totalOffers - BigInt(1));
    });

    it('should emit OfferTaken event', async () => {
      const { offerring, nft, owner, otherAccount } = await deployContract();
      const buyer = owner;
      const seller = otherAccount;

      await offerring.connect(buyer).placeOffer({ value: 100 });
      const { tokenId } = await safeMint(nft, seller, _mintPriceGWei);
      const offer = await offerring.getOffer(buyer);
      await nft.connect(seller).setApprovalForAll(offerring, true);
      const tx = await offerring
        .connect(seller)
        .takeupOffer(buyer, Number(tokenId));

      expect(tx)
        .emit(offerring, 'OfferTaken')
        .withArgs(buyer, seller, tokenId, offer);
    });

    it('should reduce contract balance by buyer offer', async () => {
      const { offerring, nft, owner, anotherAccount } = await deployContract();
      const seller = owner;
      const buyer = anotherAccount;

      const offer: number = 100;
      await offerring.connect(buyer).placeOffer({ value: offer });
      const { tokenId } = await safeMint(nft, seller, _mintPriceGWei);
      await nft.connect(seller).setApprovalForAll(offerring, true);
      const balanceBefore = await offerring.getBalance();
      await offerring.connect(seller).takeupOffer(buyer, Number(tokenId));
      const balanceAfter = await offerring.getBalance();

      expect(balanceAfter).to.equal(balanceBefore - BigInt(offer));
    });

    it('should throw an exception if seller is not token owner', async () => {
      const { offerring, nft, owner, otherAccount, anotherAccount } =
        await deployContract();
      const buyer = owner;
      const seller = otherAccount;

      await offerring.connect(buyer).placeOffer({ value: 100 });
      const { tokenId } = await safeMint(nft, seller, _mintPriceGWei);
      await nft.connect(seller).setApprovalForAll(offerring, true);

      await expect(
        offerring.connect(anotherAccount).takeupOffer(buyer, Number(tokenId))
      ).to.be.rejectedWith("You're not the owner of this token");
    });

    it('should throw an exception if token owner has not approved contract', async () => {
      const { offerring, nft, owner, otherAccount } = await deployContract();
      const buyer = owner;
      const seller = otherAccount;

      await offerring.connect(buyer).placeOffer({ value: 100 });
      const { tokenId } = await safeMint(nft, seller, _mintPriceGWei);

      await expect(
        offerring.connect(seller).takeupOffer(buyer, Number(tokenId))
      ).to.be.rejectedWith(
        'This contract is not approved to transfer this token'
      );
    });

    it('should throw an exception if buyer has not placed offer', async () => {
      const { offerring, nft, owner, otherAccount } = await deployContract();
      const buyer = owner;
      const seller = otherAccount;

      const { tokenId } = await safeMint(nft, seller, _mintPriceGWei);
      await nft.connect(seller).setApprovalForAll(offerring, true);

      await expect(
        offerring.connect(seller).takeupOffer(buyer, Number(tokenId))
      ).to.be.rejectedWith('No offer have been placed by this buyer');
    });

    it('should throw an exception if buyer equal seller', async () => {
      const { offerring, nft, owner } = await deployContract();
      const buyer = owner;
      const seller = owner;

      await offerring.connect(buyer).placeOffer({ value: 100 });
      const { tokenId } = await safeMint(nft, seller, _mintPriceGWei);
      await nft.connect(seller).setApprovalForAll(offerring, true);

      await expect(
        offerring.connect(seller).takeupOffer(buyer, Number(tokenId))
      ).to.be.rejectedWith(
        "You can't take up offers you placed rather withdraw your offer"
      );
    });
  });
});
