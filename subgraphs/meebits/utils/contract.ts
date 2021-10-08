import { Contract } from "../../../types/schema";
import * as contracts from "../../../utils/entities/contracts";
import { Meebits_Market as Market } from "../../../types/Meebits_Market/Meebits_Market";
import * as mbConstants from "../constants";

/* Returns a CryptoPunks market contract instance. */
export function getMarketInstance(): Market {
  return Market.bind(mbConstants.CONTRACT_ADDRESS);
}

export function getContract(): Contract {
  let contract = Contract.load(mbConstants.CONTRACT_ADDRESS.toHexString());
  if (contract === null) {
    contract = contracts.create(
      mbConstants.CONTRACT_ADDRESS,
      mbConstants.CONTRACT_URI,
      mbConstants.CONTRACT_NAME,
      mbConstants.CONTRACT_SYMBOL,
      mbConstants.CONTRACT_METADATA
    );
  }

  return contract as Contract;
}
