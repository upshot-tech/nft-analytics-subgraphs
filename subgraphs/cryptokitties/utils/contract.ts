import { CryptoKitties_ERC721 as ERC721 } from "../../../types/CryptoKitties_ERC721/CryptoKitties_ERC721";
import { CONTRACT_ADDRESS } from "../constants";

/* Returns a CryptoKitties ERC721 contract instance. */
export function getERC721Instance(): ERC721 {
  return ERC721.bind(CONTRACT_ADDRESS);
}
