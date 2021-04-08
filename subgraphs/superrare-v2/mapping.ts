import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import * as sr2Constants from "./constants";
import { ZERO_ADDRESS } from "../../constants";
import * as accounts from "../../utils/entities/accounts";
import * as contracts from "../../utils/entities/contracts";
import * as nfts from "../../utils/entities/nfts";
import * as saleEvents from "../../utils/entities/saleEvents";
import * as transferEvents from "../../utils/entities/transferEvents";
import { getMarketInstance, getContract } from "./utils/contract";
import { Contract, NFT } from "../../types/schema";
import { ONE } from "../../constants";
import { Transfer } from "../../types/SuperRare_v2_ERC721/SuperRare_v2_ERC721";
import { Sold } from "../../types/SuperRare_v2_Market/SuperRare_v2_Market";

/*
 * Mint event handler
 *
 * Appends a new NFT to the subgraph.
 * The contract entity is created at the first token's minting.
 */
export function mint(
  tokenId: BigInt,
  block: BigInt,
  hash: Bytes,
  timestamp: BigInt
): NFT {
  /* Define the minting details from the Minted event. */
  let market = getMarketInstance();

  let tokenURI = market.try_tokenURI(tokenId).value || "";
  let creatorAddress =
    market.try_tokenCreator(tokenId).value || (Address.fromI32(0) as Address);

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
    sr2Constants.CONTRACT_ADDRESS,
    tokenId,
    creatorAddress,
    block,
    hash,
    timestamp,
    tokenURI
  );
}

/*
 * Sale event handler
 *
 * Appends a new SaleEvent to the subgraph.
 * Requires existing NFT & Contract entitiies.
 */
export function handleSold(e: Sold): void {
  /* Define the SaleEvent details from the Sold or AcceptBid events. */
  let tokenId = e.params._tokenId;
  let amount = e.params._amount;
  let hash = e.transaction.hash;
  let block = e.block.number;
  let timestamp = e.block.timestamp;

  /* Require referenced NFT entity. */
  let nftId = nfts.getId(sr2Constants.CONTRACT_ADDRESS, tokenId);
  let nft = NFT.load(nftId);
  if (nft === null) {
    log.warning("NFT not found: {}", [nftId]);
    return;
  }

  /* Append the transaction to the subgraph. */
  let seller = accounts.get(e.params._seller);
  let buyer = accounts.get(e.params._buyer);
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

/* Event: An NFT was transferred. */
export function handleTransfer(e: Transfer): void {
  /* Define the Transfer details from the event. */
  let fromAddress = e.params.from;
  let toAddress = e.params.to;
  let tokenId = e.params.tokenId;
  let hash = e.transaction.hash;
  let block = e.block.number;
  let timestamp = e.block.timestamp;

  /* Catch mint events as Transfers originating from Address(0) */
  if (fromAddress.toHexString() == ZERO_ADDRESS) {
    mint(tokenId, block, hash, timestamp);
    return;
  }

  /* Require referenced NFT entity. */
  let nftId = nfts.getId(sr2Constants.CONTRACT_ADDRESS, tokenId);
  let nft = NFT.load(nftId);
  if (nft === null) {
    log.warning("NFT not found: {}", [nftId]);
    return;
  }

  /* Append the transaction to the subgraph. */
  let from = accounts.get(fromAddress);
  let to = accounts.get(toAddress);
  let contract = getContract();

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
