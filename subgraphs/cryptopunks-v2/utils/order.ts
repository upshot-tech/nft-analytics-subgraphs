import { Address, BigInt, Bytes, log} from "@graphprotocol/graph-ts";
import { Contract, NFT, Order } from "../../../types/schema";
import { getContract } from "./contract";
import { Account } from "../../../types/schema";
import * as orders from "../../../utils/entities/orders";
import * as accounts from "../../../utils/entities/accounts";


/* Returns the order id given a contract and token */
export function getOrderId(contract: Contract, nft: NFT): string {
  let orderId = contract.id
    .concat("/")
    .concat(nft.id)
    .concat("/")
    .concat(nft.totalOrders.toString());

  return orderId;
}

// replaces the previous highest order on the same side of the orderbook (mimics the punk contract)
export function addOrderForPunk(
  nft: NFT, 
  contract: Contract, 
  maker: Account, 
  type: string,
  paymentToken: Address,
  basePrice: BigInt, 
  block: BigInt,
  hash: Bytes, 
  timestamp: BigInt): void {
  // check for existing orders
  let currentOrder = getOrderForPunk(nft, type)
  // if no order exist for type, add this one
  if (currentOrder == null) {
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
  // if an order already exist, replace it with this one
  else {
    orders.cancel(currentOrder as Order)
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
}

// Returns the current Bid/Ask for punk or null if non-existent
export function getOrderForPunk(nft: NFT, type: string): Order | null {
  let nbOrders = nft.totalOrders
  let contract = getContract()
  for (let i = 0; i < parseInt(nbOrders.toString()); i++) {
    let orderId = contract.id
    .concat("/")
    .concat(nft.id)
    .concat("/")
    .concat(i.toString());

    let order = Order.load(orderId)
    if (order == null) {
      continue;
    }
    if (order.type == type && order.state == "Active") {
      return order as Order
    }
  }
  return null
}

export function finalizeOrder(nft: NFT, maker: Address): boolean {
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
      continue;
    }
    if (order.maker == maker.toHexString() && order.state == "Active") {
      orders.finalize(order as Order)
      return true
    }
  }
  return false
}