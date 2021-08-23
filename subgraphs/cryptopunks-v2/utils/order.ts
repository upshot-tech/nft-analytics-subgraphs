import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Contract, NFT, Order } from "../../../types/schema";
import { getContract } from "./contract";
import { finalize } from "../../../utils/entities/orders"

/* Returns the order id given a contract and token */
export function getOrderId(contract: Contract, nft: NFT): string {
  let orderId = contract.id
    .concat("/")
    .concat(nft.id)
    .concat("/")
    .concat(nft.totalOrders.toString());

  return orderId;
}


export function finalizeBidWithMaker(nft: NFT, maker: Address): void {
  let nbOrders = nft.totalOrders
  let contract = getContract()
  for (let i = 0; i < parseInt(nbOrders.toString()); i++) {
    let orderId = contract.id
    .concat("/")
    .concat(nft.id)
    .concat("/")
    .concat(i.toString());
    // if order created by maker, finalize it
    let order = Order.load(orderId)
    if (order === null) {
      return;
    }
    if (order.maker == maker.toHexString() && order.type == "Bid") {
      finalize(order as Order)
      return
    }
  }
}


export function finalizeAskWithMaker(nft: NFT, maker: Address): void {
  let nbOrders = nft.totalOrders
  let contract = getContract()
  for (let i = 0; i < parseInt(nbOrders.toString()); i++) {
    let orderId = contract.id
    .concat("/")
    .concat(nft.id)
    .concat("/")
    .concat(i.toString());
    // if order created by maker, finalize it
    let order = Order.load(orderId)
    if (order === null) {
      return;
    }
    if (order.maker == maker.toHexString() && order.type == "Ask") {
      finalize(order as Order)
      return
    }
  }
}