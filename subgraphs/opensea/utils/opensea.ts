import { BigInt, Address, TypedMap, log} from "@graphprotocol/graph-ts"

const ERC721_SINGATURE = "0x23b872dd"
const ERC1155_SIGNATURE = "0xf242432a"
const WORD_SIZE = 64
const SIGNATRUE_SIZE = 10

export function getNftStandard(buyData: string, sellData: string): string {
  let buySign = buyData.slice(0, SIGNATRUE_SIZE)
  let sellSign = sellData.slice(0, SIGNATRUE_SIZE)
  if (buySign == sellSign && buySign == ERC721_SINGATURE) {
    return 'ERC721'
  }
  else {
    return 'ERC1155'
  }
}

// decompose buy and sell calldata. The replacement pattern is made so that
export function decodeCallData(calldataBuy: string, buyReplacement: string, calldataSell: string): TypedMap<string, string> {
  // clean data
  let buyData = calldataBuy.slice(SIGNATRUE_SIZE)
  let sellData = calldataSell.slice(SIGNATRUE_SIZE)
  let replacement = buyReplacement.slice(2)
  // divide into words and apply replacement mask
  let res: string[] = new Array()
  let nbWords = Math.floor(buyData.length / WORD_SIZE)
  for (let i = 0; i < nbWords; i++) {
    let index = WORD_SIZE * i
    let maskWord = replacement.slice(index, index + WORD_SIZE)
    let arrayWord = buyData.slice(index, index + WORD_SIZE)
    let desiredWord = sellData.slice(index, index + WORD_SIZE)
    let filteredWord = wordOperation(arrayWord, desiredWord, maskWord)
    res.push(filteredWord)
  }
  // parse result
  let seller = res[0]
  let buyer = res[1]
  let tokenId = res[2]
  let sellerAddress = seller.slice(24)
  let buyerAddress = buyer.slice(24)
  let tokenIdDecimal: number = parseInt(tokenId, 16)
  let tokenIdParsed = tokenIdDecimal.toString().split(".")
  let singleTrade = new TypedMap<string, string>();
  singleTrade.set("seller", "0x" + sellerAddress)
  singleTrade.set("buyer", "0x" + buyerAddress)
  singleTrade.set("tokenId", tokenIdParsed[0])
  return singleTrade
}


function wordOperation(arrayWord: string, desiredWord: string, maskWord: string): string {
  let filteredWord = ""
  for (let i = 0; i <= WORD_SIZE - 1; i += 2) {
    let maskByte = maskWord.slice(i, i + 2)
    let arrayByte = arrayWord.slice(i, i + 2)
    let desiredByte = desiredWord.slice(i, i + 2)
    if (maskByte == "ff") {
      filteredWord += desiredByte
    }
    else if (maskByte == "00") {
      filteredWord += arrayByte
    }
    else {
      // shorter words todo
      log.warning("Decoding opensea call data with an odd word size length: {}", [maskWord.length.toString()])
    }

  }
  return filteredWord
}