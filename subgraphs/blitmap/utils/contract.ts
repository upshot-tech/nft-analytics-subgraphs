import { Contract } from "../../../types/schema";
import * as contracts from "../../../utils/entities/contracts";
import { Blitmap_ERC721 as Market } from "../../../types/Blitmap_ERC721/Blitmap_ERC721";
import * as bConstants from "../constants";

/* Returns a CryptoPunks market contract instance. */
export function getMarketInstance(): Market {
  return Market.bind(bConstants.CONTRACT_ADDRESS);
}

export function getContract(): Contract {
  let contract = Contract.load(bConstants.CONTRACT_ADDRESS.toHexString());
  if (contract === null) {
    contract = contracts.create(
      bConstants.CONTRACT_ADDRESS,
      bConstants.CONTRACT_URI,
      bConstants.CONTRACT_NAME,
      bConstants.CONTRACT_SYMBOL,
      bConstants.CONTRACT_METADATA
    );
  }

  return contract as Contract;
}
