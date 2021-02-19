import { Axie_Infinity_ERC721 as ERC721 } from "../../../types/Axie_Infinity_ERC721/Axie_Infinity_ERC721";
import { CONTRACT_ADDRESS } from "../constants";

/* Returns an Axie Infinity ERC721 contract instance. */
export function getERC721Instance(): ERC721 {
  return ERC721.bind(CONTRACT_ADDRESS);
}
