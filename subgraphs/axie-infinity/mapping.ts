import { Address, log } from "@graphprotocol/graph-ts";
import * as axieConstants from "./constants";
import * as accounts from "../../utils/entities/accounts";
import * as contracts from "../../utils/entities/contracts";
import * as nfts from "../../utils/entities/nfts";
import * as saleEvents from "../../utils/entities/saleEvents";
import * as transferEvents from "../../utils/entities/transferEvents";
import { Contract, NFT } from "../../types/schema";
import { typedMapToJson } from "../../utils/data";
import { ONE } from "../../constants";
import { getERC721Instance, getContract } from "./utils/contract";
import { getMetadata } from "./utils/nft";
import { AuctionSuccessful } from "../../types/Axie_Infinity_Market/Axie_Infinity_Market";
import {
  AxieSpawned,
  Transfer,
} from "../../types/Axie_Infinity_ERC721/Axie_Infinity_ERC721";

/*
 * Mint event handler
 *
 * Appends a new NFT to the subgraph.
 * The contract entity is created at the first token's minting.
 */
export function handleMint(e: AxieSpawned): void {
  /* Define the minting details from the AxieSpawned event. */
  let creatorAddress = e.params._owner;
  let tokenId = e.params._axieId;
  let tokenURI = axieConstants.BASE_TOKEN_URI.concat(tokenId.toString());
  let metadata = getMetadata(tokenId);

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
  nfts.create(
    axieConstants.CONTRACT_ADDRESS,
    tokenId,
    creatorAddress,
    e.block.number,
    e.transaction.hash,
    e.block.timestamp,
    tokenURI,
    typedMapToJson(metadata)
  );
}

/*
 * Sale event handler
 *
 * Appends a new SaleEvent to the subgraph.
 * Requires existing NFT & Contract entitiies.
 */
export function handleSold(e: AuctionSuccessful): void {
  /* Define the SaleEvent details from the AuctionSuccessful event. */
  let tokenId = e.params._tokenId;
  let amount = e.params._totalPrice;
  let hash = e.transaction.hash;
  let block = e.block.number;
  let timestamp = e.block.timestamp;
  let erc721 = getERC721Instance();
  let owner = erc721.ownerOf(tokenId);
  let contract = getContract();

  /* Require referenced NFT entity. */
  let nftId = nfts.getId(axieConstants.CONTRACT_ADDRESS, tokenId);
  let nft = NFT.load(nftId);
  if (nft === null) {
    log.warning("NFT not found: {}", [nftId]);
    return;
  }

  /* Append the transaction to the subgraph. */
  let seller = accounts.get(owner);
  let buyer = accounts.get(e.params._winner);
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

/* Event: An NFT was transferred. */
export function handleTransfer(e: Transfer): void {
  /* Define the Transfer details from the event. */
  let fromAddress = e.params._from;
  let toAddress = e.params._to;
  let tokenId = e.params._tokenId;
  let hash = e.transaction.hash;
  let block = e.block.number;
  let timestamp = e.block.timestamp;
  let contract = getContract();

  /* Require referenced NFT entity. */
  let nftId = nfts.getId(axieConstants.CONTRACT_ADDRESS, tokenId);
  let nft = NFT.load(nftId);
  if (nft === null) {
    log.warning("NFT not found: {}", [nftId]);
    return;
  }

  /* Append the transaction to the subgraph. */
  let from = accounts.get(fromAddress);
  let to = accounts.get(toAddress);

  transferEvents.create(
    nft as NFT,
    contract as Contract,
    from,
    to,
    block,
    hash,
    timestamp
  );
}
