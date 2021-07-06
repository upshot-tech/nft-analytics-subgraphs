import { Contract } from "../../../types/schema";
import * as contracts from "../../../utils/entities/contracts";
import { Axie_Infinity_ERC721 as ERC721 } from "../../../types/Axie_Infinity_ERC721/Axie_Infinity_ERC721";
import * as aiConstants from "../constants";

/* Returns an Axie Infinity ERC721 contract instance. */
export function getERC721Instance(): ERC721 {
  return ERC721.bind(aiConstants.CONTRACT_ADDRESS);
}

export function getContract(): Contract {
  let contract = Contract.load(aiConstants.CONTRACT_ADDRESS.toHexString());
  if (contract === null) {
    contract = contracts.create(
      aiConstants.CONTRACT_ADDRESS,
      aiConstants.CONTRACT_URI,
      aiConstants.CONTRACT_NAME,
      aiConstants.CONTRACT_SYMBOL,
      aiConstants.CONTRACT_METADATA
    );
  }

  return contract as Contract;
}
