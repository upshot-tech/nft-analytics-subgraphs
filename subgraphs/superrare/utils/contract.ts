import * as srConstants from "../constants";
import * as contracts from "../../../utils/entities/contracts";
import { SuperRare_Market } from "../../../types/SuperRare_Market/SuperRare_Market";

/*
 * Get Market Instance (SuperRare)
 *
 * Returns an instance of the SuperRare contract
 * for public method calls.
 */
export function getMarketInstance(): SuperRare_Market {
  return SuperRare_Market.bind(srConstants.CONTRACT_ADDRESS);
}

/*
 * Create the SuperRare V1 contract.
 *
 * Appends the SuperRare contract to the subgraph.
 */
export function createContractV1(): void {
  contracts.create(
    srConstants.CONTRACT_ADDRESS,
    srConstants.CONTRACT_URI,
    srConstants.CONTRACT_NAME,
    srConstants.CONTRACT_SYMBOL,
    srConstants.CONTRACT_METADATA
  );
}

/*
 * Create the SuperRare V2 contract.
 *
 * Appends the SuperRare V2 contract to the subgraph.
 */
export function createContractV2(): void {
  contracts.create(
    srConstants.CONTRACT_V2_ADDRESS,
    srConstants.CONTRACT_URI,
    srConstants.CONTRACT_V2_NAME,
    srConstants.CONTRACT_SYMBOL,
    srConstants.CONTRACT_METADATA
  );
}
