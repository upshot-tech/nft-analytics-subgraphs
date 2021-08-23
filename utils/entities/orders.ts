  
import { Account, Contract, NFT, Order } from "../../types/schema";
import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import * as accounts from "./accounts";
import { ONE, ZERO_ADDRESS } from "../../constants";

export function create(  
  nft: NFT,
  contract: Contract,
  maker: Account,
  type: string,
  paymentToken: Address,
  basePrice: BigInt,
  block: BigInt,
  hash: Bytes,
  timestamp: BigInt,
  taker: Account = null,
  staticTarget: Bytes = null,
  staticExtraData: Bytes = null,
  extra: BigInt = null,
  expiration: BigInt = null
  ): Order {
  /* Record the new transfer event */
  let orderId = contract.id
    .concat("/")
    .concat(nft.id)
    .concat("/")
    .concat(nft.totalOrders.toString());

  let order = new Order(orderId);

  order.contract = contract.id;
  order.nft = nft.id;
  order.maker = maker.id;
  order.type = type;
  order.state = "Active";
  order.paymentToken = paymentToken;
  order.basePrice = basePrice;
  order.staticTarget = staticTarget;
  order.staticExtraData = staticExtraData;
  order.extra = extra;
  order.expiration = expiration;
  order.block = block;
  order.hash = hash;
  order.timestamp = timestamp;

  nft.totalOrders = nft.totalOrders.plus(ONE);
  nft.activeOrders = nft.activeOrders.plus(ONE);
  maker.totalOrders = nft.totalOrders.plus(ONE);
  maker.activeOrders = nft.activeOrders.plus(ONE);

  /* Graph mutation */
  contract.save();
  nft.save();
  maker.save();
  order.save();

  return order;
}

export function cancel(order: Order): void {
  order.state = "Cancelled";

  let maker = Account.load(order.maker);
  if (maker === null) {
    log.warning("Account not found: {}", [maker.id]);
    return;
  }
  let nft = NFT.load(order.nft);
  if (nft === null) {
    log.warning("NFT not found: {}", [nft.id]);
    return;
  }

  nft.activeOrders = nft.activeOrders.minus(ONE);
  nft.cancelledOrders = nft.cancelledOrders.plus(ONE);
  maker.activeOrders = nft.activeOrders.minus(ONE);
  maker.cancelledOrders = maker.cancelledOrders.plus(ONE);

  /* Graph mutation */
  nft.save();
  maker.save();
  order.save();
}

export function finalize(order: Order): void {
  order.state = "Finalized";

  let maker = Account.load(order.maker);
  if (maker === null) {
    log.warning("Account not found: {}", [maker.id]);
    return;
  }
  let nft = NFT.load(order.nft);
  if (nft === null) {
    log.warning("NFT not found: {}", [nft.id]);
    return;
  }

  nft.activeOrders = nft.activeOrders.minus(ONE);
  nft.finalizedOrders = nft.cancelledOrders.plus(ONE);
  maker.activeOrders = nft.activeOrders.minus(ONE);
  maker.finalizedOrders = maker.cancelledOrders.plus(ONE);

  /* Graph mutation */
  nft.save();
  maker.save();
  order.save();
}