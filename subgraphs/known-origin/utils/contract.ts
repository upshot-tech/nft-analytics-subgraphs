import { Known_Origin_Market as Market } from "../../../types/Known_Origin_Market/Known_Origin_Market";
import { CONTRACT_ADDRESS } from "../constants";

export function getMarketInstance(): Market {
  return Market.bind(CONTRACT_ADDRESS);
}
