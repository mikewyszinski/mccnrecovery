const XMLHttpRequest = require('xhr2')
// import * as xhr from 'xhr2'
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      XMLHttpRequest: XMLHttpRequest
    }
  }
}
global.XMLHttpRequest = XMLHttpRequest

import { MultiChainNodeRecovery } from './MultiChainNodeRecovery'

//entrypoint to execute the recovery
const mySeed = 'float next auto secret mixed nice comic december cycle curious essay priority'
const network = 'testnet'
const recovery = new MultiChainNodeRecovery(network, mySeed)

const broadcastTxs = false
recovery
  .run(broadcastTxs)
  .then(() => console.log('done'))
  .catch((error) => console.error(error))
