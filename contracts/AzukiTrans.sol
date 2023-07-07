// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// URI from Azuki
contract AzukiDemo is ERC721, AccessControl {
    struct MintTime {
        uint start;
        uint publicSale;
        uint end;
    }

    struct Mint {
        uint priceGWei;
        MintTime time;
        uint total;
    }

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint public totalSupply;

    Mint public mint;

    mapping(uint => uint) tokenIdMap;

    constructor(
        uint _totalSupply,
        uint _mintPrice,
        uint _mintStart,
        uint _publicMintStart,
        uint _mintEnd
    ) ERC721("MyToken", "MTK") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        initialize(
            _totalSupply,
            _mintPrice,
            _mintStart,
            _publicMintStart,
            _mintEnd
        );
    }

    function initialize(
        uint _totalSupply,
        uint _mintPrice,
        uint _mintStart,
        uint _publicSale,
        uint _mintEnd
    ) internal onlyRole(DEFAULT_ADMIN_ROLE) {
        totalSupply = _totalSupply;
        mint.priceGWei = _mintPrice * 1 gwei;
        mint.time.start = _mintStart;
        mint.time.publicSale = _publicSale;
        mint.time.end = _mintEnd;
        shuffleArr();
    }

    function _baseURI() internal pure override returns (string memory) {
        return
            "https://ipfs.io/ipfs/QmZcH4YvBVVRJtdn4RdbaqgspFU8gH6P9vomDpBVpAL3u4/";
    }

    function shuffleArr() private onlyRole(DEFAULT_ADMIN_ROLE) {
        for (uint256 i = 0; i < totalSupply; i++) {
            tokenIdMap[i] = i;
        }

        uint256 n = totalSupply;

        for (uint256 i = 0; i < n; i++) {
            uint256 j = i +
                (uint256(
                    keccak256(
                        abi.encodePacked(block.timestamp, block.prevrandao, i)
                    )
                ) % (n - i));
            uint256 temp = tokenIdMap[j];
            tokenIdMap[j] = tokenIdMap[i];
            tokenIdMap[i] = temp;
        }
    }

    function presaleMint() private onlyRole(MINTER_ROLE) {
        _safeMint(msg.sender, tokenIdMap[mint.total]);
    }

    function publicMint() private {
        _safeMint(msg.sender, tokenIdMap[mint.total]);
    }

    function safeMint() public payable {
        uint curTime = block.timestamp;
        require(
            curTime < mint.time.end && curTime > mint.time.start,
            "Mint has either ended or not started"
        );
        require(balanceOf(msg.sender) == 0, "You've minted!");
        require(mint.total < totalSupply, "All token have been minted");
        require(msg.value == mint.priceGWei, "Invalid amount");

        if (curTime < mint.time.publicSale) presaleMint();
        else publicMint();

        mint.total++;
    }

    function grantMintRole(address account) public {
        grantRole(MINTER_ROLE, account);
    }

    function revokeMintRole(address account) public {
        revokeRole(MINTER_ROLE, account);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
