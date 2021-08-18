import { BigInt, Address, log } from "@graphprotocol/graph-ts";
import { getERC1155Instance, getERC721Instance } from "../utils/contract";
import { getIpfsString } from "../../../utils/data";

/* Returns the Meebits traits constant by tokenID */
// different method for ERC1155 and ERC721
export function getTokenUri(contractAddress: Address, tokenId: BigInt, isERC721: boolean): string {

  if (isERC721) {
    let market = getERC721Instance(contractAddress);
    // Currently ipfs.cat is deprecated, so we are only fetching the tokenURI for now
    let callResult = market.try_tokenURI(tokenId)
    if (callResult.reverted) {
      log.warning("ERC721: get tokenURI reverted for address: {}", [contractAddress.toHexString()])
      log.warning("ERC721: get tokenURI reverted for tokenId: {}", [tokenId.toString()])
      return "{}"
    }
    else {
      let tokenURI = callResult.value.toString();
      return tokenURI
    }
  }
  else {
    let market = getERC1155Instance(contractAddress);
    // Currently ipfs.cat is deprecated, so we are only fetching the tokenURI for now
    let callResult = market.try_uri(tokenId)
    if (callResult.reverted) {
      log.warning("ERC1155: get tokenURI reverted for address: {}", [contractAddress.toHexString()])
      log.warning("ERC1155: get tokenURI reverted for tokenId: {}", [tokenId.toString()])
      return "{}"
    }
    else {
      let tokenURI = callResult.value.toString();
      return tokenURI
    }
  }
  
}


