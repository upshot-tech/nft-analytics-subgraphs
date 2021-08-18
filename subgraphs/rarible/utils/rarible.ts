import { BigInt, Address, TypedMap, log} from "@graphprotocol/graph-ts"

const WORD_SIZE = 64


export function wordLength(data: string): number {
  return Math.floor(data.length / WORD_SIZE)
}


export function decodeAssetData(data: string): TypedMap<string, string> {
  let assetData = new TypedMap<string, string>();
  let nbWords = Math.floor(data.length / WORD_SIZE)
  let addressWord = data.slice(0, WORD_SIZE)
  let tokenIdWord = data.slice(WORD_SIZE)
  let tokenIdDecimal: number = parseInt(tokenIdWord, 16)
  let tokenIdParsed = tokenIdDecimal.toString().split(".")
  assetData.set("address", "0x" + addressWord.slice(24))
  assetData.set("tokenId", tokenIdParsed[0])
  return assetData
}



