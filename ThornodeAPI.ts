import Axios from 'axios'
import { AsgardInboundAddress } from './types'
import { Network } from '@xchainjs/xchain-client'

export class ThornodeAPI {
  private baseUrl = ''
  private network: Network
  constructor(network: Network) {
    this.network = network
    this.baseUrl =
      this.network === 'testnet' ? 'https://testnet.thornode.thorchain.info' : 'https://thornode.thorchain.info'
  }

  async getAllYggVaults() {
    const resp = await Axios.get(`${this.baseUrl}/thorchain/vaults/yggdrasil`)
    return resp.data
  }
  async getAsgardInboundAddresses(): Promise<AsgardInboundAddress[]> {
    const resp = await Axios.get(`${this.baseUrl}/thorchain/inbound_addresses`)
    return resp.data
  }
  async getOutboundQueue() {
    const resp = await Axios.get(`${this.baseUrl}/thorchain/queue/outbound`)
    return resp.data
  }
}
