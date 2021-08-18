import { BigInt, Address, TypedMap, log} from "@graphprotocol/graph-ts"

const WORD_SIZE = 64
const SIGNATURE_ERC115 = "0x973bb640"
const SIGNATURE_ERC721 = "0x73ad2146"

export function isERC721(data: string): boolean {
  if (data == SIGNATURE_ERC721) {
    return true
  }
  else {
    return false
  }
}

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



