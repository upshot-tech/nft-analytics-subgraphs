import { BigInt, TypedMap } from "@graphprotocol/graph-ts";
import { getERC721Instance } from "../utils/contract";

export function getMetadata(tokenId: BigInt): TypedMap<string, string> {
  let erc721 = getERC721Instance();
  let token = erc721.getKitty(tokenId);
  let metadata = new TypedMap<string, string>();
  metadata.set("matronId", token.value6.toString());
  metadata.set("sireId", token.value7.toString());
  metadata.set("generation", token.value8.toString());
  metadata.set("genes", token.value9.toString());

  return metadata;
}
