import { Address, Network } from '@xchainjs/xchain-client'
import * as Bitcoin from 'bitcoinjs-lib'
import { Client as BtcClient, scanUTXOs, UTXO, validateAddress, broadcastTx } from '@xchainjs/xchain-bitcoin'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import split from 'coinselect/split'
import { RootDerivationPaths } from '@xchainjs/xchain-client'
import { RecoveryTransaction } from 'types'
import { getSeed } from '@xchainjs/xchain-crypto'

const THORCHAIN_DERIVATION_PATH: RootDerivationPaths = {
  testnet: "44'/931'/0'/0/0",
  mainnet: "44'/931'/0'/0/0",
}
const SOCHAIN_URL = 'https://sochain.com/api/v2'
const BLOCKSTREAM_URL = 'https://blockstream.info'

export class BTCTx {
  private seed: string
  private network: Network
  private myBtcClient: BtcClient

  constructor(seed: string, network: Network) {
    this.seed = seed
    this.network = network
    this.myBtcClient = new BtcClient({
      network: this.network,
      rootDerivationPaths: THORCHAIN_DERIVATION_PATH,
      phrase: this.seed,
    })
  }
  public getAddress(): Address {
    return this.myBtcClient.getAddress()
  }
  public async buildMoveAllTx(
    tx: RecoveryTransaction,
    // asset: Asset,
    // sender: Address,
    // recipient: Address,
    // amount: BaseAmount,
    // memo: string,
    // feeRate: number,
    // network,
    // spendPendingUTXO = false, // default: prevent spending uncomfirmed UTXOs
  ): Promise<Bitcoin.Psbt> {
    try {
      const recipient = tx.toAsgardAddress.address
      const sender = tx.fromYggAddress
      const feeRate = tx.toAsgardAddress.gas_rate * 1.5
      const memo = 'TODO createMemo'
      const confirmedOnly = false

      if (!validateAddress(recipient, this.network)) {
        return Promise.reject(new Error('Invalid address'))
      }
      const feeRateWhole = Number(feeRate.toFixed(0))

      // search only confirmed UTXOs if pending UTXO is not allowed
      const utxos = await scanUTXOs({ sochainUrl: SOCHAIN_URL, network: this.network, address: sender, confirmedOnly })

      if (utxos.length === 0) {
        return Promise.reject(Error('No utxos to send'))
      }

      //1. add output amount and recipient to targets
      const targetOutputs = []
      targetOutputs.push({
        address: recipient,
      })
      //2. add output memo to targets (optional)
      const compiledMemo = memo ? this.compileMemo(memo) : null
      if (compiledMemo) {
        targetOutputs.push({ script: compiledMemo, value: 0 })
      }
      const { inputs, outputs } = split(utxos, targetOutputs, feeRateWhole)

      // .inputs and .outputs will be undefined if no solution was found
      if (!inputs || !outputs) {
        return Promise.reject(Error('Insufficient Balance for transaction'))
      }
      const psbt = new Bitcoin.Psbt({ network: this.btcNetwork() })

      // psbt add all inputs
      inputs.forEach((utxo: UTXO) =>
        psbt.addInput({
          hash: utxo.hash,
          index: utxo.index,
          witnessUtxo: utxo.witnessUtxo,
        }),
      )

      // psbt add outputs from accumulative outputs
      outputs.forEach((output: Bitcoin.PsbtTxOutput) => {
        if (!output.address) {
          //an empty address means this is the  change ddress
          output.address = sender
        }
        if (!output.script) {
          psbt.addOutput(output)
        } else {
          //we need to add the compiled memo this way to
          //avoid dust error tx when accumulating memo output with 0 value
          if (compiledMemo) {
            psbt.addOutput({ script: compiledMemo, value: 0 })
          }
        }
      })

      return psbt
    } catch (e) {
      return Promise.reject(e)
    }
  }

  public signAndFinalizeTx(btcTx: Bitcoin.Psbt): void {
    const btcKeys = this.getBtcKeys()
    btcTx.signAllInputs(btcKeys) // Sign all inputs
    btcTx.finalizeAllInputs() // Finalise inputs
  }

  public async broadcastTx(btcTx: Bitcoin.Psbt) {
    return await broadcastTx({ network: this.network, txHex: btcTx.toHex(), blockstreamUrl: BLOCKSTREAM_URL })
  }

  private getBtcKeys(index = 0): Bitcoin.ECPairInterface {
    const seed = getSeed(this.seed)
    const derivePath = this.myBtcClient.getFullDerivationPath(index)
    const master = Bitcoin.bip32.fromSeed(seed, this.btcNetwork()).derivePath(derivePath)

    if (!master.privateKey) {
      throw new Error('Could not get private key from phrase')
    }

    return Bitcoin.ECPair.fromPrivateKey(master.privateKey, { network: this.btcNetwork() })
  }
  private compileMemo(memo: string): Buffer {
    const data = Buffer.from(memo, 'utf8') // converts MEMO to buffer
    return Bitcoin.script.compile([Bitcoin.opcodes.OP_RETURN, data]) // Compile OP_RETURN script
  }
  private btcNetwork(): Bitcoin.networks.Network {
    return this.network === 'testnet' ? Bitcoin.networks.testnet : Bitcoin.networks.bitcoin
  }
}
