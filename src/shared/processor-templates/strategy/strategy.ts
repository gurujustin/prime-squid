import { EvmBatchProcessor } from '@subsquid/evm-processor'

import { Context } from '../../../processor'
import { LogFilter } from '../../../utils/logFilter'
import * as strategyBalancer from './strategy-balancer'
import * as strategyCurveAMO from './strategy-curve-amo'
import * as strategyGeneric from './strategy-generic'

export type IBalancerPoolInfo = {
  poolId: string
  poolAddress: string
}

export type ICurveAMOInfo = {
  poolAddress: string
  rewardsPoolAddress: string
}

export type IStrategyData = {
  from: number
  name: string
  contractName: string
  address: string
  kind:
    | 'Generic'
    | 'CurveAMO'
    | 'BalancerMetaStablePool'
    | 'BalancerComposableStablePool'
  base: {
    address: string
    decimals: number
  }
  assets: {
    address: string
    decimals: number
  }[]
  balanceUpdateFilters?: LogFilter[]
  aaveInfo?: {
    lendingPool: string
    pTokens: string[]
  }
  balancerPoolInfo?: IBalancerPoolInfo
  curvePoolInfo?: ICurveAMOInfo
  earnings: {
    rewardTokenCollected?: boolean
    passiveByDepositWithdrawal?: boolean
  }
}

const processors: Record<
  IStrategyData['kind'],
  {
    setup: (processor: EvmBatchProcessor, strategyData: IStrategyData) => void
    process: (ctx: Context, strategyData: IStrategyData) => Promise<void>
  }
> = {
  Generic: strategyGeneric,
  CurveAMO: strategyCurveAMO,
  BalancerMetaStablePool: strategyBalancer,
  BalancerComposableStablePool: {
    setup: () => Promise.reject('Not implemented.'),
    process: () => Promise.reject('Not implemented.'),
  },
}

export const createStrategySetup = (strategyData: IStrategyData) => {
  const { kind } = strategyData
  const processor = processors[kind]
  if (processor) {
    return (p: EvmBatchProcessor) => processor.setup(p, strategyData)
  } else {
    throw new Error(`Unsupported strategy kind: ${kind}`)
  }
}

// Used by `src/processors/strategies/strategies.ts`
export const createStrategyProcessor = (strategyData: IStrategyData) => {
  const { kind } = strategyData
  const processor = processors[kind]
  if (processor) {
    return (ctx: Context) => processor.process(ctx, strategyData)
  } else {
    throw new Error(`Unsupported strategy kind: ${kind}`)
  }
}
