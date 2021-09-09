import { BigInt, log } from "@graphprotocol/graph-ts";
import { getMarketInstance } from "../utils/contract";
import { BASE_TOKEN_URI } from "../constants";
import { getIpfsString } from "../../../utils/data";

/* Returns the Meebits traits constant by tokenID */
export function getTokenUri(tokenId: BigInt): string {  
  return BASE_TOKEN_URI.concat(tokenId.toString())
}
