import { Contract } from "../../../types/schema";
import * as contracts from "../../../utils/entities/contracts";
import { Pudgy_Penguins_ERC721 as Market } from "../../../types/Pudgy_Penguins_ERC721/Pudgy_Penguins_ERC721";
import * as ppConstants from "../constants";

/* Returns a CryptoPunks market contract instance. */
export function getMarketInstance(): Market {
  return Market.bind(ppConstants.CONTRACT_ADDRESS);
}

export function getContract(): Contract {
  let contract = Contract.load(ppConstants.CONTRACT_ADDRESS.toHexString());
  if (contract === null) {
    contract = contracts.create(
      ppConstants.CONTRACT_ADDRESS,
      ppConstants.CONTRACT_URI,
      ppConstants.CONTRACT_NAME,
      ppConstants.CONTRACT_SYMBOL,
      ppConstants.CONTRACT_METADATA
    );
  }

  return contract as Contract;
}
