
import { BigInt, Address, Bytes, TypedMap, log } from "@graphprotocol/graph-ts"
import * as rConstants from "./constants"
import * as accounts from "../../utils/entities/accounts";
import * as contracts from "../../utils/entities/contracts";
import * as nfts from "../../utils/entities/nfts";
import * as saleEvents from "../../utils/entities/saleEvents";
import * as transferEvents from "../../utils/entities/transferEvents"

import { Contract, NFT } from "../../types/schema";
import { ONE, ZERO_ADDRESS } from "../../constants";
import { getTokenUri } from "./utils/nft";
import { getContract } from "./utils/contract";
import { decodeAssetData, wordLength, isERC721 } from "./utils/rarible"

import {
  Match
} from "../../types/Rarible_Market/Rarible_Market"


export function handleRaribleSale(e: Match): void {
  let leftMaker = e.params.leftMaker.toHexString()
  let rightMaker = e.params.rightMaker.toHexString()
  let leftAmount = e.params.newLeftFill.toString()
  let rightAmount = e.params.newRightFill.toString()
  let leftAssetData = e.params.leftAsset.data.toHexString()
  let leftAssetClass = e.params.leftAsset.assetClass.toHexString()
  let rightAssetData = e.params.rightAsset.data.toHexString()
  let rightAssetClass = e.params.rightAsset.assetClass.toHexString()
  let hash = e.transaction.hash;
  let block = e.block.number;
  let timestamp = e.block.timestamp;
  let leftWordLength = wordLength(leftAssetData.slice(2))
  let rightWordLength = wordLength(rightAssetData.slice(2))
  // exclude all bundle sales
  if (leftAmount == "1" && rightWordLength == 2) {
    let erc721 = isERC721(rightAssetClass)
    let assetData = decodeAssetData(rightAssetData.slice(2))
    let seller = accounts.get(Address.fromString(rightMaker))
    let buyer = accounts.get(Address.fromString(leftMaker))
    let amount = BigInt.fromString(rightAmount)
    let contractAddress = Address.fromString(assetData.get("address") as string)
    let tokenId = BigInt.fromString(assetData.get("tokenId") as string)
    let contract = getContract()
    // create nft
    let nftId = nfts.getId(contractAddress, tokenId)
    let nft = NFT.load(nftId);
    if (nft === null) {
      nft = mint(contractAddress, tokenId, erc721, block, hash, timestamp);
    }
    /* Append the transaction to the subgraph. */
    let creator = accounts.get(Address.fromString(nft.creator));

    contracts.addBuyer(contract as Contract, buyer);
    contracts.addSeller(contract as Contract, seller);
    saleEvents.create(
      nft as NFT,
      contract as Contract,
      buyer,
      seller,
      creator,
      amount,
      block,
      hash,
      timestamp
    );
  }
  else if (rightAmount == "1" && leftWordLength == 2) {
    let erc721 = isERC721(leftAssetClass)
    let assetData = decodeAssetData(leftAssetData.slice(2))
    let seller = accounts.get(Address.fromString(leftMaker))
    let buyer = accounts.get(Address.fromString(rightMaker))
    let amount = BigInt.fromString(leftAmount)

    let contractAddress = Address.fromString(assetData.get("address") as string)
    let tokenId = BigInt.fromString(assetData.get("tokenId") as string)
    let contract = getContract()
    // create nft
    let nftId = nfts.getId(contractAddress, tokenId)
    let nft = NFT.load(nftId);
    if (nft === null) {
      nft = mint(contractAddress, tokenId, erc721, block, hash, timestamp);
    }
    /* Append the transaction to the subgraph. */
    let creator = accounts.get(Address.fromString(nft.creator));

    contracts.addBuyer(contract as Contract, buyer);
    contracts.addSeller(contract as Contract, seller);
    saleEvents.create(
      nft as NFT,
      contract as Contract,
      buyer,
      seller,
      creator,
      amount,
      block,
      hash,
      timestamp
    );
  }
  else{
    return
  }
}

export function mint(
  contractAddress: Address,
  tokenId: BigInt,
  isERC721: boolean,
  block: BigInt,
  hash: Bytes,
  timestamp: BigInt
): NFT {
  /* Define the minting details from the Minted event. */
  let tokenURI = getTokenUri(contractAddress, tokenId, isERC721);
  let metadata = "{}"
  let creatorAddress = Address.fromHexString(ZERO_ADDRESS) as Address

  /* Load the contract instance (create if undefined). */
  let contract = getContract();
  contract.totalMinted = contract.totalMinted.plus(ONE);
  contract.save();

  /* Load the creator Account instance (create if undefined). */
  let creator = accounts.get(creatorAddress);
  contracts.addCreator(contract as Contract, creator);
  creator.totalCreations = creator.totalCreations.plus(ONE);
  creator.save();

  /* Append the NFT to the subgraph. */
  return nfts.create(
    contractAddress,
    tokenId,
    creatorAddress,
    block,
    hash,
    timestamp,
    tokenURI,
    metadata
  );
}