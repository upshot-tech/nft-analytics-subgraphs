import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import * as koConstants from "./constants";
import * as accounts from "../../utils/entities/accounts";
import * as contracts from "../../utils/entities/contracts";
import * as nfts from "../../utils/entities/nfts";
import * as saleEvents from "../../utils/entities/saleEvents";
import { Contract, NFT } from "../../types/schema";
import { ONE } from "../../constants";
import { getMarketInstance, getContract } from "./utils/contract";
import { getMetadata } from "./utils/nft";
import {
  PurchaseCall,
  PurchaseToCall,
} from "../../types/Known_Origin_Market/Known_Origin_Market";

export function mint(
  tokenId: BigInt,
  block: BigInt,
  hash: Bytes,
  timestamp: BigInt
): NFT {
  /* Define the minting details from the Minted event. */
  let tokenURI = koConstants.BASE_TOKEN_URI.concat(tokenId.toString());
  let metadata = getMetadata(tokenId);

  let market = getMarketInstance();
  let edition = market.editionOfTokenId(tokenId);
  let details = market.try_detailsOfEdition(edition);
  let creatorAddress = details.value
    ? details.value.value4
    : (Address.fromI32(0) as Address);

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
    koConstants.CONTRACT_ADDRESS,
    tokenId,
    creatorAddress,
    block,
    hash,
    timestamp,
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
export function sold(
  tokenId: BigInt,
  to: Address,
  amount: BigInt,
  block: BigInt,
  hash: Bytes,
  timestamp: BigInt
): void {
  /* Define the SaleEvent details from the Purchase call. */
  let owner = Address.fromI32(0) as Address; // Minted during purchase

  /* Require referenced NFT entity. */
  let nftId = nfts.getId(koConstants.CONTRACT_ADDRESS, tokenId);
  let nft = NFT.load(nftId);
  if (nft === null) {
    nft = mint(tokenId, block, hash, timestamp);
  }

  /* Append the transaction to the subgraph. */
  let seller = accounts.get(owner);
  let buyer = accounts.get(to);
  let creator = accounts.get(Address.fromString(nft.creator));
  let contract = getContract();

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

export function handleSold(call: PurchaseCall): void {
  let tokenId = call.outputs.value0;
  let to = call.transaction.from;
  let amount = call.transaction.value;
  let block = call.block.number;
  let hash = call.transaction.hash;
  let timestamp = call.block.timestamp;

  sold(tokenId, to, amount, block, hash, timestamp);
}

export function handleSoldTo(call: PurchaseToCall): void {
  let tokenId = call.outputs.value0;
  let to = call.inputs._to;
  let amount = call.transaction.value;
  let block = call.block.number;
  let hash = call.transaction.hash;
  let timestamp = call.block.timestamp;

  sold(tokenId, to, amount, block, hash, timestamp);
}
