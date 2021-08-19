import { Address } from "@graphprotocol/graph-ts";
import { Account, Contract } from "../../types/schema";
import { ZERO } from "../../constants";

/*
 * Create a new Contract entity.
 *
 * Adds a new Contract to the subgraph.
 */
export function create(
  contractAddress: Address,
  uri: string,
  name: string,
  symbol: string,
  metadata: string,
  standard: string = ""
  ): Contract {
  let contract = new Contract(contractAddress.toHexString());

  /* Initialize contract information */
  contract.uri = uri;
  contract.name = name;
  contract.symbol = symbol;
  contract.metadata = metadata;

  /* Initialize transaction counts */
  contract.totalMinted = ZERO;
  contract.totalSales = ZERO;
  contract.totalSalesWei = ZERO;
  contract.avgSaleWei = ZERO;
  contract.totalTransfers = ZERO;

  /* Initialize participants */
  contract.buyers = [];
  contract.sellers = [];
  contract.creators = [];

  if (standard != "") {
    contract.standard = standard
  }

  contract.save();

  return contract as Contract;
}

/*
 * Add buyer
 *
 * Appends a buyer to the contract.buyers array if it doesn't exist.
 */
export function addBuyer(contract: Contract, buyer: Account): void {
  let buyers = contract.buyers;
  if (!buyers.includes(buyer.id)) {
    buyers.push(buyer.id);
    contract.buyers = buyers;
  }

  contract.save();
}

/*
 * Add seller
 *
 * Appends a seller to the contract.sellers array if it doesn't exist.
 */
export function addSeller(contract: Contract, seller: Account): void {
  let sellers = contract.buyers;

  if (!sellers.includes(seller.id)) {
    sellers.push(seller.id);
    contract.sellers = sellers;
  }

  contract.save();
}

/*
 * Add creator
 *
 * Appends a creator to the contract.creators array if it doesn't exist.
 */
export function addCreator(contract: Contract, creator: Account): void {
  let creators = contract.creators;

  if (!creators.includes(creator.id)) {
    creators.push(creator.id);
    contract.creators = creators;
  }

  contract.save();
}
