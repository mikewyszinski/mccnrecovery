import { Network } from '@xchainjs/xchain-client'
import { BTCTx } from './BTCTx'

import { RecoveryTransaction } from 'types'

export class MultiChainClient {
  private btcTx: BTCTx

  constructor(seed: string, network: Network) {
    this.btcTx = new BTCTx(seed, network)
  }
  async getSignedTxHex(tx: RecoveryTransaction): Promise<string> {
    if (tx.asset.chain === 'BTC') {
      const psbt = await this.btcTx.buildMoveAllTx(tx)
      this.btcTx.signAndFinalizeTx(psbt)
      return psbt.extractTransaction().toHex()
      // return psbt.toHex()
    }
    // if (tx.asset.chain === 'THOR') {
    //   return this.myThorchainClient.getAddress()
    // }
    return 'not implemented'
  }
  generateYggAddresses() {
    const yggAddresses = { THOR: 'fixme', BTC: this.btcTx.getAddress() }

    // TODO remove this after testing
    // yggAddresses.THOR = 'tthor1v2egkratjjxmmjgqjv5ekczwmt7df68wktm3qn'
    return yggAddresses
  }
}
