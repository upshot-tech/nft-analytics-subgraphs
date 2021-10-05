import { Contract } from "../../../types/schema";
import * as contracts from "../../../utils/entities/contracts";
import { Address } from "@graphprotocol/graph-ts";

export function getContract(address: Address, standard: string): Contract {
  let contract = Contract.load(address.toHexString());
  if (contract === null) {
    contract = contracts.create(
      address,
      '',
      '',
      '',
      '',
      standard
    );
  }
  return contract as Contract;
}
