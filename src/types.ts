import { Address } from '@xchainjs/xchain-client'
import { Asset, BaseAmount } from '@xchainjs/xchain-util'

export type RecoveryTransaction = {
  toAsgardAddress: AsgardInboundAddress
  fromYggAddress: Address
  asset: Asset
  amountToTransfer: BaseAmount
  amountAvailable: BaseAmount
  memo: string
  // gas: number
}
export type YggCoin = {
  address: Address
  asset: Asset
  amount: BaseAmount
}
export type YggVault = {
  pubKey: string
  statusSince: string
  coins: Array<YggCoin>
}
export type AsgardInboundAddress = {
  chain: string
  pub_key: string
  address: string
  halted: boolean
  gas_rate: number
}
