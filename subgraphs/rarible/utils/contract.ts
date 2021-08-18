import { BigInt, Address, log } from "@graphprotocol/graph-ts";
import { Contract } from "../../../types/schema";
import * as contracts from "../../../utils/entities/contracts";
import { ERC721 } from "../../../types/Rarible_Market/ERC721";
import { ERC1155 } from "../../../types/Rarible_Market/ERC1155";

import * as rConstants from "../constants";

/* Returns a CryptoPunks market contract instance. */
export function getERC721Instance(contractAddress: Address): ERC721 {
  return ERC721.bind(contractAddress);
}

export function getERC1155Instance(contractAddress: Address): ERC1155 {
  return ERC1155.bind(contractAddress);
}

export function getContract(): Contract {
  let contract = Contract.load(rConstants.CONTRACT_ADDRESS.toHexString());
  if (contract === null) {
    contract = contracts.create(
      rConstants.CONTRACT_ADDRESS,
      rConstants.CONTRACT_URI,
      rConstants.CONTRACT_NAME,
      rConstants.CONTRACT_SYMBOL,
      rConstants.CONTRACT_METADATA
    );
  }

  return contract as Contract;
}
