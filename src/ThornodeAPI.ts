import Axios from 'axios'
import { AsgardInboundAddress, YggCoin, YggVault } from './types'
import { Network } from '@xchainjs/xchain-client'
import { assetFromString, baseAmount, BaseAmount, Asset } from '@xchainjs/xchain-util'
import { BigNumber } from 'bignumber.js'

const THORCHAIN_DECIMALS = 8

export class ThornodeAPI {
  private _baseUrl = ''
  public get baseUrl() {
    return this._baseUrl
  }
  public set baseUrl(value) {
    this._baseUrl = value
  }
  private network: Network
  constructor(network: Network) {
    this.network = network
    this.baseUrl =
      this.network === 'testnet' ? 'https://testnet.thornode.thorchain.info' : 'https://thornode.thorchain.info'
  }

  async getAsgardInboundAddresses(): Promise<AsgardInboundAddress[]> {
    const resp = await Axios.get(`${this._baseUrl}/thorchain/inbound_addresses`)
    return resp.data
  }
  async getPubKeyAndStatusSinceByThorAddress(address: string): Promise<string> {
    const resp = await Axios.get(`${this._baseUrl}/thorchain/node/${address}`)
    return resp.data.pub_key_set.secp256k1
  }
  async getYggVaultByNodeSecp256k1PubKey(pubkey: string): Promise<YggVault> {
    const resp = await Axios.get(`${this._baseUrl}/thorchain/vault/${pubkey}`)
    return this.createYggVault(resp.data)
  }
  /**
   *
   * Helper function to take the thornode API ygg vault and combine elements to make it easierto work with
   *
   * @param yggVault the ygg vault returned from thornodeAPI
   * @returns YggVault
   */
  private createYggVault(yggVault: any): YggVault {
    const coins: Array<YggCoin> = []
    // console.log(JSON.stringify(yggVault))
    yggVault.coins.forEach((coin: { asset: string; amount: string; decimals: number | undefined }) => {
      const asset = assetFromString(coin.asset)
      if (!asset) throw new Error(`Couldn't parse ${coin.asset}`)
      const address = yggVault.addresses.find((item: any) => item.chain === asset?.chain).address
      const amount = this.getCorrectAmount(coin.amount, asset, coin.decimals)
      coins.push({
        address,
        asset,
        amount,
      })
    })
    return {
      pubKey: yggVault.pub_key,
      statusSince: yggVault.status_since,
      coins,
    }
  }
  /**
   * Thorchain has a set decimal count of 8, this function pads/rounds the correct
   * amount to send based on the chain
   *
   */
  private getCorrectAmount(amount: string, asset: Asset, decimals: number | undefined): BaseAmount {
    let decimalsToUse: number
    if (asset.chain === 'ETH') {
      decimalsToUse = decimals || 18
    } else {
      decimalsToUse = decimals || 8
    }
    const amt: BigNumber = new BigNumber(amount)
    const diff = decimalsToUse - THORCHAIN_DECIMALS
    const amtToSend = amt.times(10 ** diff)
    return baseAmount(amtToSend)
  }
}
