import { ethers } from 'hardhat';
import { AzukiDemo } from '../../typechain-types';
import { ContractRunner } from 'ethers';

const safeMint = async (
  nft: AzukiDemo,
  seller: ContractRunner,
  price: number
) => {
  const tx = await nft
    .connect(seller)
    .safeMint({ value: ethers.parseUnits(`${price}`, 'gwei') });
  const receipt = await tx.wait();
  const { args } = <any>receipt?.logs[0];

  const returnValue: { from: string; to: string; tokenId: BigInt } = {
    from: args[0],
    to: args[1],
    tokenId: args[2],
  };

  return returnValue;
};

export default safeMint;
