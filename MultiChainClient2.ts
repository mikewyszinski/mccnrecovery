import { Client as BtcClient } from '@xchainjs/xchain-bitcoin'
import { Client as BchClient } from '@xchainjs/xchain-bitcoincash'
import { Client as EthClient } from '@xchainjs/xchain-ethereum'
import { Client as ThorClient } from '@xchainjs/xchain-thorchain'
import { Client as LtcClient } from '@xchainjs/xchain-litecoin'
import { Client as BnbClient } from '@xchainjs/xchain-binance'
import { Address, Network, RootDerivationPaths, XChainClient } from '@xchainjs/xchain-client'
import { Asset, BaseAmount, baseAmount, Chain } from '@xchainjs/xchain-util'

const THORCHAIN_DERIVATION_PATH: RootDerivationPaths = {
  testnet: "44'/931'/0'/0/0",
  mainnet: "44'/931'/0'/0/0",
}
export class MultiChainClient2 {
  private clients: Map<Chain, XChainClient> = new Map()
  private _addresses: Map<Chain, Address> = new Map()

  constructor(seed: string, network: Network) {
    const settings = {
      network: network,
      rootDerivationPaths: THORCHAIN_DERIVATION_PATH,
      phrase: seed,
    }
    this.clients.set('BTC', new BtcClient(settings))
    this.clients.set('BCH', new BchClient(settings))
    this.clients.set('ETH', new EthClient(settings))
    this.clients.set('THOR', new ThorClient(settings))
    this.clients.set('LTC', new LtcClient(settings))
    this.clients.set('BNB', new BnbClient(settings))

    this._addresses = this.generateYggAddresses()
  }
  public get addresses() {
    return this._addresses
  }
  public set addresses(addresses: Map<Chain, Address>) {
    this._addresses = addresses
  }
  public async getAvailableBalance(asset: Asset): Promise<BaseAmount> {
    const client = this.clients.get(asset.chain)
    const address = this.addresses.get(asset.chain) || ''
    const balances = await client?.getBalance(address, [asset])

    if (balances && balances.length > 0) {
      // if (asset.chain === 'ETH') console.log(balances[0].amount.amount())
      return balances[0].amount
    } else {
      return baseAmount(-1)
    }
  }
  private generateYggAddresses(): Map<Chain, Address> {
    const addresses: Map<Chain, Address> = new Map()
    for (const [chain, client] of this.clients) {
      addresses.set(chain, client.getAddress(0))
    }
    return addresses
  }
}
