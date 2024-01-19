import { EvmBatchProcessor } from '@subsquid/evm-processor'

import { OETHRewardTokenCollected } from '../../../model'
import { Context } from '../../../processor'
import { currencies } from '../../../shared/post-processors/exchange-rates/currencies'
import {
  IStrategyData,
  createStrategyProcessor,
  createStrategySetup,
} from '../../../shared/processor-templates/strategy'
import {
  createStrategyRewardProcessor,
  createStrategyRewardSetup,
} from '../../../shared/processor-templates/strategy-rewards'
import {
  ETH_ADDRESS,
  FRXETH_ADDRESS,
  OETH_ADDRESS,
  OETH_VAULT_ADDRESS,
  RETH_ADDRESS,
  STETH_ADDRESS,
  WETH_ADDRESS,
  addresses,
} from '../../../utils/addresses'

export const oethStrategies: readonly IStrategyData[] = [
  {
    from: 17249899,
    name: 'OETH Convex ETH+OETH (AMO)',
    contractName: 'ConvexEthMetaStrategy',
    address: addresses.strategies.oeth.ConvexEthMetaStrategy,
    oTokenAddress: OETH_ADDRESS,
    kind: 'CurveAMO',
    curvePoolInfo: {
      poolAddress: '0x94b17476a93b3262d87b9a326965d1e91f9c13e7',
      rewardsPoolAddress: '0x24b65dc1cf053a8d96872c323d29e86ec43eb33a',
    },
    base: { address: currencies.ETH, decimals: 18 },
    assets: [ETH_ADDRESS, OETH_ADDRESS].map((address) => ({
      address,
      decimals: 18,
    })),
    earnings: { rewardTokenCollected: true, passiveByDepositWithdrawal: true },
  },
  {
    from: 17067232,
    name: 'OETH Frax Staking',
    contractName: 'FraxETHStrategy',
    address: addresses.strategies.oeth.FraxETHStrategy,
    oTokenAddress: OETH_ADDRESS,
    kind: 'Generic',
    base: { address: currencies.ETH, decimals: 18 },
    assets: [FRXETH_ADDRESS].map((address) => ({ address, decimals: 18 })),
    earnings: { passiveByDepositWithdrawal: true, rewardTokenCollected: true },
  },
  {
    from: 17367105,
    name: 'OETH Morpho Aave V2',
    contractName: 'MorphoAaveStrategy',
    address: '0xc1fc9e5ec3058921ea5025d703cbe31764756319',
    oTokenAddress: OETH_ADDRESS,
    kind: 'Generic',
    base: { address: currencies.ETH, decimals: 18 },
    assets: [WETH_ADDRESS].map((address) => ({ address, decimals: 18 })),
    earnings: { passiveByDepositWithdrawal: true, rewardTokenCollected: true },
  },
  {
    from: 18156225,
    name: 'OETH Aura rETH/WETH',
    contractName: 'BalancerMetaPoolStrategy',
    address: addresses.strategies.oeth.BalancerMetaPoolStrategy,
    oTokenAddress: OETH_ADDRESS,
    kind: 'BalancerMetaStablePool',
    base: { address: currencies.ETH, decimals: 18 },
    assets: [
      {
        address: WETH_ADDRESS,
        decimals: 18,
      },
      {
        address: RETH_ADDRESS,
        decimals: 18,
        convertTo: {
          address: ETH_ADDRESS,
          decimals: 18,
        },
      },
    ],
    earnings: {
      rewardTokenCollected: true,
      passiveByDepositWithdrawal: true,
    },
    balancerPoolInfo: {
      poolId:
        '0x1e19cf2d73a72ef1332c882f20534b6519be0276000200000000000000000112',
      poolAddress: '0x1e19cf2d73a72ef1332c882f20534b6519be0276',
    },
  },
  {
    from: 17141121,
    name: 'OETH Vault (rETH)',
    contractName: 'VaultCore',
    address: OETH_VAULT_ADDRESS,
    oTokenAddress: OETH_ADDRESS,
    kind: 'Vault',
    base: { address: RETH_ADDRESS, decimals: 18 },
    assets: [RETH_ADDRESS].map((address) => ({
      address,
      decimals: 18,
      convertTo: {
        address: ETH_ADDRESS,
        decimals: 18,
      },
    })),
  },
  {
    from: 17067232,
    name: 'OETH Vault (stETH)',
    contractName: 'VaultCore',
    address: OETH_VAULT_ADDRESS,
    oTokenAddress: OETH_ADDRESS,
    kind: 'Vault',
    base: { address: STETH_ADDRESS, decimals: 18 },
    assets: [STETH_ADDRESS].map((address) => ({
      address,
      decimals: 18,
    })),
  },
  {
    from: 17067232,
    name: 'OETH Vault (WETH)',
    contractName: 'VaultCore',
    address: OETH_VAULT_ADDRESS,
    oTokenAddress: OETH_ADDRESS,
    kind: 'Vault',
    base: { address: ETH_ADDRESS, decimals: 18 },
    assets: [WETH_ADDRESS].map((address) => ({
      address,
      decimals: 18,
    })),
  },
]

const strategies = oethStrategies

export const from = Math.min(...strategies.map((s) => s.from))

export const setup = (processor: EvmBatchProcessor) => {
  strategies.forEach((s) => createStrategySetup(s)(processor))
  strategies
    .filter((s) => s.kind !== 'Vault')
    .forEach((s) => createStrategyRewardSetup(s)(processor))
}

const processors = [
  ...strategies.map(createStrategyProcessor),
  ...strategies
    .filter((s) => s.kind !== 'Vault')
    .map((strategy) =>
      createStrategyRewardProcessor({
        ...strategy,
        OTokenRewardTokenCollected: OETHRewardTokenCollected,
      }),
    ),
]

export const process = async (ctx: Context) => {
  await Promise.all(processors.map((p) => p(ctx)))
}
