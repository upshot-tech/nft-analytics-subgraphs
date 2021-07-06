import { Address, log } from "@graphprotocol/graph-ts";
import * as srConstants from "./constants";
import * as accounts from "../../utils/entities/accounts";
import * as contracts from "../../utils/entities/contracts";
import * as nfts from "../../utils/entities/nfts";
import * as saleEvents from "../../utils/entities/saleEvents";
import * as transferEvents from "../../utils/entities/transferEvents";
import { Contract, NFT } from "../../types/schema";
import { ONE } from "../../constants";
import { getMarketInstance, getContract } from "./utils/contract";
import { getMetadata } from "./utils/nft";
import {
  AddNewTokenCall,
  AddNewTokenWithEditionsCall,
  Sold,
  Transfer,
} from "../../types/SuperRare_Market/SuperRare_Market";

/* Handle a SuperRare NFT minting */
function handleMint(call: AddNewTokenCall, editions: string): void {
  /* Define the minting details from the AddNewToken call. */
  let creatorAddress = call.from;
  let market = getMarketInstance();
  let totalSupply = market.totalSupply();
  let tokenId = totalSupply.plus(ONE);
  let tokenURI = call.inputs._uri.toString();
  let metadata = getMetadata(tokenURI);

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
    srConstants.CONTRACT_ADDRESS,
    tokenId,
    creatorAddress,
    call.block.number,
    call.transaction.hash,
    call.block.timestamp,
    tokenURI,
    metadata
  );
}

/*
 * Add New Token handler
 *
 * Appends a new NFT to the subgraph.
 * The contract entity is created at the first token's minting.
 */
export function handleAddNewToken(call: AddNewTokenCall): void {
  handleMint(call as AddNewTokenCall, "1");
}

/*
 * Add New Token with Editions handler
 *
 * Appends a new NFT to the subgraph.
 * The contract entity is created at the first token's minting.
 */
export function handleAddNewTokenWithEditions(
  call: AddNewTokenWithEditionsCall
): void {
  let editions = call.inputs._editions.toString();
  handleMint(call as AddNewTokenCall, editions);
}

/*
 * Sale event handler
 *
 * Appends a new SaleEvent to the subgraph.
 * Requires existing NFT & Contract entitiies.
 */
export function handleSold(e: Sold): void {
  /* Define the SaleEvent details from the AuctionSuccessful event. */
  let tokenId = e.params._tokenId;
  let amount = e.params._amount;
  let hash = e.transaction.hash;
  let block = e.block.number;
  let timestamp = e.block.timestamp;
  let contract = getContract();

  /* Require referenced NFT entity. */
  let nftId = nfts.getId(srConstants.CONTRACT_ADDRESS, tokenId);
  let nft = NFT.load(nftId);
  if (nft === null) {
    log.warning("NFT not found: {}", [nftId]);
    return;
  }

  /* Append the transaction to the subgraph. */
  let seller = accounts.get(e.params._seller);
  let buyer = accounts.get(e.params._buyer);
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
  let nftId = nfts.getId(srConstants.CONTRACT_ADDRESS, tokenId);
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
