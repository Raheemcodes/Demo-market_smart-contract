// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract NFTDemo is ERC721, AccessControl {
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

    uint private totalSupply;

    Mint private mint;

    mapping(uint => uint) private tokenIdMap;
    mapping(address => bool) private minters;

    constructor(
        uint _totalSupply,
        uint _mintPrice,
        uint _mintStart,
        uint _presale,
        uint _publicsale
    ) ERC721("NFTDemo", "NFT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        initialize(_totalSupply, _mintPrice, _mintStart, _presale, _publicsale);
    }

    function initialize(
        uint _totalSupply,
        uint _mintPrice,
        uint _mintStart,
        uint _presale,
        uint _publicsale
    ) private onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_totalSupply > 0, "total supply must be greater than zero");
        require(_mintPrice > 0, "mint price must be greater than zero");
        require(
            _mintStart > block.timestamp,
            "mint start time must be greater than current time"
        );
        require(_presale > 0, "presale must be greater than zero");
        require(_publicsale > 0, "publicsale must be greater than zero");

        totalSupply = _totalSupply;
        mint.priceGWei = _mintPrice * 1 gwei;
        mint.time.start = _mintStart;
        mint.time.publicSale = _mintStart + _presale;
        mint.time.end = _mintStart + _presale + _publicsale;
        shuffleArr();
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://api.coolcatsnft.com/cat/";
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

    function getMint() public view returns (Mint memory) {
        return mint;
    }

    function getTotalSupply() public view returns (uint) {
        return totalSupply;
    }

    function isMinted(address _account) public view returns (bool) {
        return minters[_account];
    }

    function resetMint(
        uint _mintStart,
        uint _presale,
        uint _publicsale
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        burnAll();
        initialize(
            totalSupply,
            mint.priceGWei,
            _mintStart,
            _presale,
            _publicsale
        );
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
            curTime < mint.time.end && curTime >= mint.time.start,
            "Mint has either ended or not started"
        );
        require(!isMinted(msg.sender), "You've minted!");
        require(mint.total < totalSupply, "All token have been minted");
        require(msg.value == mint.priceGWei, "Invalid amount");

        if (curTime < mint.time.publicSale) presaleMint();
        else publicMint();

        minters[msg.sender] = true;
        mint.total++;
    }

    function burnAll() public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(mint.total > 0, "No token to burn");

        uint n = mint.total;

        for (uint i = 0; i < n; i++) {
            burn();
        }
    }

    function burn() public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(mint.total > 0, "No token to burn");

        mint.total--;
        _burn(tokenIdMap[mint.total]);
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
