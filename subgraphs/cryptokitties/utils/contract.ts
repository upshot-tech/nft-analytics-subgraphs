import { Contract } from "../../../types/schema";
import * as contracts from "../../../utils/entities/contracts";
import { CryptoKitties_ERC721 as ERC721 } from "../../../types/CryptoKitties_ERC721/CryptoKitties_ERC721";
import * as ckConstants from "../constants";

/* Returns a CryptoKitties ERC721 contract instance. */
export function getERC721Instance(): ERC721 {
  return ERC721.bind(ckConstants.CONTRACT_ADDRESS);
}

export function getContract(): Contract {
  let contract = Contract.load(ckConstants.CONTRACT_ADDRESS.toHexString());
  if (contract === null) {
    contract = contracts.create(
      ckConstants.CONTRACT_ADDRESS,
      ckConstants.CONTRACT_URI,
      ckConstants.CONTRACT_NAME,
      ckConstants.CONTRACT_SYMBOL,
      ckConstants.CONTRACT_METADATA
    );
  }

  return contract as Contract;
}
