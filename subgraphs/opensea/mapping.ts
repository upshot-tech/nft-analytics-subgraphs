import { BigInt, Address, Bytes, TypedMap, log } from "@graphprotocol/graph-ts"
import * as accounts from "../../utils/entities/accounts";
import * as contracts from "../../utils/entities/contracts";
import * as nfts from "../../utils/entities/nfts";
import * as saleEvents from "../../utils/entities/saleEvents";
import { Contract, NFT } from "../../types/schema";
import { ONE, ZERO_ADDRESS } from "../../constants";
import { getNftStandard, decodeCallData } from "./utils/opensea"
import { getTokenUri } from "./utils/nft"


import {
  AtomicMatch_Call
} from "../../types/OpenSea_Wyvern/OpenSea_Market"
import { getContract } from "./utils/contract";


export function handleOpenSeaSale(call: AtomicMatch_Call): void {
  let calldataBuy = call.inputs.calldataBuy.toHexString()
  let calldataSell = call.inputs.calldataSell.toHexString()
  let nftStandard = getNftStandard(calldataBuy, calldataSell)
  let addrs = call.inputs.addrs
  let contractAddress = addrs[4]
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
  let creatorAddress = Address.fromString('0x0000000000000000000000000000000000000000')
  let contract = getContract(contractAddress, nftStandard);

  // create nft
  let nftId = nfts.getId(contractAddress, tokenId)
  let nft = NFT.load(nftId);
  if (nft === null) {
    /* Append the NFT to the subgraph. */
    let tokenUri = getTokenUri(contractAddress, tokenId, nftStandard)
    nft = nfts.create(
      contractAddress,
      tokenId,
      creatorAddress,
      call.block.number,
      call.transaction.hash,
      call.block.timestamp,
      tokenUri,
      ''
    );
  }

  /* Append the transaction to the subgraph. */
  let creator = accounts.get(Address.fromString('0x0000000000000000000000000000000000000000'));
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