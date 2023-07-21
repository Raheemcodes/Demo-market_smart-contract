// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ListingHelper {
    event ListCreated(
        ERC721 indexed nft,
        address indexed seller,
        uint256 tokenId,
        uint256 price
    );
    event ListUpdated(
        ERC721 indexed nft,
        address indexed seller,
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
        address indexed seller,
        uint256 tokenId
    );

    ERC721 private nft;

    mapping(address => Listing) internal listings;

    constructor(ERC721 _nft) {
        nft = _nft;
    }

    struct Listing {
        mapping(uint256 => uint256) prices;
        uint256 totalTokenListed;
    }

    modifier notlisted(uint256 tokenId) {
        address owner = nft.ownerOf(tokenId);
        require(
            listings[owner].prices[tokenId] == 0,
            "Token has already been listed"
        );
        _;
    }

    modifier listed(uint256 tokenId) {
        address owner = nft.ownerOf(tokenId);
        require(listings[owner].prices[tokenId] > 0, "Token is not listed");
        _;
    }

    modifier validPrice(uint256 price) {
        require(price > 0, "List price must be > 0");
        _;
    }
}
