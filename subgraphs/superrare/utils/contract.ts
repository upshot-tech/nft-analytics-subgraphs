import { Contract } from "../../../types/schema";
import * as contracts from "../../../utils/entities/contracts";
import { SuperRare_Market } from "../../../types/SuperRare_Market/SuperRare_Market";
import * as srConstants from "../constants";

/* Returns an SuperRare V1 market contract instance. */
export function getMarketInstance(): SuperRare_Market {
  return SuperRare_Market.bind(srConstants.CONTRACT_ADDRESS);
}

export function getContract(): Contract {
  let contract = Contract.load(srConstants.CONTRACT_ADDRESS.toHexString());
  if (contract === null) {
    contract = contracts.create(
      srConstants.CONTRACT_ADDRESS,
      srConstants.CONTRACT_URI,
      srConstants.CONTRACT_NAME,
      srConstants.CONTRACT_SYMBOL,
      srConstants.CONTRACT_METADATA
    );
  }

  return contract as Contract;
}
