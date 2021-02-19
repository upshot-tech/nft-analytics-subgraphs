import { CryptoPunks_Market as Market } from "../../../types/CryptoPunks_Market/CryptoPunks_Market";
import { CONTRACT_ADDRESS } from "../constants";

export function getMarketInstance(): Market {
  return Market.bind(CONTRACT_ADDRESS);
}
