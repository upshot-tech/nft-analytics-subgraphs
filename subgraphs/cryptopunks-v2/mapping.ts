import { Address, log, BigInt } from "@graphprotocol/graph-ts";
import * as cpConstants from "./constants";
import * as accounts from "../../utils/entities/accounts";
import * as contracts from "../../utils/entities/contracts";
import * as nfts from "../../utils/entities/nfts";
import * as saleEvents from "../../utils/entities/saleEvents";
import * as transferEvents from "../../utils/entities/transferEvents";
import * as orders from "../../utils/entities/orders";
import { Contract, NFT, Order } from "../../types/schema";
import { ONE, ZERO_ADDRESS, ZERO } from "../../constants";
import { getContract } from "./utils/contract";
import { getMetadata } from "./utils/nft";
import { getOrderId, finalizeAskWithMaker, finalizeBidWithMaker } from "./utils/order";
import {
  Assign,
  PunkBought,
  Transfer,
  PunkTransfer,
  PunkBidEntered,
  PunkBidWithdrawn,
  PunkNoLongerForSale,
  PunkOffered,
} from "../../types/CryptoPunks_Marketv2/CryptoPunks_Market";

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
  let toAddress = e.params.toAddress
  let amount = e.params.value
  let tokenId = e.params.punkIndex;
  // Reset existing bid from this PUNK
  let nftId = nfts.getId(cpConstants.CONTRACT_ADDRESS, tokenId);
  let nft = NFT.load(nftId);
  if (nft === null) {
    log.warning("NFT not found: {}", [nftId]);
    return;
  }
  let hash = e.transaction.hash;
  let block = e.block.number;
  let timestamp = e.block.timestamp;

  // The event was emitted by buyPunk call, which means that the buyer has accepted an ASK
  if (toAddress.toHexString() != ZERO_ADDRESS && amount != BigInt.fromI32(0)) {
    /* Append the transaction to the subgraph. */
    let contract = getContract();
    let owner = e.params.fromAddress;  
    let buyer = accounts.get(toAddress);
    let seller = accounts.get(owner);
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
    // finalize accepted ASK
    finalizeAskWithMaker(nft as NFT, e.params.fromAddress)
  }
  // The event was emitted by acceptBidForPunk, which means that the seller has accepted an BID (missing toAddress and value so no SaleEvent)
  else {
    // finalize the accepted bid
    let seller = e.params.fromAddress
    finalizeBidWithMaker(nft as NFT, seller)
  }
}

/* Event: An NFT was transferred. */
export function handleTransfer(e: PunkTransfer): void {
  /* Define the Transfer details from the event. */
  let fromAddress = e.params.from;
  let toAddress = e.params.to;
  let tokenId = e.params.punkIndex;
  let hash = e.transaction.hash;
  let block = e.block.number;
  let timestamp = e.block.timestamp;
  let contract = getContract();

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

/* Event: A bid has been created. */
export function handleCreateBid(e: PunkBidEntered): void {
  /* Define the Order details from the event. */
  let from = e.params.fromAddress;
  let tokenId = e.params.punkIndex;
  let paymentToken = Address.fromString(ZERO_ADDRESS);
  let basePrice = e.params.value;
  let type = "Bid";
  let hash = e.transaction.hash;
  let block = e.block.number;
  let timestamp = e.block.timestamp;
  let contract = getContract();

  /* Require referenced NFT entity. */
  let nftId = nfts.getId(cpConstants.CONTRACT_ADDRESS, tokenId);
  let nft = NFT.load(nftId);
  if (nft === null) {
    log.warning("NFT not found: {}", [nftId]);
    return;
  }

  /* Append the bid event to the subgraph. */
  let maker = accounts.get(from);

  orders.create(
    (nft as NFT),
    contract,
    maker,
    type,
    paymentToken,
    basePrice,
    block,
    hash,
    timestamp
  )
}

/* Event: A bid has been withdrawn. */
export function handleWithdrawBid(e: PunkBidWithdrawn): void {
  /* Define the Order details from the event. */
  let tokenId = e.params.punkIndex;
  let contract = getContract();

  /* Require referenced NFT entity. */
  let nftId = nfts.getId(cpConstants.CONTRACT_ADDRESS, tokenId);
  let nft = NFT.load(nftId);
  if (nft === null) {
    log.warning("NFT not found: {}", [nftId]);
    return;
  }

  let orderId = getOrderId(contract, (nft as NFT));
  let order = Order.load(orderId);
  if (order === null) {
    log.warning("Order not found: {}", [orderId]);
    return;
  }

  orders.cancel((order as Order));
}

/* Event: An offer has been created. */
export function handlePunkOffered(e: PunkOffered): void {
  /* Define the Order details from the event. */
  let from = e.transaction.from;
  let tokenId = e.params.punkIndex;
  let paymentToken = Address.fromString(ZERO_ADDRESS);
  let basePrice = e.params.minValue;
  let type = "Ask";
  let hash = e.transaction.hash;
  let block = e.block.number;
  let timestamp = e.block.timestamp;
  let contract = getContract();

  /* Require referenced NFT entity. */
  let nftId = nfts.getId(cpConstants.CONTRACT_ADDRESS, tokenId);
  let nft = NFT.load(nftId);
  if (nft === null) {
    log.warning("NFT not found: {}", [nftId]);
    return;
  }

  /* Append the ask event to the subgraph. */
  let maker = accounts.get(from);

  orders.create(
    (nft as NFT),
    contract,
    maker,
    type,
    paymentToken,
    basePrice,
    block,
    hash,
    timestamp
  )
}

/* Event: A punk is no longer for sale. */
export function handlePunkNoLongerForSale(e: PunkNoLongerForSale): void {
  /* Define the Order details from the event. */
  let tokenId = e.params.punkIndex;
  let contract = getContract();

  /* Require referenced NFT entity. */
  let nftId = nfts.getId(cpConstants.CONTRACT_ADDRESS, tokenId);
  let nft = NFT.load(nftId);
  if (nft === null) {
    log.warning("NFT not found: {}", [nftId]);
    return;
  }

  let orderId = getOrderId(contract, (nft as NFT));
  let order = Order.load(orderId);
  if (order === null) {
    log.warning("Order not found: {}", [orderId]);
    return;
  }

  orders.cancel((order as Order));
}
