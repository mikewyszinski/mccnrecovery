export type YggCoin = {
  amount?: string
  chain?: string
  symbol?: string
  contractAddress?: string
}
export type AsgardVault = {
  chain: string
  address: string
}
export type AsgardInboundAddress = {
  chain: string
  pub_key: string
  address: string
  halted: boolean
  gas_rate: number
}
export type RecoveryTransaction = {
  fromYgg: YggCoin
  toAsgard: AsgardInboundAddress
}
