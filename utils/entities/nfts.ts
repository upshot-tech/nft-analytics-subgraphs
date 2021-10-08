import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { NFT } from "../../types/schema";
import { ZERO } from "../../constants";

export function getId(contractAddress: Address, tokenId: BigInt): string {
  return contractAddress
    .toHexString()
    .concat("/")
    .concat(tokenId.toString());
}

export function create(
  contractAddress: Address,
  tokenId: BigInt,
  creatorAddress: Address,
  block: BigInt,
  hash: Bytes,
  timestamp: BigInt,
  uri: string = "",
  metadata: string = "{}"
): NFT {
  /* Create an NFT instance. */
  let nft = new NFT(getId(contractAddress, tokenId));

  nft.tokenId = tokenId;
  nft.uri = uri;
  nft.contract = contractAddress.toHexString();
  nft.creator = creatorAddress.toHexString();
  nft.metadata = metadata;
  nft.block = block;
  nft.hash = hash;
  nft.timestamp = timestamp;

  nft.totalSales = ZERO;
  nft.totalSalesWei = ZERO;
  nft.avgSaleWei = ZERO;
  nft.totalTransfers = ZERO;
  nft.totalOrders = ZERO;
  nft.activeOrders = ZERO;
  nft.cancelledOrders = ZERO;
  nft.finalizedOrders = ZERO;

  nft.save();

  return nft;
}