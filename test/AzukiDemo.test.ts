import { AzukiDemo } from './../typechain-types/contracts/AzukiDemo';
import { reset, time } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('NFT', () => {
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE'));
  const ADMIN_ROLE =
    '0x0000000000000000000000000000000000000000000000000000000000000000';
  let _totalSupply: number = 5;
  let _mintPriceGWei: number = 8;
  let _mintStart: number = Math.round(Date.now() / 1000) + 60;
  let _presale: number = 60 * 60;
  let _publicsale: number = 60 * 60;

  const resetValue = () => {
    _totalSupply = 3;
    _mintPriceGWei = 8;
    _mintStart = +new Date('3000-07-24') / 1000;
    _presale = 60 * 60;
    _publicsale = 60 * 60;
  };

  afterEach(async () => {
    resetValue();
    await reset();
  });

  let deployContract = async () => {
    const [owner, otherAccount, anotherAccount, ...accounts] =
      await ethers.getSigners();

    const AzukiDemo = await ethers.getContractFactory('AzukiDemo');
    const instance = await AzukiDemo.deploy(
      _totalSupply,
      _mintPriceGWei,
      _mintStart,
      _presale,
      _publicsale
    );

    return { instance, owner, otherAccount, anotherAccount, accounts };
  };

  describe('deployment', () => {
    it('should grant deployer MINT_ROLE & ADMIN_ROLE', async () => {
      const { instance, owner } = await deployContract();

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
      const { instance } = await deployContract();

      const totalSupply: bigint = await instance.getTotalSupply();

      const mint = await instance.getMint();
      const mintPriceGWei: number = +ethers.formatUnits(mint.priceGWei, 'gwei');
      const mintStart: bigint = mint.time.start;
      const publicSale: bigint = mint.time.publicSale;
      const mintEnd: bigint = mint.time.end;

      expect(totalSupply).to.equal(_totalSupply);
      expect(mintPriceGWei).to.equal(_mintPriceGWei);
      expect(mintStart).to.equal(_mintStart);
      expect(publicSale).to.equal(_mintStart + _presale);
      expect(mintEnd).to.equal(_mintStart + _presale + _publicsale);
    });

    it('should throw error if totalSupply <= 0', async () => {
      _totalSupply = 0;

      await expect(deployContract()).to.rejectedWith(
        'total supply must be greater than zero'
      );
    });

    it('should throw error if mintPrice <= 0', async () => {
      _mintPriceGWei = 0;

      await expect(deployContract()).to.rejectedWith(
        'mint price must be greater than zero'
      );
    });

    it('should validate mintStart', async () => {
      time.increaseTo(_mintStart + 1);

      await expect(deployContract()).to.rejectedWith(
        'mint start time must be greater than current time'
      );
    });

    it('should throw error if presale <= 0', async () => {
      _presale = 0;

      await expect(deployContract()).to.rejectedWith(
        'presale must be greater than zero'
      );
    });

    it('should throw error if publicsale <= 0', async () => {
      _publicsale = 0;
      await expect(deployContract()).to.rejectedWith(
        'publicsale must be greater than zero'
      );
    });
  });

  describe('ADMIN', () => {
    it('should be able to MINT', async () => {
      const { instance, owner } = await deployContract();

      await time.increaseTo(_mintStart);

      await expect(
        instance
          .connect(owner)
          .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') })
      ).to.emit(instance, 'Transfer');
    });

    it('should be able to burn', async () => {
      const { instance, owner } = await deployContract();

      await time.increaseTo(_mintStart + _presale);
      await instance
        .connect(owner)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });

      await expect(instance.connect(owner).burn()).to.emit(
        instance,
        'Transfer'
      );
    });

    it('should be able to burn all token', async () => {
      const { instance, owner, otherAccount, anotherAccount } =
        await deployContract();

      await time.increaseTo(_mintStart + _presale);
      await instance
        .connect(owner)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });
      await instance
        .connect(otherAccount)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });
      await instance
        .connect(anotherAccount)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });

      await expect(instance.connect(owner).burnAll()).to.emit(
        instance,
        'Transfer'
      );
    });

    it('should be able to reset MINT', async () => {
      const { instance, owner, otherAccount, anotherAccount } =
        await deployContract();

      await time.increaseTo(_mintStart + _presale);

      await instance
        .connect(owner)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });
      await instance
        .connect(otherAccount)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });
      await instance
        .connect(anotherAccount)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });

      await expect(
        instance.connect(owner).resetMint(_mintStart * 2, _presale, _publicsale)
      ).to.emit(instance, 'Transfer');
    });

    it('should be able to grant MINT role', async () => {
      const { instance, otherAccount } = await deployContract();

      await instance.grantMintRole(otherAccount);
      const isMinter = await instance.hasRole(MINTER_ROLE, otherAccount);

      expect(isMinter).to.be.true;
    });

    it('should be able to revoke MINT role', async () => {
      const { instance, otherAccount } = await deployContract();

      await instance.grantMintRole(otherAccount);
      await instance.revokeMintRole(otherAccount);

      const isMinter = await instance.hasRole(MINTER_ROLE, otherAccount);

      expect(isMinter).to.be.false;
    });

    it('should be able to grant ADMIN role', async () => {
      const { instance, otherAccount } = await deployContract();

      await instance.grantRole(ADMIN_ROLE, otherAccount);
      const isAdmin: boolean = await instance.hasRole(ADMIN_ROLE, otherAccount);

      expect(isAdmin).to.be.true;
    });

    it('should be able to revoke ADMIN role', async () => {
      const { instance, otherAccount } = await deployContract();

      await instance.grantRole(ADMIN_ROLE, otherAccount);
      await instance.revokeRole(ADMIN_ROLE, otherAccount);

      const isMinter = await instance.hasRole(ADMIN_ROLE, otherAccount);

      expect(isMinter).to.be.false;
    });

    it('should not be able to burn if not an ADMIN', async () => {
      const { instance, owner, otherAccount } = await deployContract();

      await time.increaseTo(_mintStart + _presale);
      await instance
        .connect(owner)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });

      await expect(instance.connect(otherAccount).burn()).to.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${ADMIN_ROLE}`
      );
    });

    it('should not be able to burn all token if not an ADMIN', async () => {
      const { instance, owner, otherAccount, anotherAccount } =
        await deployContract();

      await time.increaseTo(_mintStart + _presale);
      await instance
        .connect(owner)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });
      await instance
        .connect(otherAccount)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });
      await instance
        .connect(anotherAccount)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });

      await expect(instance.connect(otherAccount).burnAll()).to.be.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${ADMIN_ROLE}`
      );
    });

    it('should not be able to reset MINT if not an ADMIN', async () => {
      const { instance, owner, otherAccount, anotherAccount } =
        await deployContract();

      await time.increaseTo(_mintStart + _presale);

      await instance
        .connect(owner)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });
      await instance
        .connect(otherAccount)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });
      await instance
        .connect(anotherAccount)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });

      await expect(
        instance
          .connect(otherAccount)
          .resetMint(_mintStart * 2, _presale, _publicsale)
      ).to.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${ADMIN_ROLE}`
      );
    });

    it("shouldn't be able to grant roles if not an ADMIN", async () => {
      const { instance, otherAccount, anotherAccount } = await deployContract();

      await expect(
        instance.connect(otherAccount).grantRole(ADMIN_ROLE, anotherAccount)
      ).to.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${ADMIN_ROLE}`
      );
      await expect(
        instance.connect(otherAccount).grantMintRole(anotherAccount)
      ).to.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${ADMIN_ROLE}`
      );
    });

    it("shouldn't be able to revoke roles if not an ADMIN", async () => {
      const { instance, otherAccount, anotherAccount } = await deployContract();

      await expect(
        instance.connect(otherAccount).revokeRole(ADMIN_ROLE, anotherAccount)
      ).to.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${ADMIN_ROLE}`
      );
      await expect(
        instance.connect(otherAccount).revokeMintRole(anotherAccount)
      ).to.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${ADMIN_ROLE}`
      );
    });
  });

  describe('MINT', () => {
    it('should be able mint if account has MINT role', async () => {
      const { instance, otherAccount } = await deployContract();

      await instance.grantMintRole(otherAccount);
      await time.increaseTo(_mintStart);

      await expect(
        instance
          .connect(otherAccount)
          .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') })
      ).to.emit(instance, 'Transfer');
    });

    it('should be able to mint without a role during public sale', async () => {
      const { instance, otherAccount } = await deployContract();
      await time.increaseTo(_mintStart + _presale);

      await expect(
        instance
          .connect(otherAccount)
          .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') })
      ).to.emit(instance, 'Transfer');
    });

    it("shouldn't be able to mint if account doesn't have mint role", async () => {
      const { instance, otherAccount } = await deployContract();

      await time.increaseTo(_mintStart);

      await expect(
        instance
          .connect(otherAccount)
          .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') })
      ).to.revertedWith(
        `AccessControl: account ${otherAccount.address.toLowerCase()} is missing role ${MINTER_ROLE}`
      );
    });

    it("shouldn't be able to mint if mint hasn't started", async () => {
      const { instance, otherAccount } = await deployContract();

      await instance.grantMintRole(otherAccount);

      await expect(
        instance
          .connect(otherAccount)
          .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') })
      ).to.be.revertedWith('Mint has either ended or not started');
    });

    it("shouldn't be able to mint if mint has ended", async () => {
      const { instance, otherAccount } = await deployContract();

      await instance.grantMintRole(otherAccount);
      await time.increaseTo(_mintStart + _presale + _publicsale);

      await expect(
        instance
          .connect(otherAccount)
          .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') })
      ).to.be.revertedWith('Mint has either ended or not started');
    });

    it('should not allow account to mint only once', async () => {
      const { instance, otherAccount } = await deployContract();

      await time.increaseTo(_mintStart + _presale);

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
      const { instance, otherAccount } = await deployContract();

      await time.increaseTo(_mintStart + _presale);

      await expect(
        instance.connect(otherAccount).safeMint({
          value: ethers.parseUnits(`${_mintPriceGWei - 1}`, 'gwei'),
        })
      ).to.be.revertedWith('Invalid amount');
    });

    it('should not be able to MINT after all supply have been minted', async () => {
      _totalSupply = 2;
      const { instance, owner, otherAccount, anotherAccount } =
        await deployContract();

      await time.increaseTo(_mintStart + _presale);

      await instance
        .connect(otherAccount)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });
      await instance
        .connect(anotherAccount)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });

      await expect(
        instance
          .connect(owner)
          .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') })
      ).to.be.revertedWith('All token have been minted');
    });

    it('should increase by one after each mint', async () => {
      const { instance, otherAccount } = await deployContract();
      const beforeMint = (await instance.getMint()).total;

      await time.increaseTo(_mintStart + _presale);

      await instance
        .connect(otherAccount)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });

      const afterMint = (await instance.getMint()).total;

      expect(beforeMint + BigInt(1)).to.equal(afterMint);
    });
  });

  describe('BURN', () => {
    it('should reduce total token minted by 1', async () => {
      const { instance, owner } = await deployContract();

      await time.increaseTo(_mintStart + _presale);
      await instance
        .connect(owner)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });
      const beforeBurnTotal = (await instance.getMint()).total;
      await instance.connect(owner).burn();
      const afterBurnTotal = (await instance.getMint()).total;

      expect(beforeBurnTotal - BigInt(1)).to.equal(afterBurnTotal);
    });

    it("shouldn't burn if token has been minted", async () => {
      const { instance, owner } = await deployContract();

      await expect(instance.connect(owner).burn()).to.be.revertedWith(
        'No token to burn'
      );
    });

    it('should be able to not be able to burn all token', async () => {
      const { instance, owner } = await deployContract();

      await expect(instance.connect(owner).burnAll()).to.be.revertedWith(
        'No token to burn'
      );
    });
  });

  describe('resetMint()', () => {
    let newMintTime: number, presale: number, publicsale: number;
    let mint: [bigint, AzukiDemo.MintTimeStructOutput, bigint] & {
      priceGWei: bigint;
      time: AzukiDemo.MintTimeStructOutput;
      total: bigint;
    };

    beforeEach(async () => {
      newMintTime = _mintStart * 2;
      presale = 60 * 60 * 2;
      publicsale = 60 * 60 * 5;

      const { instance, owner, otherAccount, anotherAccount } =
        await deployContract();

      await time.increaseTo(_mintStart + _presale);

      await instance
        .connect(owner)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });
      await instance
        .connect(otherAccount)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });
      await instance
        .connect(anotherAccount)
        .safeMint({ value: ethers.parseUnits(`${_mintPriceGWei}`, 'gwei') });

      await instance.connect(owner).resetMint(newMintTime, presale, publicsale);

      mint = await instance.getMint();
    });

    it('should be able to reset mint start time, presale and public duration when invoked', async () => {
      expect(mint.time.start).to.equal(newMintTime);
      expect(mint.time.publicSale).to.equal(newMintTime + presale);
      expect(mint.time.end).to.equal(newMintTime + presale + publicsale);
    });

    it('should burn all token', () => {
      expect(mint.total).to.equal(0);
    });
  });
});
