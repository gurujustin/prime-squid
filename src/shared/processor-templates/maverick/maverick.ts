import { EvmBatchProcessor } from '@subsquid/evm-processor'

import * as maverickPool from '../../../abi/maverick-pool'
import { MaverickPoolBalance } from '../../../model'
import { Context } from '../../../processor'
import { blockFrequencyUpdater } from '../../../utils/blockFrequencyUpdater'

// Maverick Pool Reference: https://docs.mav.xyz/guides/technical-reference/pool

interface ProcessResult {
  maverickPoolBalances: MaverickPoolBalance[]
}

export const createMaverickSetup = (
  from: number,
  processor: EvmBatchProcessor,
) => {
  processor.includeAllBlocks({ from })
}

export const createMaverickProcessor = ({
  name,
  address,
  from,
}: {
  name: string
  address: string
  from: number
}) => {
  const update = blockFrequencyUpdater({ from })
  return async (ctx: Context) => {
    const result: ProcessResult = {
      maverickPoolBalances: [],
    }
    await update(ctx, async (ctx, block) => {
      const timestamp = new Date(block.header.timestamp)
      const timestampId = timestamp.toISOString()
      const contract = new maverickPool.Contract(ctx, block.header, address)

      // TODO: use `get_balances()` where possible
      const [binBalanceA, binBalanceB] = await Promise.all([
        contract.binBalanceA(),
        contract.binBalanceB(),
      ])
      const curve = new MaverickPoolBalance({
        id: `${address}-${timestampId}`,
        blockNumber: block.header.height,
        timestamp: new Date(block.header.timestamp),
        address: address,
        binBalanceA: binBalanceA ?? 0n,
        binBalanceB: binBalanceB ?? 0n,
      })
      result.maverickPoolBalances.push(curve)
    })
    await ctx.store.insert(result.maverickPoolBalances)
  }
}
