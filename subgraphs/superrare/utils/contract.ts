import { SuperRare_Market as Market } from "../../../types/SuperRare_Market/SuperRare_Market";
import { CONTRACT_ADDRESS } from "../constants";

export function getMarketInstance(): Market {
  return Market.bind(CONTRACT_ADDRESS);
}
