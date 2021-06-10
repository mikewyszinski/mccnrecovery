import { MultiChainClient2 } from './MultiChainClient2'
import { AsgardInboundAddress, RecoveryTransaction, YggVaultAddress, YggVault, isTransactionValid } from './types'
import { Address, Network } from '@xchainjs/xchain-client'
import { ThornodeAPI } from './ThornodeAPI'

import { assetFromString, baseAmount, Chain } from '@xchainjs/xchain-util'

const isErc20 = (tx: RecoveryTransaction) =>  tx.asset.chain === 'ETH' && tx.asset.ticker !== 'ETH'
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
    console.log(this.multiChainClient.addresses)
    const addresses: Map<Chain, Address> = new Map()
    addresses.set('THOR', 'tthor1v2egkratjjxmmjgqjv5ekczwmt7df68wktm3qn')
    addresses.set('LTC', 'tltc1qv2egkratjjxmmjgqjv5ekczwmt7df68w305ur7')
    addresses.set('BTC', 'tb1qv2egkratjjxmmjgqjv5ekczwmt7df68wg8kznh')
    addresses.set('BCH', 'qp3t9zc04w2gm0wfqzfjnxmqfmd0e48gacjkxvferc')
    addresses.set('BNB', 'tbnb1v2egkratjjxmmjgqjv5ekczwmt7df68wc29jdk')
    addresses.set('ETH', '0x5f7499cb53194542992f44151c9bea3f9fe8b163')
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
        if (!isTransactionValid(tx)) {
          throw new Error(`${tx.asset.symbol} not ready to process`)
        }
      }
      const erc20s = transactionsToCreate.filter(isErc20)
      const notErc20s = transactionsToCreate.filter(isNotErc20)

      //TODO print out tx URLS
      for (const tx of notErc20s) {
        await this.multiChainClient.execute(tx)
      }
      await this.multiChainClient.executeERC20s(erc20s)
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
        const tx = await this.createRecoveryTransaction(
          coin.asset,
          coin.amount,
          myYggVault.statusSince,
          myYggVault.addresses,
        )
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
          pubKey: yggVault.pub_key,
          statusSince: yggVault.status_since,
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
    statusSince: string,
    yggVaultAddresses: Array<YggVaultAddress>,
  ): Promise<RecoveryTransaction> {
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
      memo: `YGGDRASIL-:${statusSince}`,
      amountToTransfer: baseAmount(amount),
      amountAvailable: await this.multiChainClient.getAvailableBalance(asset),
      gas: 10000,
    }
    //add the signed tx
    // tx.signedTxHex = await this.multiChainClient.getSignedTxHex(tx)
    return tx
  }

  private printTransactionToProcess(transactionsToCreate: Array<RecoveryTransaction>) {
    for (const tx of transactionsToCreate) {
      const amountToTransfer = tx.amountToTransfer.amount()
      const amountAvailable = tx.amountAvailable.amount()
      const gasToUse = tx.gas
      const leftover = amountAvailable.minus(amountToTransfer.plus(gasToUse))
      const feedback = leftover.gte(0) ? '✅' : '❌'

      console.log(`============================================================`)
      console.log(`                    ${tx.asset.symbol}                    `)
      console.log(`============================================================`)
      console.log(`  From YggAddress: ${tx.fromYggAddress}`)
      console.log(`To Asgard Address: ${tx.toAsgardAddress.address}`)
      console.log(`             memo: ${tx.memo}`)
      // console.log(`         Contract: ${tx.contractAddress}`)
      console.log(`        Available:  ${amountAvailable}`)
      console.log(`   Amount To Send: -${amountToTransfer}`)
      console.log(`       Gas To Use: -${gasToUse}`)
      console.log(`                   --------------------`)
      console.log(`         Leftover:  ${leftover}`)
      // console.log(`    Signed TX Hex: ${tx.signedTxHex}`)
      console.log(`   Ready To Send?: ${feedback}`)
      // console.log(`============================================================\n`)
      console.log(`\n\n`)
    }
  }
}
