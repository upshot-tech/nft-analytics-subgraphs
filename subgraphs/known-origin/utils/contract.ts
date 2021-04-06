import { Known_Origin_Market as Market } from "../../../types/Known_Origin_Market/Known_Origin_Market";
import { Contract } from "../../../types/schema";
import * as contracts from "../../../utils/entities/contracts";
import { CONTRACT_ADDRESS } from "../constants";
import * as koConstants from "../constants";

export function getMarketInstance(): Market {
  return Market.bind(CONTRACT_ADDRESS);
}

export function getContract(): Contract {
  let contract = Contract.load(koConstants.CONTRACT_ADDRESS.toHexString());
  if (contract === null) {
    contract = contracts.create(
      koConstants.CONTRACT_ADDRESS,
      koConstants.CONTRACT_URI,
      koConstants.CONTRACT_NAME,
      koConstants.CONTRACT_SYMBOL,
      koConstants.CONTRACT_METADATA
    );
  }

  return contract as Contract;
}
