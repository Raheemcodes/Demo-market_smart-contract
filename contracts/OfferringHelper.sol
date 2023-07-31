// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract OfferringHelper {
    event OfferPlaced(address indexed buyer, uint256 offer);
    event OfferUpdated(
        address indexed buyer,
        uint256 formerOffer,
        uint newOffer
    );
    event OfferReduced(address indexed buyer, uint256 from, uint to);
    event OfferIncreased(address indexed buyer, uint256 from, uint to);
    event OfferWithdrawn(address indexed buyer, uint256 offer);
    event OfferTaken(
        address indexed buyer,
        address indexed seller,
        uint256 tokenId,
        uint256 offer
    );

    ERC721 private nft;

    constructor(ERC721 _nft) {
        nft = _nft;
    }

    modifier isAddress() {
        require(msg.sender != address(0), "A valid address");
        _;
    }

    modifier notPlaced(uint256 offer) {
        require(
            offer == 0,
            "Cannot place more than one offer rather change your offer"
        );
        _;
    }

    modifier placed(uint256 offer) {
        require(offer > 0, "No offer have been placed by this buyer");
        _;
    }

    modifier validOffer() {
        require(msg.value > 0, "Offer must be > 0");
        _;
    }
}
