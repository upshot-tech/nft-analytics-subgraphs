import { BigInt, Address, Bytes, TypedMap, log } from "@graphprotocol/graph-ts"
import * as lootConstants from "./constants"
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
} from "../../types/Loot_OpenSea_Market/OpenSea_Market"
import {
  Transfer
} from "../../types/Loot_ERC721/Loot_ERC721"

/* Loot: all Transfer events with a fromAddress==ZERO_ADDRESS has a 1:1 mapping of all mints  */
export function handleTransfer(e: Transfer): void {
  let fromAddress = e.params.from;
  let toAddress = e.params.to;
  let tokenId = e.params.tokenId;
  let hash = e.transaction.hash;
  let block = e.block.number;
  let timestamp = e.block.timestamp;
  let contract = getContract();

  if (fromAddress.toHexString() == ZERO_ADDRESS) {
    let tokenURI = getTokenUri(tokenId)
    /* Load the contract instance (create if undefined). */
    contract.totalMinted = contract.totalMinted.plus(ONE);
    contract.save();
    /* Load the creator Account instance (create if undefined). */
    let creator = accounts.get(toAddress);
    contracts.addCreator(contract as Contract, creator);
    creator.totalCreations = creator.totalCreations.plus(ONE);
    creator.save();

    /* Append the NFT to the subgraph. */
    nfts.create(
      lootConstants.CONTRACT_ADDRESS,
      tokenId,
      toAddress,
      e.block.number,
      e.transaction.hash,
      e.block.timestamp,
      tokenURI
    );
  }
  else {
    /* Require referenced NFT entity. */
    let nftId = nfts.getId(lootConstants.CONTRACT_ADDRESS, tokenId);
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
}


export function handleOpenSeaSale(call: AtomicMatch_Call): void {
  let calldataBuy = call.inputs.calldataBuy.toHexString()
  let calldataSell = call.inputs.calldataSell.toHexString()
  // Only allow single sale events (not bundle)
  if (isSingleTrade(calldataBuy, calldataSell)) {
    let addrs = call.inputs.addrs
    let nftAddress = addrs[4]
    // Only allow sale events
    if (nftAddress.toHexString() == lootConstants.CONTRACT_ADDRESS.toHexString()) {
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

      // get nft
      let nftId = nfts.getId(lootConstants.CONTRACT_ADDRESS, tokenId)
      let nft = NFT.load(nftId);
      if (nft === null) {
        log.warning("NFT not found: {}", [nftId]);
        return;
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
