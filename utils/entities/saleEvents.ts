import { Account, Contract, NFT, SaleEvent } from "../../types/schema";
import { BigInt, Bytes, Address } from "@graphprotocol/graph-ts";
import { ONE, ZERO_ADDRESS } from "../../constants";

export function create(
  nft: NFT,
  contract: Contract,
  buyer: Account,
  seller: Account,
  creator: Account,
  amount: BigInt,
  block: BigInt,
  hash: Bytes,
  timestamp: BigInt,
  metadata: string = "{}",
  paymentToken: string = "",
): void {
  /* Record the new sales event */
  let saleId = contract.id
    .concat("/")
    .concat(nft.id)
    .concat("/")
    .concat(nft.totalSales.toString());

  let sale = new SaleEvent(saleId);

  sale.idx = nft.totalSales;
  sale.contract = contract.id;
  sale.nft = nft.id;
  sale.amount = amount;
  sale.paymentToken = paymentToken;
  sale.buyer = buyer.id;
  sale.seller = seller.id;
  sale.block = block;
  sale.hash = hash;
  sale.timestamp = timestamp;
  sale.metadata = metadata;

  /* Increment the sales counts */
  contract.totalSales = contract.totalSales.plus(ONE);
  nft.totalSales = nft.totalSales.plus(ONE);
  buyer.totalBought = buyer.totalBought.plus(ONE);
  seller.totalSold = seller.totalSold.plus(ONE);

  /* Increment the sales amounts */
  contract.totalSalesWei = contract.totalSalesWei.plus(sale.amount);
  nft.totalSalesWei = nft.totalSalesWei.plus(sale.amount);
  buyer.totalBoughtWei = buyer.totalBoughtWei.plus(sale.amount);
  seller.totalSoldWei = seller.totalSoldWei.plus(sale.amount);

  /* Calculate average sale prices */
  contract.avgSaleWei = contract.totalSalesWei.div(contract.totalSales);
  nft.avgSaleWei = nft.totalSalesWei.div(nft.totalSales);
  buyer.avgBoughtWei = buyer.totalBoughtWei.div(buyer.totalBought);
  seller.avgSoldWei = seller.totalSoldWei.div(seller.totalSold);

  /* Update creator stats */
  creator.totalCreationsSold = creator.totalCreationsSold.plus(ONE);
  creator.totalCreationsSoldWei = creator.totalCreationsSoldWei.plus(
    sale.amount
  );
  creator.avgCreationsSoldWei = creator.totalCreationsSoldWei.div(
    creator.totalCreationsSold
  );

  /* Graph mutation */
  contract.save();
  buyer.save();
  seller.save();
  creator.save();
  nft.save();
  sale.save();
}
