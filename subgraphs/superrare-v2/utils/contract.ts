import { SuperRare_v2_ERC721 } from "../../../types/SuperRare_v2_ERC721/SuperRare_v2_ERC721";
import { Contract } from "../../../types/schema";
import * as contracts from "../../../utils/entities/contracts";
import { CONTRACT_ADDRESS } from "../constants";
import * as sr2Constants from "../constants";

/* Returns an SuperRare V2 ERC721 contract instance. */
export function getERC721Instance(): SuperRare_v2_ERC721 {
  return SuperRare_v2_ERC721.bind(CONTRACT_ADDRESS);
}

export function getContract(): Contract {
  let contract = Contract.load(sr2Constants.CONTRACT_ADDRESS.toHexString());
  if (contract === null) {
    contract = contracts.create(
      sr2Constants.CONTRACT_ADDRESS,
      sr2Constants.CONTRACT_URI,
      sr2Constants.CONTRACT_NAME,
      sr2Constants.CONTRACT_SYMBOL,
      sr2Constants.CONTRACT_METADATA
    );
  }

  return contract as Contract;
}
