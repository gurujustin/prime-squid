import * as exchangeRates from './post-processors/exchange-rates'
import * as validateOeth from './post-processors/validate-oeth'
import { run } from './processor'
import * as aaveCompound from './processors/aave-compound'
import * as curve from './processors/curve'
import * as oeth from './processors/oeth'
import * as balancerMetaPoolStrategy from './processors/oeth/balancer-meta-pool'
import * as curveLp from './processors/oeth/curve-lp'
import * as dripper from './processors/oeth/dripper'
import * as fraxStaking from './processors/oeth/frax-staking'
import * as morphoAave from './processors/oeth/morpho-aave'
import * as vault from './processors/oeth/vault'
import * as ousd from './processors/ousd'
import * as strategies from './processors/strategies'

run({
  processors: [
    // Block Frequency Updates
    aaveCompound,
    curve,
    strategies,
    // OETH Related
    oeth,
    vault,
    fraxStaking,
    morphoAave,
    dripper,
    curveLp,
    balancerMetaPoolStrategy,
    // OUSD Related
    // ousd,
  ],
  postProcessors: [exchangeRates],
  validators: [validateOeth],
})
