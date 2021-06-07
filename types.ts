import { Asset, BaseAmount } from '@xchainjs/xchain-util'

export type RecoveryTransaction = {
  toAsgardAddress: AsgardInboundAddress
  fromYggAddress: string
  amount: BaseAmount
  asset: Asset
  contractAddress?: string
  signedTxHex?: string
}
// export type AsgardVaultAddress = {
//   chain: string
//   address: string
// }
export type YggVaultAddress = {
  chain: string
  address: string
}
export type YggVault = {
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
