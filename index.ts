import { MultiChainNodeRecovery } from './MultiChainNodeRecovery'

//entrypoint to execute the recovery
const mySeed = 'float next auto secret mixed nice comic december cycle curious essay priority'
new MultiChainNodeRecovery('testnet', mySeed).run().then(() => console.log('done'))
