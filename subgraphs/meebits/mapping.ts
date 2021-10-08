
import { BigInt, Address, Bytes, TypedMap, log} from "@graphprotocol/graph-ts"
import * as mbConstants from "./constants"
import * as accounts from "../../utils/entities/accounts";
import * as contracts from "../../utils/entities/contracts";
import * as nfts from "../../utils/entities/nfts";
import * as saleEvents from "../../utils/entities/saleEvents";
import * as transferEvents from "../../utils/entities/transferEvents"

import { Contract, NFT } from "../../types/schema";
import { ONE, ZERO_ADDRESS } from "../../constants";
import { isSingleTrade, decodeCallData } from "./utils/opensea"
import { getTokenUri } from "./utils/nft";
import { getContract } from "./utils/contract";

import {
  AtomicMatch_Call
} from "../../types/Meebits_OpenSea_Market/OpenSea_Market"
import {
  Transfer, Trade, Mint
} from "../../types/Meebits_Market/Meebits_Market"


export function handleMint(e: Mint): void {
  let minter = e.params.minter
  let tokenId = e.params.index

  let tokenURI = getTokenUri(tokenId)
  
  /* Load the contract instance (create if undefined). */
  let contract = getContract();
  contract.totalMinted = contract.totalMinted.plus(ONE);
  contract.save();

  /* Load the creator Account instance (create if undefined). */
  let creator = accounts.get(minter);
  contracts.addCreator(contract as Contract, creator);
  creator.totalCreations = creator.totalCreations.plus(ONE);
  creator.save();

  /* Append the NFT to the subgraph. */
  nfts.create(
    mbConstants.CONTRACT_ADDRESS,
    tokenId,
    minter,
    e.block.number,
    e.transaction.hash,
    e.block.timestamp,
    tokenURI,
    "{}"
  );
}


export function handleTransfer(e: Transfer): void {
  let fromAddress = e.params.from;
  let toAddress = e.params.to;
  let tokenId = e.params.tokenId;
  let hash = e.transaction.hash;
  let block = e.block.number;
  let timestamp = e.block.timestamp;
  let contract = getContract();

  /* Require referenced NFT entity. */
  let nftId = nfts.getId(mbConstants.CONTRACT_ADDRESS, tokenId);
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

export function handleMeebitSale(e: Trade): void {
  // Define SaleEvent data
  let makerIds = e.params.makerIds
  let takerIds = e.params.takerIds
  // exclude bundle sales
  if (makerIds.length == 1 && takerIds.length == 0) {
    let makerWei = e.params.makerWei
    let maker = e.params.maker
    let taker = e.params.taker
    let takerWei = e.params.takerWei
    let block = e.block.number
    let timestamp = e.block.timestamp
    let hash = e.transaction.hash
    let tokenId = makerIds[0]
    let contract = getContract()
    // create nft
    let nftId = nfts.getId(mbConstants.CONTRACT_ADDRESS, tokenId)
    let nft = NFT.load(nftId);
    if (nft === null) {
      nft = mint(tokenId, block, hash, timestamp);
    }
    /* Append the transaction to the subgraph. */
    let seller = accounts.get(maker);
    let buyer = accounts.get(taker);
    let creator = accounts.get(Address.fromString(nft.creator));

    contracts.addBuyer(contract as Contract, buyer);
    contracts.addSeller(contract as Contract, seller);
    saleEvents.create(
      nft as NFT,
      contract as Contract,
      buyer,
      seller,
      creator,
      takerWei,
      block,
      hash,
      timestamp
    );
  }
}


export function handleOpenSeaSale(call: AtomicMatch_Call): void {
  let calldataBuy = call.inputs.calldataBuy.toHexString()
  let calldataSell = call.inputs.calldataSell.toHexString()
  // Only allow single sale events (not bundle)
  if (isSingleTrade(calldataBuy, calldataSell)) {
    let addrs = call.inputs.addrs
    let nftAddress = addrs[4]
    // Only allow Meebits sale events
    if (nftAddress.toHexString() == mbConstants.CONTRACT_ADDRESS.toHexString()) {
      let uints = call.inputs.uints
      // decode opensea calldata
      let buyReplacement = call.inputs.replacementPatternBuy.toHexString()
      let decodedCallData: TypedMap<string, string> = decodeCallData(calldataBuy, buyReplacement, calldataSell)
      // Define the SaleEvent info
      let buyer = accounts.get(Address.fromString(decodedCallData.get("buyer") as string))
      let seller = accounts.get(Address.fromString(decodedCallData.get("seller") as string))
      let tokenId = BigInt.fromString(decodedCallData.get("tokenId") as string)
      let paymentToken = addrs[6].toHexString()
      let amount = uints[4]
      let block = call.block.number;
      let hash = call.transaction.hash;
      let timestamp = call.block.timestamp;
      let contract = getContract();

      // create nft
      let nftId = nfts.getId(mbConstants.CONTRACT_ADDRESS, tokenId)
      let nft = NFT.load(nftId);
      if (nft === null) {
        nft = mint(tokenId, block, hash, timestamp);
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
        timestamp,
        "{}",
        paymentToken
      )
    }
  }
}

export function mint(
  tokenId: BigInt,
  block: BigInt,
  hash: Bytes,
  timestamp: BigInt
): NFT {
  /* Define the minting details from the Minted event. */
  let tokenURI = getTokenUri(tokenId);
  let metadata = "{}";
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
    mbConstants.CONTRACT_ADDRESS,
    tokenId,
    creatorAddress,
    block,
    hash,
    timestamp,
    tokenURI,
    metadata
  );
}