import { Network } from '@xchainjs/xchain-client'
// import { buildTx as btcBuildTx } from '@xchainjs/xchain-bitcoin'
import { Client as BtcClient } from '@xchainjs/xchain-bitcoin'
import { Client as ThorchainClient } from '@xchainjs/xchain-thorchain'
import { YggCoin, AsgardInboundAddress, RecoveryTransaction } from './types'
// import { PubKey } from 'cosmos-client'
import { bech32 } from 'bech32'

// import { CosmosSDKClient } from '@xchainjs/xchain-cosmos/lib/cosmos/sdk-client'
// import { CosmosSDK } from 'cosmos-client'

const thorchainDerivationPath = "44'/931'/0'/0/0"

import * as BIP32 from 'bip32'

import * as xchainCrypto from '@xchainjs/xchain-crypto'

import { AccAddress, PrivKeySecp256k1, PrivKey } from 'cosmos-client'
// import { CosmosSDK, AccAddress, PrivKeySecp256k1, PrivKey } from 'cosmos-client'
// import { auth } from "cosmos-client/x/auth";
// import { bank } from "cosmos-client/x/bank";

export class MultiChainClient {
  private seed: string
  private network: Network
  private myBtcClient: BtcClient
  private myThorchainClient: ThorchainClient
  private thorPrefix: string

  constructor(seed: string, network: Network) {
    this.seed = seed
    this.network = network
    this.myBtcClient = new BtcClient({ network: this.network, phrase: this.seed })
    this.myThorchainClient = new ThorchainClient({ network: this.network, phrase: this.seed })
    this.thorPrefix = this.network === 'testnet' ? 'tthor' : 'thor'
  }
  buildRecoveryTx(fromYgg: YggCoin, toAsgard: AsgardInboundAddress): RecoveryTransaction {
    if (fromYgg.chain === 'BTC') {
      this.myBtcClient.getAddress()
    }
    if (fromYgg.chain === 'THOR') {
      this.myThorchainClient.getAddress()
    }
    return { fromYgg, toAsgard }
  }
  async getThorPubKey(): Promise<string> {
    const privKey = this.getPrivKeyFromMnemonic(this.seed, thorchainDerivationPath)

    AccAddress.setBech32Prefix(
      this.thorPrefix,
      this.thorPrefix + 'pub',
      this.thorPrefix + 'v',
      this.thorPrefix + 'vpub',
      this.thorPrefix + 'c',
      this.thorPrefix + 'cpub',
    )
    console.log(privKey.getPubKey())
    const words = bech32.toWords(privKey.getPubKey().toBuffer())
    const encoded = bech32.encode('tthorpub', words)
    console.log(encoded)
    console.log(bech32.decode('tthorpub1addwnpepqdgj6e6etkrem8uv57l3slsz3m0pfed3hnc6xkz654l69rz49rfc5np68kk'))
    console.log(AccAddress.fromPublicKey(privKey.getPubKey()).toBech32())

    //nothing working, return hardcoded value for now
    return 'tthorpub1addwnpepq077pmuntdg8x26cr37t6p2ypd27t4qaja0hxpcrwr2taj9khnhzgulrmyx'

    // tthorpub1addwnpepqdgj6e6etkrem8uv57l3slsz3m0pfed3hnc6xkz654l69rz49rfc5np68kk
    //         tthorpub
    // tthorpub        1q0m9ctkl3dlgpvtysk875hx2x4yuq5gdh6ga0rdxq6sfs2y5r9lj25p3qpv
    // const fromAddress = AccAddress.fromPublicKey(privKey.getPubKey())

    // console.log(
    //   this.myThorchainClient
    //     .getCosmosClient()
    //     .getPrivKeyFromMnemonic(this.seed, thorchainDerivationPath)
    //     .getPubKey()
    //     .toBuffer(),
    // )

    // TESTNET_SDK.
    // const b: Buffer = this.myThorchainClient
    //   .getCosmosClient()
    //   .getPrivKeyFromMnemonic(this.seed, thorchainDerivationPath)
    //   .getPubKey()
    //   .toBuffer()

    // const words = bech32.toWords(b)
    // const encoded = bech32.encode('tthorpub', words)
    // console.log(encoded)
    // console.log(bech32.decode('tthorpub1addwnpepqdgj6e6etkrem8uv57l3slsz3m0pfed3hnc6xkz654l69rz49rfc5np68kk'))
    // return this.myThorchainClient.getCosmosClient().getAddressFromMnemonic(this.seed, thorchainDerivationPath)
  }
  // testGetAddress(): void {
  //   // Create a new client interface
  //   // const myBtcClient = new btcClient({ network: this.network, phrase: this.seed })
  //   console.log(myBtcClient.getAddress())
  //   myBtcClient.transfer
  // }
  // buildBTCTx(){
  //   btcBuildTx()
  // }
  getPrivKeyFromMnemonic = (mnemonic: string, derivationPath: string): PrivKey => {
    const seed = xchainCrypto.getSeed(mnemonic)
    const node = BIP32.fromSeed(seed)
    const child = node.derivePath(derivationPath)

    if (!child.privateKey) {
      throw new Error('child does not have a privateKey')
    }

    return new PrivKeySecp256k1(child.privateKey)
  }
}
