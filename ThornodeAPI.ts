import Axios from 'axios'
import { AsgardVault, AsgardInboundAddress } from './types'
import { Network } from '@xchainjs/xchain-client'

export class ThornodeAPI {
  private baseUrl = ''
  private network: Network
  constructor(network: Network) {
    this.network = network
    this.baseUrl =
      this.network === 'testnet' ? 'https://testnet.thornode.thorchain.info' : 'https://thornode.thorchain.info'
  }
  async getAsgardVaults(): Promise<AsgardVault[]> {
    const resp = await Axios.get(`${this.baseUrl}/thorchain/vaults/asgard`)
    // console.log(resp.data)
    //NOTE: currently there is only 1 asgard vault, so use it
    return resp.data[0].addresses
  }
  async getMyYggVaults(pubKey: string) {
    const resp = await Axios.get(`${this.baseUrl}/thorchain/vault/${pubKey}`)
    return resp.data
  }
  async getAsgardInboundAddresses(): Promise<AsgardInboundAddress[]> {
    const resp = await Axios.get(`${this.baseUrl}/thorchain/inbound_addresses`)
    return resp.data
  }
}
