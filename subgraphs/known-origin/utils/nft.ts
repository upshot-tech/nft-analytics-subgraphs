import { BigInt } from "@graphprotocol/graph-ts";
import { getMarketInstance } from "../utils/contract";
import { getIpfsString } from "../../../utils/data";

export function getMetadata(tokenId: BigInt): string {
  let market = getMarketInstance();
  let tokenData = market.tokenData(tokenId);
  let tokenURI = tokenData.value3.toString();

  return getIpfsString(tokenURI.toString());
}
