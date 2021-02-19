import { getIpfsString } from "../../../utils/data";

export function getMetadata(tokenURI: string): string {
  return getIpfsString(tokenURI.toString());
}
