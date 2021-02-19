import { getERC721Instance } from "./contract";
import { BigInt, TypedMap } from "@graphprotocol/graph-ts";

/*
 * Returns the metadata for a Axie Infinity tokenID.
 *
 * Axies have a single `genes` trait (uint256).
 */
export function getMetadata(tokenId: BigInt): TypedMap<string, string> {
  let erc721 = getERC721Instance();
  let token = erc721.getAxie(tokenId);
  let metadata = new TypedMap<string, string>();
  metadata.set("genes", token.value0.toString());

  return metadata;
}
