import { MultiChainClient } from './MultiChainClient'
import { YggCoin, AsgardInboundAddress, RecoveryTransaction } from './types'
import { Network } from '@xchainjs/xchain-client'
import { ThornodeAPI } from './ThornodeAPI'
import { Table } from 'console-table-printer'

// this will recognize strings like ETH.ETH
const COIN_REGEX = /(.+?)\.(.+?)$/

// this will recognize strings like ETH.DAI-0XAD6D458402F60FD3BD25163575031ACDCE07538D
const COIN_REGEX_WITH_ADDRESS = /(.+?)\.(.+?)-(.+?)$/

export class MultiChainNodeRecovery {
  private asgardInboundAddresses: AsgardInboundAddress[] | undefined
  private seedPhrase: string
  private multiChainClient: MultiChainClient
  private thornodeAPI: ThornodeAPI

  constructor(network: Network, seedPhrase: string) {
    this.seedPhrase = seedPhrase
    this.multiChainClient = new MultiChainClient(this.seedPhrase, network)
    this.thornodeAPI = new ThornodeAPI(network)
  }

  public async run(executeTransactions = false): Promise<void> {
    const myNodePubKey = await this.multiChainClient.getThorPubKey()
    const myYggVaults = await this.thornodeAPI.getMyYggVaults(myNodePubKey)
    const transactionsToCreate: Array<RecoveryTransaction> = []

    for (const coin of myYggVaults.coins) {
      const yggCoin = this.parseCoinString(coin.asset, coin.amount)
      const asgardInboundAddress = await this.findAsgardInboundAddress(yggCoin)
      const recoveryTransaction: RecoveryTransaction = this.multiChainClient.buildRecoveryTx(
        yggCoin,
        asgardInboundAddress,
      )
      transactionsToCreate.push(recoveryTransaction)
    }
    this.printTransactions(transactionsToCreate)
    if (executeTransactions) {
      //TODO create signed trxns to move funds for each ygg vault
    }
  }
  // ===========================================================
  // just some experiments/notes to get the correct node.pub_key
  // ============================================================
  // examples from https://testnet.thornode.thorchain.info/thorchain/vaults/yggdrasil
  // tthorpub1addwnpepq077pmuntdg8x26cr37t6p2ypd27t4qaja0hxpcrwr2taj9khnhzgulrmyx
  // tthorpub1addwnpepq0rpmcjjvuqfpxtlu7dh4ml0n9ptl5vp4dpnr833lytxh9jnkw396vp6e2e
  // tthorpub1addwnpepqdgj6e6etkrem8uv57l3slsz3m0pfed3hnc6xkz654l69rz49rfc5np68kk
  // addwnpepq
  // seed -> float next auto secret mixed nice comic december cycle curious essay priority
  // Derivatin path       address                          pubkey
  //================      =============================    ===================================
  // m/44'/931'/0'/0/0	-> 024ba86070d173c51e788b9a2de28cf8a0861dfdb356e9f84855ff225fbd8a7a79
  //                               077pmuntdg8x26cr37t6p2ypd27t4qaja0hxpcrwr2taj9khnhzgulrmyx

  private async findAsgardInboundAddress(coin: YggCoin): Promise<AsgardInboundAddress> {
    if (!this.asgardInboundAddresses) {
      this.asgardInboundAddresses = await this.thornodeAPI.getAsgardInboundAddresses()
    }
    const asgardInboundAddress = this.asgardInboundAddresses.find((vault) => vault.chain === coin.chain)
    if (!asgardInboundAddress) {
      throw new Error(`Couldn't find asgad address for ${coin.chain}`)
    }
    return asgardInboundAddress
  }

  private parseCoinString(assetString: string, amount: string): YggCoin {
    const matches =
      assetString.indexOf('-') >= 0 ? assetString.match(COIN_REGEX_WITH_ADDRESS) : assetString.match(COIN_REGEX)

    const coin = {
      amount,
      chain: matches?.[1],
      symbol: matches?.[2],
      contractAddress: matches?.[3],
    }
    return coin
  }
  private printTransactions(transactionsToCreate: Array<RecoveryTransaction>) {
    const table = new Table({
      title: 'Recovery Tanasctions To Execute', // A text showsup on top of table (optoinal)
      columns: [
        { name: 'Chain', color: 'white' }, // with alignment and color
        { name: 'Asset', color: 'white' }, // with alignment and color
        { name: 'Asgard Address', color: 'white' }, // with alignment and color
        { name: 'Gas Rate', color: 'white' }, // with alignment and color
      ],
      sort: (a, b) => a.Chain.localeCompare(b.Chain),
    })
    for (const tx of transactionsToCreate) {
      const row = {
        Chain: tx.fromYgg.chain,
        Asset: `${tx.fromYgg.amount} ${tx.fromYgg.symbol}`,
        'Asgard Address': tx.toAsgard.address,
        'Gas Rate': tx.toAsgard.gas_rate,
      }
      table.addRow(row)
    }
    table.printTable()
  }
}
