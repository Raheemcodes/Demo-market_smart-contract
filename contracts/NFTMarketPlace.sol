// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./ListingHelper.sol";
import "./Offerring.sol";

contract NFTMarketPlace is ListingHelper, Offerring {
    ERC721 private nft;
    uint256 private totalTokenListed;

    constructor(ERC721 _nft) ListingHelper(_nft) Offerring(_nft) {
        nft = _nft;
    }

    function getPrice(
        address seller,
        uint256 tokenId
    ) public view returns (uint256) {
        return listings[seller].prices[tokenId];
    }

    function getMyTotalListedToken() public view returns (uint256) {
        return listings[msg.sender].totalTokenListed;
    }

    function getTotalListedToken() public view returns (uint256) {
        return totalTokenListed;
    }

    function list(
        uint256 tokenId,
        uint256 price
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

        emit ListCreated(nft, owner, tokenId, price);
    }

    function changePrice(
        uint256 tokenId,
        uint256 price
    )
        public
        nonReentrant
        tokenOwner(tokenId)
        approved(tokenId)
        listed(tokenId)
        approved(tokenId)
        validPrice(price)
    {
        address owner = nft.ownerOf(tokenId);
        listings[owner].prices[tokenId] = price;

        emit ListUpdated(nft, owner, tokenId, price);
    }

    function remove(address owner, uint256 tokenId) private {
        listings[owner].prices[tokenId] = 0;
        listings[owner].totalTokenListed--;
        totalTokenListed--;
    }

    function unlist(
        uint256 tokenId
    )
        public
        nonReentrant
        tokenOwner(tokenId)
        approved(tokenId)
        listed(tokenId)
        approved(tokenId)
    {
        address owner = nft.ownerOf(tokenId);
        remove(owner, tokenId);

        emit ListRemoved(nft, owner, tokenId);
    }

    function buy(
        uint256 tokenId
    ) public payable nonReentrant listed(tokenId) notOwner(tokenId) {
        address owner = nft.ownerOf(tokenId);
        uint256 price = listings[owner].prices[tokenId];

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
        emit ListPurchased(nft, owner, msg.sender, tokenId, price);
    }
}
