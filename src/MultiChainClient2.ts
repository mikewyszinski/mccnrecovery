import { Client as BtcClient } from '@xchainjs/xchain-bitcoin'
import { Client as BchClient } from '@xchainjs/xchain-bitcoincash'
import { Client as EthClient, EthereumClient } from '@xchainjs/xchain-ethereum'
import { Client as ThorClient } from '@xchainjs/xchain-thorchain'
import { Client as LtcClient } from '@xchainjs/xchain-litecoin'
import { Client as BnbClient } from '@xchainjs/xchain-binance'
import { Address, Network, RootDerivationPaths, TxParams, XChainClient } from '@xchainjs/xchain-client'
import { Asset, BaseAmount, baseAmount, Chain } from '@xchainjs/xchain-util'
import { BigNumberish, BigNumber, ContractInterface } from 'ethers'
import { RecoveryTransaction } from './types'
import { ROUTER_ABI, ERC20 } from './abi'
import { BigNumber as BN } from 'bignumber.js'

const THORCHAIN_DERIVATION_PATH: RootDerivationPaths = {
  testnet: "44'/931'/0'/0/0",
  mainnet: "44'/931'/0'/0/0",
}
const ETH_ROUTER_ADDRESS = {
  testnet: '0xe0a63488E677151844E70623533C22007dc57c9E',
  mainnet: '0x42A5Ed456650a09Dc10EBc6361A7480fDd61f27B',
}

export class MultiChainClient2 {
  private clients: Map<Chain, XChainClient> = new Map()
  private _addresses: Map<Chain, Address> = new Map()
  private routerContract: ContractInterface
  private ethClient: EthereumClient

  constructor(seed: string, network: Network) {
    this.routerContract = ROUTER_ABI
    const settings = {
      network: network,
      rootDerivationPaths: THORCHAIN_DERIVATION_PATH,
      phrase: seed,
    }
    this.clients.set('BTC', new BtcClient(settings))
    this.clients.set('BCH', new BchClient(settings))
    this.clients.set('ETH', new EthClient(settings))
    this.clients.set('THOR', new ThorClient(settings))
    this.clients.set('LTC', new LtcClient(settings))
    this.clients.set('BNB', new BnbClient(settings))

    this._addresses = this.generateYggAddresses()
    this.ethClient = this.clients.get('ETH') as unknown as EthereumClient
  }
  public get addresses() {
    return this._addresses
  }
  public set addresses(addresses: Map<Chain, Address>) {
    this._addresses = addresses
  }
  public async execute(tx: RecoveryTransaction): Promise<string> {
    const client = this.clients.get(tx.asset.chain)
    const params: TxParams = {
      walletIndex: 0,
      asset: tx.asset,
      amount: tx.amountToTransfer,
      recipient: tx.toAsgardAddress.address,
      memo: tx.memo,
    }
    return (await client?.transfer(params)) || 'error'
  }

  public async getAvailableBalance(asset: Asset): Promise<BaseAmount> {
    const client = this.clients.get(asset.chain)
    const yggVaultAddress = this.addresses.get(asset.chain) || ''
    if (asset.chain === 'ETH' && asset.ticker !== 'ETH') {
      //ERC20 coins have unique way to get vault balance
      const erc20Address = this.parseErc20Address(asset.symbol)
      const decimals = await this.getERC20Decimals(erc20Address)
      const amount = await this.getBalanceFromVault(yggVaultAddress, erc20Address)

      return baseAmount(amount.toFixed(decimals))
    } else {
      // all other coins can use the getBalance Function
      const balances = await client?.getBalance(yggVaultAddress, [asset])

      if (balances && balances.length > 0) {
        // if (asset.chain === 'ETH') console.log(balances[0].amount.amount())
        return balances[0].amount
      } else {
        return baseAmount(-1)
      }
    }
  }
  private generateYggAddresses(): Map<Chain, Address> {
    const addresses: Map<Chain, Address> = new Map()
    for (const [chain, client] of this.clients) {
      addresses.set(chain, client.getAddress(0))
    }
    return addresses
  }
  public async returnERC20s(erc20Txs: RecoveryTransaction[]): Promise<BN> {
    const network = this.clients?.get('ETH')?.getNetwork() || 'testnet'
    const routerContractAddress = ETH_ROUTER_ADDRESS[network]
    const asgardAddress = erc20Txs?.[0].toAsgardAddress.address
    const memo = erc20Txs?.[0].memo
    const coinsTuple = this.buildCoinTuple(erc20Txs)
    const walletIndex = 0 //always 0 index

    const fees = await this.ethClient.estimateCall(routerContractAddress, this.routerContract, 'returnVaultAssets', [
      routerContractAddress,
      asgardAddress,
      coinsTuple,
      memo,
    ])

    const tx = await this.ethClient.call<BigNumberish>(
      walletIndex,
      routerContractAddress,
      this.routerContract,
      'returnVaultAssets',
      [fees.toNumber(), routerContractAddress, asgardAddress, coinsTuple, memo],
    )
    return new BN(BigNumber.from(tx).toString())
  }

  private async getBalanceFromVault(yggVaultAddress: string, erc20Address: string): Promise<BN> {
    const network = this.clients?.get('ETH')?.getNetwork() || 'testnet'
    const routerContractAddress = ETH_ROUTER_ADDRESS[network]
    const value = await this.ethClient.call<BigNumberish>(
      0,
      routerContractAddress,
      this.routerContract,
      'vaultAllowance',
      [yggVaultAddress, erc20Address],
    )
    return new BN(BigNumber.from(value).toString())
  }
  private buildCoinTuple(erc20Txs: RecoveryTransaction[]) {
    console.log(erc20Txs)
    const tuple = erc20Txs.map((coin) => {
      return { asset: this.parseErc20Address(coin.asset.symbol), amount: coin.amountToTransfer }
    })
    return tuple
  }

  private async getERC20Decimals(erc20Address: string): Promise<number> {
    return BigNumber.from(await this.ethClient.call<BigNumberish>(0, erc20Address, ERC20, 'decimals', [])).toNumber()
  }
  private parseErc20Address(symbol: string) {
    //this needs to be lower cased since the ethers does not like the 0X prefix, it needs 0x
    return symbol.split('-')[1].toLowerCase()
  }
}