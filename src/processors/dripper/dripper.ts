import { EvmBatchProcessor } from '@subsquid/evm-processor'
import { pad } from 'viem'

import * as erc20 from '../../abi/erc20'
import { Dripper } from '../../model'
import { Context } from '../../processor'
import { OETH_DRIPPER_ADDRESS, WETH_ADDRESS } from '../../utils/addresses'
import { updateFinancialStatement } from '../financial-statement'
import { getLatestEntity, trackAddressBalances } from '../utils'

interface ProcessResult {
  drippers: Dripper[]
}

export const from = 17067704 // https://etherscan.io/tx/0x8e4217c5883891816b9035100b0b1342492f8e618029bf022bdc85bf9aa330f2

export const setup = (processor: EvmBatchProcessor) => {
  processor.addLog({
    address: [WETH_ADDRESS],
    topic0: [erc20.events.Transfer.topic],
    topic1: [pad(OETH_DRIPPER_ADDRESS)],
  })
  processor.addLog({
    address: [WETH_ADDRESS],
    topic0: [erc20.events.Transfer.topic],
    topic2: [pad(OETH_DRIPPER_ADDRESS)],
  })
}

export const process = async (ctx: Context) => {
  const result: ProcessResult = {
    drippers: [],
  }

  for (const block of ctx.blocks) {
    for (const log of block.logs) {
      await processTransfer(ctx, result, block, log)
    }
  }

  await ctx.store.insert(result.drippers)
}

const processTransfer = async (
  ctx: Context,
  result: ProcessResult,
  block: Context['blocks']['0'],
  log: Context['blocks']['0']['logs']['0'],
) => {
  if (log.topics[0] === erc20.events.Transfer.topic) {
    await trackAddressBalances({
      log,
      address: OETH_DRIPPER_ADDRESS,
      tokens: [WETH_ADDRESS],
      fn: async ({ log, token, change }) => {
        const timestampId = new Date(block.header.timestamp).toISOString()
        const { latest, current } = await getLatestEntity(
          ctx,
          Dripper,
          result.drippers,
          timestampId,
        )

        let dripper = current
        if (!dripper) {
          dripper = new Dripper({
            id: timestampId,
            timestamp: new Date(block.header.timestamp),
            blockNumber: block.header.height,
            weth: latest?.weth ?? 0n,
          })
          result.drippers.push(dripper)
          await updateFinancialStatement(ctx, block, { dripper })
        }

        dripper.weth += change
      },
    })
  }
}
