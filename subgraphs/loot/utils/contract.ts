import { Contract } from "../../../types/schema";
import * as contracts from "../../../utils/entities/contracts";
import { Loot_ERC721 as Market } from "../../../types/Loot_ERC721/Loot_ERC721";
import * as lootConstants from "../constants";

/* Returns a CryptoPunks market contract instance. */
export function getMarketInstance(): Market {
  return Market.bind(lootConstants.CONTRACT_ADDRESS);
}

export function getContract(): Contract {
  let contract = Contract.load(lootConstants.CONTRACT_ADDRESS.toHexString());
  if (contract === null) {
    contract = contracts.create(
      lootConstants.CONTRACT_ADDRESS,
      lootConstants.CONTRACT_URI,
      lootConstants.CONTRACT_NAME,
      lootConstants.CONTRACT_SYMBOL,
      lootConstants.CONTRACT_METADATA
    );
  }

  return contract as Contract;
}
