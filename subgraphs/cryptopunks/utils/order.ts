import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Contract, NFT } from "../../../types/schema";

/* Returns the order id given a contract and token */
export function getOrderId(contract: Contract, nft: NFT): string {
  let orderId = contract.id
    .concat("/")
    .concat(nft.id)
    .concat("/")
    .concat(nft.totalOrders.toString());

  return orderId;
}
