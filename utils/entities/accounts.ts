import { Address } from "@graphprotocol/graph-ts";
import { Account } from "../../types/schema";
import { ZERO } from "../../constants";

/*
 * Get an Account by the Ethereum wallet address.
 *
 * If an account doesn't exist, a new instance is added
 * to the subgraph with the initial Account attributes.
 */
export function get(walletAddress: Address): Account {
  let account = Account.load(walletAddress.toHexString());

  if (!account) {
    account = new Account(walletAddress.toHexString());

    /* Initialize buy counts. */
    account.totalBought = ZERO;
    account.totalBoughtWei = ZERO;
    account.avgBoughtWei = ZERO;

    /* Initialize sell counts. */
    account.totalSold = ZERO;
    account.totalSoldWei = ZERO;
    account.avgSoldWei = ZERO;

    /* Initialize creation counts. */
    account.totalCreations = ZERO;
    account.totalCreationsSold = ZERO;
    account.totalCreationsSoldWei = ZERO;
    account.avgCreationsSoldWei = ZERO;

    /* Initialize transfer counts. */
    account.totalSent = ZERO;
    account.totalReceived = ZERO;
    account.totalCreationTransfers = ZERO;

    /* Initialize order counts. */
    account.totalOrders = ZERO;
    account.cancelledOrders = ZERO;
    account.activeOrders = ZERO;
    account.finalizedOrders = ZERO;

    account.save();
  }

  return account as Account;
}