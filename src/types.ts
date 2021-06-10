import { Asset, BaseAmount } from '@xchainjs/xchain-util'

export type RecoveryTransaction = {
  toAsgardAddress: AsgardInboundAddress
  fromYggAddress: string
  memo: string
  asset: Asset
  amountToTransfer: BaseAmount
  amountAvailable: BaseAmount
  gas: number

  // signedTxHex?: string
}
export type YggVaultAddress = {
  chain: string
  address: string
}
export type YggVault = {
  pubKey: string
  statusSince: string
  coins: Array<Coin>
  addresses: Array<YggVaultAddress>
}
export type AsgardInboundAddress = {
  chain: string
  pub_key: string
  address: string
  halted: boolean
  gas_rate: number
}

export type Coin = {
  asset: string
  amount: string
}

export function isTransactionValid(tx: RecoveryTransaction): boolean {
  return tx.amountAvailable.minus(tx.amountToTransfer.plus(tx.gas)).gte(0)
}
