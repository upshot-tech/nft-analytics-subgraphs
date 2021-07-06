import { Contract } from "../../../types/schema";
import * as contracts from "../../../utils/entities/contracts";
import { CryptoPunks_Market as Market } from "../../../types/CryptoPunks_Market/CryptoPunks_Market";
import * as cpConstants from "../constants";

/* Returns a CryptoPunks market contract instance. */
export function getMarketInstance(): Market {
  return Market.bind(cpConstants.CONTRACT_ADDRESS);
}

export function getContract(): Contract {
  let contract = Contract.load(cpConstants.CONTRACT_ADDRESS.toHexString());
  if (contract === null) {
    contract = contracts.create(
      cpConstants.CONTRACT_ADDRESS,
      cpConstants.CONTRACT_URI,
      cpConstants.CONTRACT_NAME,
      cpConstants.CONTRACT_SYMBOL,
      cpConstants.CONTRACT_METADATA
    );
  }

  return contract as Contract;
}
