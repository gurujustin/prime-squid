import * as abstractStrategyAbi from '../../../abi/initializable-abstract-strategy'
import { currencies } from '../../../shared/post-processors/exchange-rates/currencies'
import { IStrategyData } from '../../../shared/processor-templates/strategy'
import { OUSD_ADDRESS } from '../../../utils/addresses'
import { traceFilter } from '../../../utils/traceFilter'
import { DAI, USDC, USDT } from './const'

export const convexMetaStrategy: IStrategyData = {
  from: 15896478,
  oTokenAddress: OUSD_ADDRESS,
  kind: 'CurveAMO',
  name: 'OUSD Convex OUSD+3Crv (AMO)',
  contractName: 'ConvexOUSDMetaStrategy',
  address: '0x89eb88fedc50fc77ae8a18aad1ca0ac27f777a90'.toLowerCase(),
  base: { address: currencies.USD, decimals: 18 },
  assets: [DAI, USDT, USDC],
  balanceUpdateTraceFilters: [
    traceFilter({
      type: ['call'],
      callTo: ['0x89eb88fedc50fc77ae8a18aad1ca0ac27f777a90'.toLowerCase()],
      callSighash: [
        abstractStrategyAbi.functions.withdraw.sighash,
        abstractStrategyAbi.functions.withdrawAll.sighash,
        abstractStrategyAbi.functions.deposit.sighash,
        abstractStrategyAbi.functions.depositAll.sighash,
      ],
      transaction: true,
      range: { from: 15896478 },
    }),
  ],
  earnings: {
    passiveByDepositWithdrawal: true,
    rewardTokenCollected: true,
  },
  curvePoolInfo: {
    poolAddress: '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7'.toLowerCase(),
    rewardsPoolAddress:
      '0x7D536a737C13561e0D2Decf1152a653B4e615158'.toLowerCase(),
  },
}
