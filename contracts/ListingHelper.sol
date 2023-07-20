// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ListingHelper {
    event ListCreated(
        ERC721 indexed nft,
        address indexed owner,
        uint256 tokenId,
        uint256 price
    );
    event ListUpdated(
        ERC721 indexed nft,
        address indexed owner,
        uint256 tokenId,
        uint256 price
    );
    event ListPurchased(
        ERC721 indexed nft,
        address indexed seller,
        address indexed buyer,
        uint256 tokenId,
        uint256 price
    );
    event ListRemoved(
        ERC721 indexed nft,
        address indexed owner,
        uint256 tokenId
    );

    ERC721 private nft;

    constructor(ERC721 _nft) {
        nft = _nft;
    }

    modifier validPrice(uint256 price) {
        require(price > 0, "List price must be > 0");
        _;
    }
}
