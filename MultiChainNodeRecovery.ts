import { MultiChainClient } from './MultiChainClient'
import { AsgardInboundAddress, RecoveryTransaction, YggVaultAddress, YggVault } from './types'
import { Network } from '@xchainjs/xchain-client'
import { ThornodeAPI } from './ThornodeAPI'
import { Table } from 'console-table-printer'

import { assetFromString, baseAmount } from '@xchainjs/xchain-util'

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

  public async run(broadcastTxs = false): Promise<void> {
    const myYggAddresses = await this.multiChainClient.generateYggAddresses()
    console.log(`Looking for this Ygg Thor Address: ${myYggAddresses.THOR}`)
    const transactionsToCreate = await this.getRecoveryTransactions(myYggAddresses.THOR)

    this.printTransactionTable(transactionsToCreate)
    this.printSignedTransactionHex(transactionsToCreate)
    if (broadcastTxs) {
      //TODO create signed trxns to move funds for each ygg vault
    }
  }
  private async getRecoveryTransactions(thorAddress: string): Promise<Array<RecoveryTransaction>> {
    const txs: Array<RecoveryTransaction> = []
    const myYggVault = await this.findMyYggVault(thorAddress)
    if (!myYggVault)
      throw new Error(`Could not find a matching Ygg vault for: ${thorAddress}. Did you input the correct seed?`)

    // console.log(myYggVault)
    if (myYggVault) {
      for (const coin of myYggVault?.coins) {
        const tx = await this.createRecoveryTransaction(coin.asset, coin.amount, myYggVault.addresses)
        txs.push(tx)
      }
    }
    return txs
  }

  private async findMyYggVault(thorAddress: string): Promise<YggVault | undefined> {
    const allYggVaults = await this.thornodeAPI.getAllYggVaults()
    let foundVault = undefined
    for (const yggVault of allYggVaults) {
      const addressMatched = yggVault.addresses.find((yggVaultAddress: YggVaultAddress) => {
        return yggVaultAddress.chain === 'THOR' && yggVaultAddress.address === thorAddress
      })
      if (addressMatched) {
        console.log(`Found Ygg Vault ${addressMatched.address}`)
        foundVault = {
          coins: yggVault.coins,
          addresses: yggVault.addresses,
        }
      }
    }
    return foundVault
  }

  private async findAsgardInboundAddress(chain: string): Promise<AsgardInboundAddress> {
    if (!this.asgardInboundAddresses) {
      this.asgardInboundAddresses = await this.thornodeAPI.getAsgardInboundAddresses()
    }
    const asgardInboundAddress = this.asgardInboundAddresses.find((vault) => vault?.chain === chain)
    if (!asgardInboundAddress) {
      throw new Error(`Couldn't find asgard address for ${chain}`)
    }
    return asgardInboundAddress
  }

  private async createRecoveryTransaction(
    assetString: string,
    amount: string,
    yggVaultAddresses: Array<YggVaultAddress>,
  ): Promise<RecoveryTransaction> {
    const matches =
      assetString.indexOf('-') >= 0 ? assetString.match(COIN_REGEX_WITH_ADDRESS) : assetString.match(COIN_REGEX)

    // const chain = matches?.[1] || ''

    const asset = assetFromString(assetString)
    if (!asset) {
      throw new Error(`Could not parse ${assetString}`)
    }

    // find the assiocated address for the chain
    const yggVault = yggVaultAddresses.find((yggVault) => asset.chain === yggVault.chain)
    if (!yggVault) {
      throw new Error(`Could not find address for ${asset.chain}`)
    }

    const asgardDestination = await this.findAsgardInboundAddress(asset.chain)

    const tx: RecoveryTransaction = {
      fromYggAddress: yggVault.address,
      toAsgardAddress: asgardDestination,
      asset,
      amount: baseAmount(amount),
      contractAddress: matches?.[3],
    }
    //add the signed tx
    tx.signedTxHex = await this.multiChainClient.getSignedTxHex(tx)
    return tx
  }
  private printTransactionTable(transactionsToCreate: Array<RecoveryTransaction>) {
    const table = new Table({
      title: 'Recovery Tanasctions To Execute', // A text showsup on top of table (optoinal)
      columns: [
        { name: 'Chain', color: 'white' }, // with alignment and color
        { name: 'Asset', color: 'white' }, // with alignment and color
        { name: 'From Node Address', color: 'white' }, // with alignment and color
        { name: 'Asgard Address', color: 'white' }, // with alignment and color
        { name: 'Gas Rate', color: 'white' }, // with alignment and color
        // { name: 'Signed Tx(Hex)', color: 'white', maxLen: 60 }, // with alignment and color
      ],
      sort: (a, b) => a.Chain.localeCompare(b.Chain),
    })
    for (const tx of transactionsToCreate) {
      const row = {
        Chain: tx.asset.chain,
        Asset: `${tx.amount.amount()} ${tx.asset.ticker}`,
        'From Node Address': tx.fromYggAddress,
        'Asgard Address': tx.toAsgardAddress?.address,
        'Gas Rate': tx.toAsgardAddress?.gas_rate,
        // 'Signed Tx(Hex)': this.splitString(tx.signedTxHex, 60),
      }
      table.addRow(row)
    }
    table.printTable()
  }
  private printSignedTransactionHex(transactionsToCreate: Array<RecoveryTransaction>) {
    for (const tx of transactionsToCreate) {
      console.log(`============================================================`)
      console.log(`                    ${tx.asset.ticker}                    `)
      console.log(`============================================================`)
      console.log(`  From YggAddress: ${tx.fromYggAddress}`)
      console.log(`To Asgard Address: ${tx.toAsgardAddress.address}`)
      console.log(`         Contract: ${tx.contractAddress}`)
      console.log(`           Amount: ${tx.amount.amount()} ${tx.asset.ticker}`)
      console.log(`    Signed TX Hex: ${tx.signedTxHex}`)
      // console.log(`============================================================\n`)
      console.log(`\n\n`)
    }
  }

  // private splitString(str = '', length: number) {
  //   let out = ''
  //   const matches = str.match(new RegExp('.{1,' + length + '}', 'g')) || []
  //   for (const match of matches) {
  //     out = out + match + ' '
  //   }
  //   return out
  // }
}
