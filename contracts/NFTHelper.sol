// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFTHelper {
    ERC721 private nft;

    constructor(ERC721 _nft) {
        nft = _nft;
    }

    modifier approved(uint256 nftId) {
        address owner = nft.ownerOf(nftId);
        require(
            nft.getApproved(nftId) == address(this) ||
                nft.isApprovedForAll(owner, address(this)),
            "This contract is not approved to transfer this token"
        );
        _;
    }

    modifier tokenOwner(uint256 nftId) {
        address owner = nft.ownerOf(nftId);
        require(owner == msg.sender, "You're not the owner of this token");
        _;
    }

    modifier notOwner(uint256 nftId) {
        address owner = nft.ownerOf(nftId);

        require(
            owner != msg.sender,
            "You can't buy your own nft rather unlist it"
        );
        _;
    }
}
