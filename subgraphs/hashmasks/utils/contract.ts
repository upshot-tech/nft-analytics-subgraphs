import { Contract } from "../../../types/schema";
import * as contracts from "../../../utils/entities/contracts";
import { HashMasks_ERC721 as Market } from "../../../types/HashMasks_ERC721/HashMasks_ERC721";
import * as hmConstants from "../constants";

/* Returns a HashMask market contract instance. */
export function getMarketInstance(): Market {
  return Market.bind(hmConstants.CONTRACT_ADDRESS);
}

export function getContract(): Contract {
  let contract = Contract.load(hmConstants.CONTRACT_ADDRESS.toHexString());
  if (contract === null) {
    contract = contracts.create(
      hmConstants.CONTRACT_ADDRESS,
      hmConstants.CONTRACT_URI,
      hmConstants.CONTRACT_NAME,
      hmConstants.CONTRACT_SYMBOL,
      hmConstants.CONTRACT_METADATA
    );
  }
  return contract as Contract;
}