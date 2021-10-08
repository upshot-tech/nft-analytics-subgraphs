import { BigInt } from "@graphprotocol/graph-ts";
import { NFT_METADATA_TRAITS } from "../constants";

/* Returns the CryptoPunk traits constant by tokenID */
export function getMetadata(tokenId: BigInt): string {
  return "{}" 
  //NFT_METADATA_TRAITS.get(tokenId.toString()) as string;
}
