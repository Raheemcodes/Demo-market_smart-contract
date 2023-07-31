// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./ListingHelper.sol";
import "./Offerring.sol";

contract NFTMarketPlace is ListingHelper, Offerring {
    ERC721 private nft;
    uint private totalTokenListed;

    constructor(ERC721 _nft) ListingHelper(_nft) Offerring(_nft) {
        nft = _nft;
    }

    function getPrice(address seller, uint tokenId) public view returns (uint) {
        return listings[seller].prices[tokenId];
    }

    function getMyTotalListedToken() public view returns (uint) {
        return listings[msg.sender].totalTokenListed;
    }

    function getTotalListedToken() public view returns (uint) {
        return totalTokenListed;
    }

    function list(
        uint tokenId,
        uint price
    )
        public
        nonReentrant
        tokenOwner(tokenId)
        approved(tokenId)
        notlisted(tokenId)
        validPrice(price)
    {
        address owner = nft.ownerOf(tokenId);

        listings[owner].prices[tokenId] = price;
        listings[owner].totalTokenListed++;
        totalTokenListed++;

        emit ListCreated(owner, tokenId, price);
    }

    function changeListPrice(
        uint tokenId,
        uint price
    )
        public
        nonReentrant
        tokenOwner(tokenId)
        approved(tokenId)
        listed(tokenId)
        validPrice(price)
    {
        address owner = nft.ownerOf(tokenId);

        require(
            listings[owner].prices[tokenId] != price,
            "Entered price already set"
        );

        listings[owner].prices[tokenId] = price;

        emit ListUpdated(owner, tokenId, price);
    }

    function remove(address owner, uint tokenId) private {
        listings[owner].prices[tokenId] = 0;
        listings[owner].totalTokenListed--;
        totalTokenListed--;
    }

    function unlist(
        uint tokenId
    )
        public
        nonReentrant
        tokenOwner(tokenId)
        approved(tokenId)
        listed(tokenId)
    {
        address owner = nft.ownerOf(tokenId);
        remove(owner, tokenId);

        emit ListRemoved(owner, tokenId);
    }

    function buy(
        uint tokenId
    )
        public
        payable
        nonReentrant
        approved(tokenId)
        notOwner(tokenId)
        listed(tokenId)
    {
        address owner = nft.ownerOf(tokenId);
        uint price = listings[owner].prices[tokenId];

        require(
            msg.value == price,
            string.concat(
                "You sent ",
                Strings.toString(msg.value),
                " wei instead of ",
                Strings.toString(price),
                " wei"
            )
        );

        remove(owner, tokenId);
        nft.safeTransferFrom(owner, msg.sender, tokenId);

        payable(owner).transfer(price);
        emit ListPurchased(owner, msg.sender, tokenId, price);
    }
}
