const XMLHttpRequest = require('xhr2')
// Needed to support making http calls from node
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      XMLHttpRequest: XMLHttpRequest
    }
  }
}
global.XMLHttpRequest = XMLHttpRequest
// Needed to support making http calls from node

import { Address } from '@xchainjs/xchain-client'
import { Chain } from '@xchainjs/xchain-util'
import { MultiChainNodeRecovery } from './MultiChainNodeRecovery'

// TODO remove this after testing
// TODO remove this after testing
// TODO remove this after testing
// Override  addresses generated from the seed, since i dont have a realseed to use for testing
// NOTE: This will not overide the HD wallet addresses used to execute the transactions

const testnet_addresses: Map<Chain, Address> = new Map()
testnet_addresses.set('THOR', 'tthor1gsmzmhnn59qcsfcmz44rhr6zgvzy69kzdxw4me')
testnet_addresses.set('LTC', 'tltc1qgsmzmhnn59qcsfcmz44rhr6zgvzy69kz2zpcc5')
testnet_addresses.set('BTC', 'tb1qgsmzmhnn59qcsfcmz44rhr6zgvzy69kzn2rxga')
testnet_addresses.set('BCH', 'qpzrvtw7wws5rzp8rv2k5wu0gfpsgngkcgra36neg0')
testnet_addresses.set('BNB', 'tbnb1gsmzmhnn59qcsfcmz44rhr6zgvzy69kzr8skku')
testnet_addresses.set('ETH', '0xcf12e7d8b6f46e687de043cdad2aada104cae29a')

const mainnet_addresses: Map<Chain, Address> = new Map()
mainnet_addresses.set('THOR', 'thor12e0maesxsuvq54smm4gz494y3yevnwymvwmpsr')
mainnet_addresses.set('LTC', 'ltc1q2e0maesxsuvq54smm4gz494y3yevnwymc0x4ep')
mainnet_addresses.set('BTC', 'bc1q2e0maesxsuvq54smm4gz494y3yevnwymunu3p3')
mainnet_addresses.set('BCH', 'qpt9l0hxq6r3szjkr0w4q25k5jyn9jdcnvdw4qwtm3')
mainnet_addresses.set('BNB', 'bnb12e0maesxsuvq54smm4gz494y3yevnwymgdakyj')
mainnet_addresses.set('ETH', '0x4fb1bbe991dc28370acded623d7d4f2da9f522e0')
// TODO remove this after testing
// TODO remove this after testing
// TODO remove this after testing

//==================================================
//entrypoint to execute the recovery
//==================================================
const mySeed = 'float next auto secret mixed nice comic december cycle curious essay priority'

// -=-=--=-=-=-=-- TestNet -=-=-=-=-=-=---=---=
const recovery = new MultiChainNodeRecovery('testnet', mySeed)
recovery.multiChainClient.addresses = testnet_addresses

// -=-=--=-=-=-=-- Mainnet -=-=-=-=-=-=---=---=
// const recovery = new MultiChainNodeRecovery('mainnet', mySeed)
// recovery.multiChainClient.addresses = mainnet_addresses

const broadcastTxs = false
recovery
  .run(broadcastTxs)
  .then(() => console.log('done'))
  .catch((error) => console.error(error))
