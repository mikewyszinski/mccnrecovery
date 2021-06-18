import { MultiChainClient2 } from './MultiChainClient2'
import { AsgardInboundAddress, RecoveryTransaction, YggVault, YggCoin } from './types'
import { Network } from '@xchainjs/xchain-client'
import { ThornodeAPI } from './ThornodeAPI'

import { assetFromString, baseAmount, BaseAmount, Asset } from '@xchainjs/xchain-util'
import { BigNumber } from 'bignumber.js'

const THORCHAIN_DECIMALS = 8
const isErc20 = (tx: RecoveryTransaction) => tx.asset.chain === 'ETH' && tx.asset.ticker !== 'ETH'
const isNotErc20 = (tx: RecoveryTransaction) => !isErc20(tx)

export class MultiChainNodeRecovery {
  private asgardInboundAddresses: AsgardInboundAddress[] | undefined
  private seedPhrase: string
  private _multiChainClient: MultiChainClient2
  public get multiChainClient(): MultiChainClient2 {
    return this._multiChainClient
  }
  private thornodeAPI: ThornodeAPI

  constructor(network: Network, seedPhrase: string) {
    this.seedPhrase = seedPhrase
    this._multiChainClient = new MultiChainClient2(this.seedPhrase, network)
    this.thornodeAPI = new ThornodeAPI(network)
    console.log(`==========================================================`)
    console.log(`               MultiChainNodeRecovery: ${network.toUpperCase()}       `)
    console.log(`==========================================================`)
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
