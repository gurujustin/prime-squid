import dayjs from 'dayjs'
import { LessThan, MoreThanOrEqual } from 'typeorm'

import * as otoken from '../../abi/otoken'
import {
  OETHAPY,
  OETHAddress,
  OETHRebase,
  OUSDAPY,
  OUSDAddress,
  OUSDRebase,
  RebasingOption,
} from '../../model'
import { Context } from '../../processor'

/**
 * Create a new Address entity
 */
export async function createAddress<
  T extends typeof OETHAddress | typeof OUSDAddress,
>(entity: T, ctx: Context, addr: string, lastUpdated?: Date) {
  let isContract: boolean = false
  if (addr !== '0x0000000000000000000000000000000000000000') {
    isContract =
      (await ctx._chain.client.call('eth_getCode', [addr, 'latest'])) !== '0x'
  }

  // ctx.log.info(`New address ${rawAddress}`);
  return new entity({
    id: addr,
    balance: 0n,
    earned: 0n,
    credits: 0n,
    isContract,
    rebasingOption: isContract ? RebasingOption.OptOut : RebasingOption.OptIn,
    lastUpdated,
  })
}

/**
 * Create Rebase entity and set APY
 */
export async function createRebaseAPY<
  TOTokenAPY extends typeof OETHAPY | typeof OUSDAPY,
  TOTokenRebase extends typeof OETHRebase | typeof OUSDRebase,
>(
  OTokenAPY: TOTokenAPY,
  OTokenRebase: TOTokenRebase,
  ctx: Context,
  apies: InstanceType<TOTokenAPY>[],
  block: Context['blocks']['0'],
  log: Context['blocks']['0']['logs']['0'],
  rebaseEvent: ReturnType<
    typeof otoken.events.TotalSupplyUpdatedHighres.decode
  >,
  lastYieldDistributionEvent: {
    fee: bigint
    yield: bigint
  },
) {
  const rebase = new OTokenRebase({
    id: log.id,
    blockNumber: block.header.height,
    timestamp: new Date(block.header.timestamp),
    txHash: log.transactionHash,
    rebasingCredits: rebaseEvent.rebasingCredits,
    rebasingCreditsPerToken: rebaseEvent.rebasingCreditsPerToken,
    totalSupply: rebaseEvent.totalSupply,
    fee: lastYieldDistributionEvent.fee,
    yield: lastYieldDistributionEvent.yield,
  })

  // use date as id for APY
  const date = new Date(block.header.timestamp)
  const dateId = date.toISOString().substring(0, 10)

  // get last APY to compare with current one
  let lastApy =
    apies.find((apy) => apy.id < dateId) ??
    (await ctx.store.findOne(OTokenAPY, {
      where: { id: LessThan(dateId) },
      order: { id: 'DESC' },
    }))

  // check if there is already an APY for the current date
  let apy: InstanceType<TOTokenAPY> | undefined = apies.find(
    (apy) => apy.id === dateId,
  )
  if (!apy) {
    apy = (await ctx.store.findOne(OTokenAPY, {
      where: { id: dateId },
    })) as InstanceType<TOTokenAPY>
    if (apy) {
      apies.push(apy)
    }
  }
  // ctx.log.info(`APY: ${dateId} ${apy}, ${lastDateId} ${lastApy}`);
  // create a new APY if it doesn't exist
  if (!apy) {
    apy = new OTokenAPY({
      id: dateId,
      blockNumber: block.header.height,
      timestamp: new Date(block.header.timestamp),
      txHash: log.transactionHash,
      rebasingCreditsPerToken: rebaseEvent.rebasingCreditsPerToken,
    }) as InstanceType<TOTokenAPY>
    apies.push(apy)
  }

  rebase.apy = apy

  // should only happen for the first rebase event
  if (!lastApy) {
    apy.apr = 0
    apy.apy = 0
    apy.apy7DayAvg = 0
    apy.apy14DayAvg = 0
    apy.apy30DayAvg = 0

    return rebase
  }

  // update APY with the new rebase event
  apy.blockNumber = block.header.height
  apy.timestamp = new Date(block.header.timestamp)
  apy.txHash = log.transactionHash
  apy.rebasingCreditsPerToken = rebaseEvent.rebasingCreditsPerToken

  // this should normally be 1 day but more secure to calculate it
  const diffTime = apy.timestamp.getTime() - lastApy.timestamp.getTime()
  const dayDiff = diffTime / (1000 * 60 * 60 * 24)

  apy.apr =
    (Number(lastApy.rebasingCreditsPerToken) /
      Number(apy.rebasingCreditsPerToken) -
      1) *
    (365.25 / dayDiff)
  const periods_per_year = 365.25 / Number(dayDiff)
  apy.apy = (1 + apy.apr / periods_per_year) ** periods_per_year - 1

  const last7daysDateId = {
    key: 'apy7DayAvg' as const,
    value: dayjs(date).subtract(7, 'days').toISOString().substring(0, 10),
  }
  const last14daysDateId = {
    key: 'apy14DayAvg' as const,
    value: dayjs(date).subtract(14, 'days').toISOString().substring(0, 10),
  }
  const last30daysDateId = {
    key: 'apy30DayAvg' as const,
    value: dayjs(date).subtract(30, 'days').toISOString().substring(0, 10),
  }

  // calculate average APY for the last 7, 14 and 30 days
  await Promise.all(
    [last7daysDateId, last14daysDateId, last30daysDateId].map(async (i) => {
      const pastAPYs = await ctx.store.findBy(OTokenAPY, {
        id: MoreThanOrEqual(i.value),
      })
      apy![i.key] =
        pastAPYs.reduce((acc, cur) => acc + cur.apy, apy!.apy) /
        (pastAPYs.length + 1)
    }),
  )

  return rebase
}