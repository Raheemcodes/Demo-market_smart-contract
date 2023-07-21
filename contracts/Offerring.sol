// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./OfferringHelper.sol";
import "./NFTHelper.sol";

contract Offerring is OfferringHelper, NFTHelper, ReentrancyGuard {
    mapping(address => uint) internal offers;
    uint private totalNumOfOffers;

    ERC721 private nft;

    constructor(ERC721 _nft) OfferringHelper(_nft) NFTHelper(_nft) {
        nft = _nft;
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    function getOffer(address buyer) public view returns (uint) {
        return offers[buyer];
    }

    function getTotalNumOfOffers() public view returns (uint) {
        return totalNumOfOffers;
    }

    function placeOffer()
        public
        payable
        nonReentrant
        notPlaced(offers[msg.sender])
        validOffer
    {
        offers[msg.sender] = msg.value;
        totalNumOfOffers++;

        emit OfferPlaced(nft, msg.sender, msg.value);
    }

    function updateOffer()
        public
        payable
        nonReentrant
        placed(offers[msg.sender])
        validOffer
    {
        require(
            msg.value != offers[msg.sender],
            "Sent value is same as current offer"
        );

        uint formerOffer = offers[msg.sender];
        offers[msg.sender] = msg.value;

        payable(msg.sender).transfer(formerOffer);
        emit OfferUpdated(nft, msg.sender, formerOffer, offers[msg.sender]);
    }

    function increaseOffer()
        public
        payable
        placed(offers[msg.sender])
        validOffer
    {
        uint from = offers[msg.sender];
        offers[msg.sender] += msg.value;

        emit OfferIncreased(nft, msg.sender, from, offers[msg.sender]);
    }

    function reduceOfferTo(
        uint to
    ) public nonReentrant placed(offers[msg.sender]) {
        require(to != 0, "Entered input must be > 0");
        require(
            to < offers[msg.sender],
            "Entered input must be < currentOffer"
        );

        uint from = offers[msg.sender];
        uint remainingOffer = offers[msg.sender] - to;
        offers[msg.sender] = to;

        payable(msg.sender).transfer(remainingOffer);
        emit OfferReduced(nft, msg.sender, from, to);
    }

    function withdrawOffer() public nonReentrant placed(offers[msg.sender]) {
        uint offer = offers[msg.sender];
        offers[msg.sender] = 0;
        totalNumOfOffers--;

        payable(msg.sender).transfer(offer);
        emit OfferWithdrawn(nft, msg.sender, offer);
    }

    function takeupOffer(
        address payable buyer,
        uint tokenId
    )
        public
        nonReentrant
        tokenOwner(tokenId)
        approved(tokenId)
        placed(offers[buyer])
    {
        uint offer = offers[buyer];
        offers[buyer] = 0;
        totalNumOfOffers--;
        nft.transferFrom(msg.sender, buyer, tokenId);

        require(
            buyer != msg.sender,
            "You can't take up offers you placed rather withdraw your offer"
        );

        payable(msg.sender).transfer(offer);
        emit OfferTaken(nft, buyer, msg.sender, tokenId, offer);
    }
}
