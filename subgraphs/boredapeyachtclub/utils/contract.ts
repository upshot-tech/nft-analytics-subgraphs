import { Contract } from "../../../types/schema";
import * as contracts from "../../../utils/entities/contracts";
import { BAYC_ERC721 as Market } from "../../../types/BAYC_ERC721/BAYC_ERC721";
import * as baycConstants from "../constants";

/* Returns a CryptoPunks market contract instance. */
export function getMarketInstance(): Market {
  return Market.bind(baycConstants.CONTRACT_ADDRESS);
}

export function getContract(): Contract {
  let contract = Contract.load(baycConstants.CONTRACT_ADDRESS.toHexString());
  if (contract === null) {
    contract = contracts.create(
      baycConstants.CONTRACT_ADDRESS,
      baycConstants.CONTRACT_URI,
      baycConstants.CONTRACT_NAME,
      baycConstants.CONTRACT_SYMBOL,
      baycConstants.CONTRACT_METADATA
    );
  }

  return contract as Contract;
}
