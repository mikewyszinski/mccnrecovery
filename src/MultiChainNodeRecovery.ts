import { MultiChainClient2 } from './MultiChainClient2'
import { AsgardInboundAddress, RecoveryTransaction, YggVault, YggCoin } from './types'
import { Address, Network } from '@xchainjs/xchain-client'
import { ThornodeAPI } from './ThornodeAPI'

import { assetFromString, baseAmount, Chain, BaseAmount, Asset } from '@xchainjs/xchain-util'
import { BigNumber } from 'bignumber.js'

const THORCHAIN_DECIMALS = 8
const isErc20 = (tx: RecoveryTransaction) => tx.asset.chain === 'ETH' && tx.asset.ticker !== 'ETH'
const isNotErc20 = (tx: RecoveryTransaction) => !isErc20(tx)

export class MultiChainNodeRecovery {
  private asgardInboundAddresses: AsgardInboundAddress[] | undefined
  private seedPhrase: string
  private multiChainClient: MultiChainClient2
  private thornodeAPI: ThornodeAPI

  constructor(network: Network, seedPhrase: string) {
    this.seedPhrase = seedPhrase
    this.multiChainClient = new MultiChainClient2(this.seedPhrase, network)
    this.thornodeAPI = new ThornodeAPI(network)

    // TODO remove this after testing
    // TODO remove this after testing
    // TODO remove this after testing
    // console.log(this.multiChainClient.addresses)
    const addresses: Map<Chain, Address> = new Map()
    addresses.set('THOR', 'tthor1smacug88mxwh0drdgp8tythjy4jj4f7dlahl36')
    addresses.set('LTC', 'tltc1qsmacug88mxwh0drdgp8tythjy4jj4f7dcecjjh')
    addresses.set('BTC', 'tb1qsmacug88mxwh0drdgp8tythjy4jj4f7dp36vz7')
    addresses.set('BCH', 'qzr0hr3qulve6aa5d4qyav3w7gjk2248e5ln4rhnue')
    addresses.set('BNB', 'tbnb1smacug88mxwh0drdgp8tythjy4jj4f7d3ufuul')
    addresses.set('ETH', '0x997575001f55abdb8bda4dd98001083e208142e6')

    addresses.set('THOR', 'tthor1gsmzmhnn59qcsfcmz44rhr6zgvzy69kzdxw4me')
    addresses.set('LTC', 'tltc1qgsmzmhnn59qcsfcmz44rhr6zgvzy69kz2zpcc5')
    addresses.set('BTC', 'tb1qgsmzmhnn59qcsfcmz44rhr6zgvzy69kzn2rxga')
    addresses.set('BCH', 'qpzrvtw7wws5rzp8rv2k5wu0gfpsgngkcgra36neg0')
    addresses.set('BNB', 'tbnb1gsmzmhnn59qcsfcmz44rhr6zgvzy69kzr8skku')
    addresses.set('ETH', '0xcf12e7d8b6f46e687de043cdad2aada104cae29a')

    this.multiChainClient.addresses = addresses
    // TODO remove this after testing
    // TODO remove this after testing
    // TODO remove this after testing
  }

  public async run(executeTransfer = false): Promise<void> {
    const thorAddress = this.multiChainClient.addresses.get('THOR') || ''
    console.log(`Looking for this Ygg Thor Address: ${thorAddress}`)
    const transactionsToCreate = await this.getRecoveryTransactions(thorAddress)

    this.printTransactionToProcess(transactionsToCreate)
    if (executeTransfer) {
      //check to make sure all txs are valid
      for (const tx of transactionsToCreate) {
        if (!this.isTransactionValid(tx)) {
          throw new Error(`${tx.asset.symbol} not ready to process`)
        }
      }
      const erc20s = transactionsToCreate.filter(isErc20)
      const notErc20s = transactionsToCreate.filter(isNotErc20)

      //TODO print out tx URLS
      for (const tx of notErc20s) {
        await this.multiChainClient.execute(tx)
      }
      await this.multiChainClient.returnERC20s(erc20s)
    }
  }

  private isTransactionValid(tx: RecoveryTransaction): boolean {
    // return tx.amountAvailable.minus(tx.amountToTransfer.plus(tx.gas)).gte(0)
    return tx.amountAvailable.minus(tx.amountToTransfer).gte(0)
  }

  private async getRecoveryTransactions(thorAddress: string): Promise<Array<RecoveryTransaction>> {
    const txs: Array<RecoveryTransaction> = []
    const myYggVault = await this.findMyYggVault(thorAddress)

    for (const coin of myYggVault?.coins) {
      if (coin.amount.gt(0)) {
        const tx = await this.createRecoveryTransaction(coin, myYggVault.statusSince)
        txs.push(tx)
      } else {
        console.log(`Nothing to send back to asgard for ${coin.asset.symbol}, skipping...`)
      }
    }
    return txs
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

  private async findMyYggVault(thorAddress: string): Promise<YggVault> {
    const allYggVaults = await this.thornodeAPI.getAllYggVaults()
    let foundVault: any
    allYggVaults.forEach((vault) => {
      const result = vault.addresses.find((item: any) => item.chain === 'THOR' && item.address === thorAddress)
      if (result) {
        foundVault = vault
      }
    })

    if (!foundVault) {
      throw new Error(`Couldn't find vault: ${thorAddress}`)
    }
    return this.createYggVault(foundVault)
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
  private async createRecoveryTransaction(coin: YggCoin, statusSince: string): Promise<RecoveryTransaction> {
    const asgardDestination = await this.findAsgardInboundAddress(coin.asset.chain)
    const tx: RecoveryTransaction = {
      fromYggAddress: coin.address,
      toAsgardAddress: asgardDestination,
      asset: coin.asset,
      memo: `YGGDRASIL-:${statusSince}`,
      amountToTransfer: coin.amount,
      amountAvailable: await this.multiChainClient.getAvailableBalance(coin.asset),
      // gas: 0,
    }
    return tx
  }

  private printTransactionToProcess(transactionsToCreate: Array<RecoveryTransaction>) {
    for (const tx of transactionsToCreate) {
      const amountToTransfer = tx.amountToTransfer.amount()
      const amountAvailable = tx.amountAvailable.amount()
      // const gasToUse = tx.gas
      // const leftover = amountAvailable.minus(amountToTransfer.plus(gasToUse))
      const leftover = amountAvailable.minus(amountToTransfer)
      const feedback = leftover.gte(0) ? '✅' : '❌'
      // console.log(JSON.stringify(tx))
      console.log(`============================================================`)
      console.log(`                    ${tx.asset.symbol}                    `)
      console.log(`============================================================`)
      console.log(`  From YggAddress: ${tx.fromYggAddress}`)
      console.log(`To Asgard Address: ${tx.toAsgardAddress.address}`)
      console.log(`             memo: ${tx.memo}`)
      // console.log(`         Contract: ${tx.contractAddress}`)
      console.log(`        Available: ${amountAvailable}`)
      console.log(`   Amount To Send: ${amountToTransfer}`)
      // console.log(`       Gas To Use: -${gasToUse}`)
      // console.log(`                   --------------------`)
      // console.log(`         Leftover:  ${leftover}`)
      // console.log(`    Signed TX Hex: ${tx.signedTxHex}`)
      console.log(`   Ready To Send?: ${feedback}`)
      // console.log(`============================================================\n`)
      console.log(`\n\n`)
    }
  }
}
