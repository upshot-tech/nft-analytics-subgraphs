import { BigInt, Address, log } from "@graphprotocol/graph-ts";
import { getMarketInstance } from "../utils/contract";
import { getIpfsString } from "../../../utils/data";

/* Returns the Meebits traits constant by tokenID */
export function getMetadata(contractAddress: Address, tokenId: BigInt): string {
  let market = getMarketInstance(contractAddress);
  // Currently ipfs.cat is deprecated, so we are only fetching the tokenURI for now
  let callResult = market.try_tokenURI(tokenId)
  if (callResult.reverted) {
    log.info("get tokenURI reverted for asset: {}", [contractAddress.toHexString(), tokenId.toString()])
    return "{}"
  }
  else {
    let tokenURI = callResult.value.toString();
    return tokenURI
  }
}


