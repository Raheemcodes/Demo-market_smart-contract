import {
  loadFixture,
  time,
} from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { AzukiTrans } from '../typechain-types';
describe('NFT', () => {
  // const DEFAULT_ADDRESS = '0x0000000000000000000000000000000000000000';
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE'));
  const ADMIN_ROLE =
    '0x0000000000000000000000000000000000000000000000000000000000000000';
  let _totalSupply: number = 3;
  let _mintPriceGWei: number = 8;
  let _mintStart: number = +new Date('3000-07-24') / 1000;
  let _publicSale: number = _mintStart + 60 * 60;
  let _mintEnd: number = _publicSale + 60 * 60;

  const _mint = (instance: AzukiTrans, account: any, price: number) => {
    return instance
      .connect(account)
      .safeMint({ value: ethers.parseUnits(`${price}`, 'gwei') });
  };

  let deployContract = async () => {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount, anotherAccount, ...accounts] =
      await ethers.getSigners();

    const AzukiTrans = await ethers.getContractFactory('AzukiTrans');
    const instance = await AzukiTrans.deploy(
      _totalSupply,
      _mintPriceGWei,
      _mintStart,
      _publicSale,
      _mintEnd
    );

    return { instance, owner, otherAccount, anotherAccount, accounts };
  };

  describe('deployment', () => {
    it('should grant deployer MINT_ROLE & ADMIN_ROLE', async () => {
      const { instance, owner } = await loadFixture(deployContract);

      const isMinter: boolean = await instance.hasRole(
        MINTER_ROLE,
        owner.address
      );
      const isAdmin: boolean = await instance.hasRole(
        ADMIN_ROLE,
        owner.address
      );

      expect(isMinter).to.be.true;
      expect(isAdmin).to.be.true;
    });

    it('should set values passed as argument to respective fields', async () => {
      const { instance, owner } = await loadFixture(deployContract);

      const totalSupply: bigint = await instance.totalSupply();

      const mint = await instance.mint();
      const mintPriceGWei: number = +ethers.formatUnits(mint.priceGWei, 'gwei');
      const mintStart: bigint = mint.time.start;
      const publicSale: bigint = mint.time.publicSale;
      const mintEnd: bigint = mint.time.end;

      expect(totalSupply).to.equal(_totalSupply);
      expect(mintPriceGWei).to.equal(_mintPriceGWei);
      expect(mintStart).to.equal(_mintStart);
      expect(publicSale).to.equal(_publicSale);
      expect(mintEnd).to.equal(_mintEnd);
    });

    it('should validate mintStart', async () => {
      time.increaseTo(_mintStart + 1);

      await expect(deployContract()).to.rejectedWith(
        'mint start time must be greater than current time'
      );
    });
  });

  describe('ADMIN', () => {
    it('should be able to MINT', async () => {
      const { instance, owner } = await loadFixture(deployContract);

      await time.increaseTo(_mintStart);

      await expect(_mint(instance, owner, _mintPriceGWei)).to.emit(
        instance,
        'Transfer'
      );
    });

    it('should be able to grant MINT role', async () => {
      const { instance, otherAccount } = await loadFixture(deployContract);

      await instance.grantMintRole(otherAccount);
      const isMinter = await instance.hasRole(MINTER_ROLE, otherAccount);

      expect(isMinter).to.be.true;
    });

    it('should be able to revoke MINT role', async () => {
      const { instance, otherAccount } = await loadFixture(deployContract);

      await instance.grantMintRole(otherAccount);
      await instance.revokeMintRole(otherAccount);

      const isMinter = await instance.hasRole(MINTER_ROLE, otherAccount);

      expect(isMinter).to.be.false;
    });

    it('should be able to grant ADMIN role', async () => {
      const { instance, otherAccount } = await loadFixture(deployContract);

      await instance.grantRole(ADMIN_ROLE, otherAccount);
      const isAdmin: boolean = await instance.hasRole(ADMIN_ROLE, otherAccount);

      expect(isAdmin).to.be.true;
    });

    it('should be able to revoke ADMIN role', async () => {
      const { instance, otherAccount } = await loadFixture(deployContract);

      await instance.grantRole(ADMIN_ROLE, otherAccount);
      await instance.revokeRole(ADMIN_ROLE, otherAccount);

      const isMinter = await instance.hasRole(ADMIN_ROLE, otherAccount);

      expect(isMinter).to.be.false;
    });

    it("shouldn't be able to grant roles if not an ADMIN", async () => {
      const { instance, otherAccount, anotherAccount } = await loadFixture(
        deployContract
      );

      await expect(instance.connect(otherAccount).grantMintRole(anotherAccount))
        .to.be.reverted;
    });
  });

  describe('MINT', () => {
    it('should be able mint if account has MINT role', async () => {
      const { instance, otherAccount, anotherAccount } = await loadFixture(
        deployContract
      );

      await instance.grantMintRole(otherAccount);
      await time.increaseTo(_mintStart);

      await expect(
        instance
          .connect(otherAccount)
          .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') })
      ).to.emit(instance, 'Transfer');
    });

    it('should be able to mint without a role during public sale', async () => {
      const { instance, otherAccount, anotherAccount } = await loadFixture(
        deployContract
      );

      await time.increaseTo(_publicSale);

      await expect(
        instance
          .connect(otherAccount)
          .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') })
      ).to.emit(instance, 'Transfer');
    });

    it("shouldn't be able to mint if account doesn't have mint role", async () => {
      const { instance, otherAccount, anotherAccount } = await loadFixture(
        deployContract
      );

      await time.increaseTo(_mintStart);

      await expect(
        instance
          .connect(otherAccount)
          .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') })
      ).to.be.reverted;
    });

    it("shouldn't be able to mint if mint hasn't started", async () => {
      const { instance, otherAccount, anotherAccount } = await loadFixture(
        deployContract
      );

      await instance.grantMintRole(otherAccount);

      await expect(
        instance
          .connect(otherAccount)
          .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') })
      ).to.be.revertedWith('Mint has either ended or not started');
    });

    it("shouldn't be able to mint if mint has ended", async () => {
      const { instance, otherAccount, anotherAccount } = await loadFixture(
        deployContract
      );

      await instance.grantMintRole(otherAccount);
      await time.increaseTo(_mintEnd);

      await expect(
        instance
          .connect(otherAccount)
          .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') })
      ).to.be.revertedWith('Mint has either ended or not started');
    });

    it('should not allow account to mint only once', async () => {
      const { instance, otherAccount } = await loadFixture(deployContract);

      await time.increaseTo(_publicSale);

      await instance
        .connect(otherAccount)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });
      await expect(
        instance
          .connect(otherAccount)
          .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') })
      ).to.be.revertedWith("You've minted!");
    });

    it("should not allow to mint if account doesn't have the amount", async () => {
      const { instance, otherAccount } = await loadFixture(deployContract);

      await time.increaseTo(_publicSale);

      await expect(
        instance.connect(otherAccount).safeMint({
          value: ethers.parseUnits(`${_mintPriceGWei - 1}`, 'gwei'),
        })
      ).to.be.revertedWith('Invalid amount');
    });

    it('should not be able to MINT after all supply have been minted', async () => {
      const { instance, owner, otherAccount, anotherAccount, accounts } =
        await loadFixture(deployContract);

      await time.increaseTo(_publicSale);

      await instance
        .connect(otherAccount)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });
      await instance
        .connect(anotherAccount)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });
      await instance
        .connect(accounts[0])
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });

      await expect(
        instance
          .connect(owner)
          .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') })
      ).to.be.revertedWith('All token have been minted');
    });

    it('should increase by one after each mint', async () => {
      const { instance, owner, otherAccount, anotherAccount, accounts } =
        await loadFixture(deployContract);
      const beforeMint = (await instance.mint()).total;

      await time.increaseTo(_publicSale);

      await instance
        .connect(otherAccount)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });

      const afterMint = (await instance.mint()).total;

      expect(beforeMint + BigInt(1)).to.equal(afterMint);
    });
  });
});
