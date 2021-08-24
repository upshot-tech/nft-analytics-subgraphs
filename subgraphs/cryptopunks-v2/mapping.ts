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
import { getOrderId, finalizeOrder, addOrderForPunk, getOrderForPunk } from "./utils/order";
import {
  Assign,
  PunkBought,
  PunkTransfer,
  PunkBidEntered,
  PunkBidWithdrawn,
  PunkNoLongerForSale,
  PunkOffered,
  AcceptBidForPunkCall,
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


// The event was emitted by acceptBidForPunk, which means that the seller has accepted an BID
// We fetch the accepted bid for the sale to fill in the missing info for a sale event
export function handleAcceptedBid(call: AcceptBidForPunkCall): void {
  let minPrice = call.inputs.minPrice
  let tokenId = call.inputs.punkIndex
  let nftId = nfts.getId(cpConstants.CONTRACT_ADDRESS, tokenId);
  let nft = NFT.load(nftId);
  if (nft === null) {
    log.warning("NFT not found: {}", [nftId]);
    return;
  }
  let contract = getContract();
  let hash = call.transaction.hash;
  let block = call.block.number;
  let timestamp = call.block.timestamp;
  // load the accepted bid
  let bidForPunk = getOrderForPunk(nft as NFT, "Bid")
  if (bidForPunk == null) {
    log.warning("Failed to find order acceptedBid: {}", [nft.id.toString()])
    return
  }

  let seller = accounts.get(call.from)
  let buyer = accounts.get(Address.fromString(bidForPunk.maker))
  let creator = accounts.get(Address.fromString(nft.creator));
  let amount = minPrice
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

  let found = finalizeOrder(nft as NFT, Address.fromString(bidForPunk.maker))
  if (!found) {
    log.warning("Failed to finalize order for AcceptBidForPunkCall: {}", [hash.toHexString()])
  }
}

/*
  The PunkBought event is triggerd in two ways:
    1) Through the buyPunk function call which emits necessary data to register a sale event
    2) Throught the acceptBidForPunk call which emits zero values for the toAddress and value parameter.
  We handle 2) separately in it's own handler to fill in the zero values.
*/
export function handleSold(e: PunkBought): void {
  /* Define the SaleEvent details from the AuctionSuccessful event. */
  let toAddress = e.params.toAddress
  let amount = e.params.value
  // The event was emitted by buyPunk call, which means that the buyer has accepted an ASK
  if (toAddress.toHexString() != ZERO_ADDRESS && amount != BigInt.fromI32(0)) {
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
    let contract = getContract();

    /* Append the transaction to the subgraph. */
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
    let found = finalizeOrder(nft as NFT, e.params.fromAddress)
    if (!found) {
      log.warning("Failed to finalize order for PunkBought: {}", [hash.toHexString()])
    }
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
  addOrderForPunk(
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

  addOrderForPunk(
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
  let maker = e.params.fromAddress;
  let contract = getContract();

  /* Require referenced NFT entity. */
  let nftId = nfts.getId(cpConstants.CONTRACT_ADDRESS, tokenId);
  let nft = NFT.load(nftId);
  if (nft === null) {
    log.warning("NFT not found: {}", [nftId]);
    return;
  }

  let order = getOrderForPunk(nft as NFT, "Bid")
  if (order === null || Address.fromString(order.maker) != maker) {
    log.warning("Failed to find order for PunkBidWithdrawn: {}", [e.transaction.hash.toHexString()]);
    return;
  }
  orders.cancel((order as Order));
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

  let order = getOrderForPunk(nft as NFT, "Ask")
  if (order === null) {
    log.warning("Failed to find order for PunkNoLongerForSale: {}", [e.transaction.hash.toHexString()]);
    return;
  }

  orders.cancel((order as Order));
}
