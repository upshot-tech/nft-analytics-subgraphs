import { BigInt, log, Address } from "@graphprotocol/graph-ts";
import { getId } from "../../../utils/entities/nfts"
import {
  ERC1155
} from "../../../types/OpenSea_Wyvern/ERC1155"

import {
  ERC721
} from "../../../types/OpenSea_Wyvern/ERC721"


/* Returns the nft tokenUri */
export function getTokenUri(contractAddress: Address, tokenId: BigInt, standard: string): string {
  if (standard === "ERC721") {
    let erc721 = ERC721.bind(contractAddress)
    let tokenUri = erc721.try_tokenURI(tokenId)
    if (tokenUri.reverted) {
      let id = getId(contractAddress, tokenId)
      log.info("get tokenURI reverted for id: {}", [id])
      return "{}"
    }
    return tokenUri.value
  } else {
    let erc1155 = ERC1155.bind(contractAddress)
    let tokenUri = erc1155.try_uri(tokenId)
    if (tokenUri.reverted) {
      let id = getId(contractAddress, tokenId)
      log.info("get tokenURI reverted for id: {}", [id])
      return "{}"
    }
    return tokenUri.value
  }
}