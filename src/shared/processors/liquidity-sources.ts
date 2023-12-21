import { LiquiditySource, LiquiditySourceType } from '../../model'
import { Context } from '../../processor'

const sources = new Map<string, LiquiditySource>()

export const registerLiquiditySource = (
  address: string,
  type: LiquiditySourceType,
  token: string,
) => {
  sources.set(
    address,
    new LiquiditySource({ id: address, address, type, token }),
  )
}

export const from = Number.MAX_SAFE_INTEGER // does not apply here
export const initialize = async (ctx: Context) => {
  await ctx.store.upsert([...sources.values()])
}
export const process = () => Promise.resolve()

// Liquidity Source Definitions
registerLiquiditySource(
  '0x3ed3b47dd13ec9a98b44e6204a523e766b225811', // aUSDT
  LiquiditySourceType.Aave,
  '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
)

registerLiquiditySource(
  '0xbcca60bb61934080951369a648fb03df4f96263c', // aUSDC
  LiquiditySourceType.Aave,
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
)

registerLiquiditySource(
  '0x028171bca77440897b824ca71d1c56cac55b68a3', // aDAI
  LiquiditySourceType.Aave,
  '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
)

registerLiquiditySource(
  '0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9', // cUSDT
  LiquiditySourceType.Compound,
  '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
)

registerLiquiditySource(
  '0x39aa39c021dfbae8fac545936693ac917d5e7563', // cUSDC
  LiquiditySourceType.Compound,
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
)

registerLiquiditySource(
  '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643', // cDAI
  LiquiditySourceType.Compound,
  '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
)

registerLiquiditySource(
  '0xa4e0faA58465A2D369aa21B3e42d43374c6F9613', // Uniswap rETH/WETH
  LiquiditySourceType.UniswapPool,
  '0xae78736cd615f374d3085123a210448e74fc6393', // rETH
)

registerLiquiditySource(
  '0x109830a1aaad605bbf02a9dfa7b0b92ec2fb7daa', // Uniswap wstETH/WETH
  LiquiditySourceType.UniswapPool,
  '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0', // wstETH
)
