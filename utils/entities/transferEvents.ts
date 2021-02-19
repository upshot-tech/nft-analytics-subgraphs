import { Account, Contract, NFT, TransferEvent } from "../../types/schema";
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import * as accounts from "./accounts";
import { ONE } from "../../constants";

export function create(
  nft: NFT,
  contract: Contract,
  from: Account,
  to: Account,
  block: BigInt,
  hash: Bytes,
  timestamp: BigInt
): void {
  /* Record the new transfer event */
  let transferId = contract.id
    .concat("/")
    .concat(nft.id)
    .concat("/")
    .concat(nft.totalTransfers.toString());

  let transfer = new TransferEvent(transferId);
  let creator = accounts.get(Address.fromString(nft.creator));

  transfer.idx = nft.totalTransfers;
  transfer.contract = contract.id;
  transfer.nft = nft.id;
  transfer.from = from.id;
  transfer.to = to.id;
  transfer.block = block;
  transfer.hash = hash;
  transfer.timestamp = timestamp;

  /* Increment the transfer counts */
  contract.totalTransfers = contract.totalTransfers.plus(ONE);
  nft.totalTransfers = nft.totalTransfers.plus(ONE);
  from.totalSent = from.totalSent.plus(ONE);
  to.totalReceived = to.totalReceived.plus(ONE);
  creator.totalCreationTransfers = creator.totalCreationTransfers.plus(ONE);

  /* Graph mutation */
  contract.save();
  nft.save();
  from.save();
  to.save();
  creator.save();
  transfer.save();
}
