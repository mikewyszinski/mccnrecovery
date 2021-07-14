import { Address, Network } from '@xchainjs/xchain-client'
import { Chain } from '@xchainjs/xchain-util'

import { MultiChainNodeRecovery } from './MultiChainNodeRecovery'

// TODO remove this after testing
// TODO remove this after testing
// TODO remove this after testing
// Override  addresses generated from the seed, since i dont have a realseed to use for testing
// NOTE: This will not overide the HD wallet addresses used to execute the transactions

const testnet_addresses: Map<Chain, Address> = new Map()
testnet_addresses.set('THOR' as Chain, 'tthor1lwsx7myqxjc9q8knu920pvt0zv0dq9q92wmtp2')
testnet_addresses.set('LTC' as Chain, 'tltc1qlwsx7myqxjc9q8knu920pvt0zv0dq9q9d25xz8')
testnet_addresses.set('BTC' as Chain, 'tb1qlwsx7myqxjc9q8knu920pvt0zv0dq9q95zkcjw')
testnet_addresses.set('BCH' as Chain, 'qra6qmmvsq6tq5q760s4fu93duf3a5q5q5ljtzdc4u')
testnet_addresses.set('BNB' as Chain, 'tbnb1lwsx7myqxjc9q8knu920pvt0zv0dq9q9y09gv0')
testnet_addresses.set('ETH' as Chain, '0x8cd053101a17051169738bc8863142e60acf0f69')

const mainnet_addresses: Map<Chain, Address> = new Map()
mainnet_addresses.set('THOR' as Chain, 'thor12e0maesxsuvq54smm4gz494y3yevnwymvwmpsr')
mainnet_addresses.set('LTC' as Chain, 'ltc1q2e0maesxsuvq54smm4gz494y3yevnwymc0x4ep')
mainnet_addresses.set('BTC' as Chain, 'bc1q2e0maesxsuvq54smm4gz494y3yevnwymunu3p3')
mainnet_addresses.set('BCH' as Chain, 'qpt9l0hxq6r3szjkr0w4q25k5jyn9jdcnvdw4qwtm3')
mainnet_addresses.set('BNB' as Chain, 'bnb12e0maesxsuvq54smm4gz494y3yevnwymgdakyj')
mainnet_addresses.set('ETH' as Chain, '0x4fb1bbe991dc28370acded623d7d4f2da9f522e0')
// TODO remove this after testing
// TODO remove this after testing
// TODO remove this after testing

//==================================================
//entrypoint to execute the recovery
//==================================================
const mySeed = 'float next auto secret mixed nice comic december cycle curious essay priority'

// -=-=--=-=-=-=-- TestNet -=-=-=-=-=-=---=---=
const recovery = new MultiChainNodeRecovery('testnet' as Network, mySeed)
recovery.multiChainClient.addresses = testnet_addresses

// NOTE: you can use a specific thornode API
// WARNING: bsure to use a node on the correct network
// you can use nodes listed here:
// testnet ---> https://testnet.seed.thorchain.info/
// mainnet ---> https://seed.thorchain.info/
// recovery.thornodeAPI.baseUrl = 'http://3.13.89.205:1317'

// -=-=--=-=-=-=-- Mainnet -=-=-=-=-=-=---=---=
// const recovery = new MultiChainNodeRecovery('mainnet', mySeed)
// recovery.multiChainClient.addresses = mainnet_addresses

const broadcastTxs = false
recovery
  .run(broadcastTxs)
  .then(() => console.log('done'))
  .catch((error) => console.error(error))
