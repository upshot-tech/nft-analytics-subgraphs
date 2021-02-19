import { Address, log } from "@graphprotocol/graph-ts";
import * as cpConstants from "./constants";
import * as accounts from "../../utils/entities/accounts";
import * as contracts from "../../utils/entities/contracts";
import * as nfts from "../../utils/entities/nfts";
import * as saleEvents from "../../utils/entities/saleEvents";
import * as transferEvents from "../../utils/entities/transferEvents";
import { Contract, NFT } from "../../types/schema";
import { ONE } from "../../constants";
import { getMarketInstance } from "./utils/contract";
import { getMetadata } from "./utils/nft";
import {
  Assign,
  PunkBought,
  Transfer,
} from "../../types/CryptoPunks_Market/CryptoPunks_Market";

/*
 * Mint event handler
 *
 * Appends a new NFT to the subgraph.
 * The contract entity is created at the first token's minting.
 */
export function handleMint(e: Assign): void {
  /* Define the minting details from the Assign event. */
  let creatorAddress = e.params.to;
  let tokenId = e.params.punkIndex;
  let tokenURI = cpConstants.BASE_TOKEN_URI.concat(tokenId.toString());
  let metadata = getMetadata(tokenId);

  /* Load the contract instance (create if undefined). */
  let contract = Contract.load(cpConstants.CONTRACT_ADDRESS.toHexString());
  if (contract === null) {
    contract = contracts.create(
      cpConstants.CONTRACT_ADDRESS,
      cpConstants.CONTRACT_URI,
      cpConstants.CONTRACT_NAME,
      cpConstants.CONTRACT_SYMBOL,
      cpConstants.CONTRACT_METADATA
    );
  }
  contract.totalMinted = contract.totalMinted.plus(ONE);
  contract.save();

  /* Load the creator Account instance (create if undefined). */
  let creator = accounts.get(creatorAddress);
  contracts.addCreator(contract as Contract, creator);
  creator.totalCreations = creator.totalCreations.plus(ONE);
  creator.save();

  /* Append the NFT to the subgraph. */
  nfts.create(
    cpConstants.CONTRACT_ADDRESS,
    tokenId,
    creatorAddress,
    e.block.number,
    e.transaction.hash,
    e.block.timestamp,
    tokenURI,
    metadata
  );
}

/*
 * Sale event handler
 *
 * Appends a new SaleEvent to the subgraph.
 * Requires existing NFT & Contract entitiies.
 */
export function handleSold(e: PunkBought): void {
  /* Define the SaleEvent details from the AuctionSuccessful event. */
  let tokenId = e.params.punkIndex;
  let amount = e.params.value;
  let hash = e.transaction.hash;
  let block = e.block.number;
  let timestamp = e.block.timestamp;
  let market = getMarketInstance();
  let owner = market.punkIndexToAddress(tokenId);

  /* Require referenced Contract entity. */
  let contractId = cpConstants.CONTRACT_ADDRESS.toHexString();
  let contract = Contract.load(cpConstants.CONTRACT_ADDRESS.toHexString());
  if (contract === null) {
    log.warning("Contract not found: {}", [contractId]);
    return;
  }

  /* Require referenced NFT entity. */
  let nftId = nfts.getId(cpConstants.CONTRACT_ADDRESS, tokenId);
  let nft = NFT.load(nftId);
  if (nft === null) {
    log.warning("NFT not found: {}", [nftId]);
    return;
  }

  /* Append the transaction to the subgraph. */
  let seller = accounts.get(owner);
  let buyer = accounts.get(e.params.toAddress);
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
  let fromAddress = e.params.from;
  let toAddress = e.params.to;
  let tokenId = e.params.value;
  let hash = e.transaction.hash;
  let block = e.block.number;
  let timestamp = e.block.timestamp;

  /* Require referenced Contract entity. */
  let contractId = cpConstants.CONTRACT_ADDRESS.toHexString();
  let contract = Contract.load(cpConstants.CONTRACT_ADDRESS.toHexString());
  if (contract === null) {
    log.warning("Contract not found: {}", [contractId]);
    return;
  }

  /* Require referenced NFT entity. */
  let nftId = nfts.getId(cpConstants.CONTRACT_ADDRESS, tokenId);
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
