import { EvmBatchProcessor } from '@subsquid/evm-processor'
import dayjs from 'dayjs'
import { MoreThan } from 'typeorm'

import * as abiNodeDelegator from '../abi/el-node-delegator'
import * as abiErc20 from '../abi/erc20'
import * as abiDepositPool from '../abi/lrt-deposit-pool'
import * as abiOracle from '../abi/lrt-oracle'
import {
  LRTBalanceData,
  LRTDeposit,
  LRTNodeDelegator,
  LRTNodeDelegatorHoldings,
  LRTPointRecipient,
  LRTSummary,
} from '../model'
import { Block, Context, Log } from '../processor'
import { logFilter } from '../utils/logFilter'
import { multicall } from '../utils/multicall'
import { calculateRecipientsPoints } from './calculation'
import * as config from './config'
import {
  getBalanceDataForRecipient,
  getLastSummary,
  getLatestNodeDelegator,
  getRecipient,
  useLrtState,
} from './state'

// Export
export const from = config.startBlock

// CONSTANTS
const RANGE = { from: config.startBlock }
const HOUR_MS = 3600000

// FILTERS
const depositFilter = logFilter({
  address: [config.addresses.lrtDepositPool],
  topic0: [abiDepositPool.events.AssetDeposit.topic],
  range: RANGE,
})
const transferFilter = logFilter({
  address: [config.addresses.lrtToken],
  topic0: [abiErc20.events.Transfer.topic],
  range: RANGE,
})
const assetDepositIntoStrategyFilter = logFilter({
  address: config.addresses.nodeDelegators.map((n) => n.address),
  topic0: [abiNodeDelegator.events.AssetDepositIntoStrategy.topic],
  range: RANGE,
})

// AssetDepositIntoStrategy
export const setup = (processor: EvmBatchProcessor) => {
  processor.addLog(depositFilter.value)
  processor.addLog(transferFilter.value)
  processor.addLog(assetDepositIntoStrategyFilter.value)
  processor.includeAllBlocks(RANGE) // need for the hourly processing
}

// we use this variable to keep track of the last hour we processed
// this increases every time we process a block that is in a new hour
let lastHourProcessed = 0
let haveNodeDelegatorInstance = false
export const initialize = async (ctx: Context) => {
  const nodeDelegator = await getLatestNodeDelegator(
    ctx,
    config.addresses.nodeDelegators[0].address,
  )
  lastHourProcessed = nodeDelegator
    ? Math.floor(nodeDelegator.timestamp.getTime() / HOUR_MS)
    : 0
  haveNodeDelegatorInstance = !!nodeDelegator
}

export const process = async (ctx: Context) => {
  // ============================
  // Process chain data
  for (const block of ctx.blocks) {
    for (const log of block.logs) {
      if (depositFilter.matches(log)) {
        await processDeposit(ctx, block, log)
      }
      if (transferFilter.matches(log)) {
        await processTransfer(ctx, block, log)
      }
      if (assetDepositIntoStrategyFilter.matches(log)) {
        await createLRTNodeDelegator(ctx, block, log.address.toLowerCase())
      }
    }
    await processHourly(ctx, block)
  }
}

const saveAndResetState = async (ctx: Context) => {
  const state = useLrtState(ctx)
  await ctx.store.insert([...state.deposits.values()])
  await ctx.store.upsert([...state.recipients.values()])
  await ctx.store.upsert([...state.balanceData.values()])
  await ctx.store.upsert([...state.nodeDelegators.values()])
  await ctx.store.upsert([...state.nodeDelegatorHoldings.values()])
  state.deposits.clear()
  state.recipients.clear()
  state.balanceData.clear()
  state.nodeDelegators.clear()
  state.nodeDelegatorHoldings.clear()
}

const processHourly = async (ctx: Context, block: Block) => {
  const blockHour = Math.floor(block.header.timestamp / HOUR_MS)
  const state = useLrtState(ctx)

  if (lastHourProcessed !== blockHour) {
    ctx.log.info(`Processing hour: ${blockHour}`)

    // ensure that we don't miss any hours
    const hoursPassed = blockHour - lastHourProcessed
    if (lastHourProcessed !== 0 && hoursPassed !== 1) {
      throw new Error('Something is wrong. We should trigger once per hour.')
    }

    await saveAndResetState(ctx)
    const { summary, recipients } = await createSummary(ctx, block)

    if (haveNodeDelegatorInstance) {
      // Calculate EL POINTS!
      const totalBalance = recipients.reduce((sum, r) => sum + r.balance, 0n)
      let totalPointsEarned = 0n
      for (const node of config.addresses.nodeDelegators.filter(
        (n) => n.blockNumber > block.header.height,
      )) {
        const { pointsEarned } = await createLRTNodeDelegator(
          ctx,
          block,
          node.address,
          true,
        )
        totalPointsEarned += pointsEarned
      }
      for (const recipient of recipients) {
        recipient.elPoints +=
          (recipient.balance * totalPointsEarned) / totalBalance
      }
      summary.elPoints += totalPointsEarned
      await ctx.store.save(summary)
      await ctx.store.save(recipients)
      await ctx.store.upsert([...state.nodeDelegators.values()])
      await ctx.store.upsert([...state.nodeDelegatorHoldings.values()])
    }
    lastHourProcessed = blockHour
  }
}

const createSummary = async (ctx: Context, block: Block) => {
  const lastBlock = block
  const lastSummary = await getLastSummary(ctx)

  // This is a big update - we load everything!
  // Can iterate through this in batches later if needed.
  const recipients = await ctx.store.find(LRTPointRecipient, {
    where: { balance: MoreThan(0n) },
    relations: {
      balanceData: {
        recipient: true,
      },
    },
  })

  // Create Summary
  const summary = new LRTSummary({
    id: lastBlock.header.id,
    timestamp: new Date(lastBlock.header.timestamp),
    blockNumber: lastBlock.header.height,
    balance: recipients.reduce((sum, r) => sum + r.balance, 0n),
    points: calculateRecipientsPoints(lastBlock.header.timestamp, recipients),
    elPoints: lastSummary?.elPoints ?? 0n,
  })
  await ctx.store.insert(summary)
  await ctx.store.save(recipients)

  // Save Updated Balance Data (from `calculateRecipientsPoints`)
  const updatedBalanceData = recipients.flatMap((r) => r.balanceData)
  await ctx.store.save(updatedBalanceData)

  return { summary, recipients }
}

const processDeposit = async (ctx: Context, block: Block, log: Log) => {
  const state = useLrtState(ctx)
  const {
    depositor: depositorAddress,
    asset,
    depositAmount,
    primeEthMintAmount,
    referralId,
  } = abiDepositPool.events.AssetDeposit.decode(log)
  // ctx.log.info(
  //   `${block.header.timestamp} processDeposit: ${depositorAddress} ${log.transactionHash}`,
  // )
  const timestamp = new Date(block.header.timestamp)
  const deposit = new LRTDeposit({
    id: log.id,
    blockNumber: block.header.height,
    timestamp: timestamp,
    asset: asset.toLowerCase(),
    depositor: depositorAddress.toLowerCase(),
    depositAmount,
    amountReceived: primeEthMintAmount,
    referralId,
  })
  state.deposits.set(deposit.id, deposit)
  await addBalance(ctx, {
    log,
    depositAsset: deposit.asset,
    recipient: deposit.depositor,
    timestamp: deposit.timestamp,
    balance: deposit.amountReceived,
  })
}

const processTransfer = async (ctx: Context, block: Block, log: Log) => {
  const data = abiErc20.events.Transfer.decode(log)
  // ctx.log.info(
  //   `${block.header.timestamp} processTransfer: ${data.from} ${data.to} ${log.transactionHash}`,
  // )
  await transferBalance(ctx, {
    log,
    timestamp: new Date(block.header.timestamp),
    from: data.from.toLowerCase(),
    to: data.to.toLowerCase(),
    amount: data.value,
  })
}

// FIXME: should we call this getLRTPoolDeposits?
const createLRTNodeDelegator = async (
  ctx: Context,
  block: Block,
  node: string,
  calculatePoints: boolean = false,
) => {
  const state = useLrtState(ctx)
  const delegatorContract = new abiNodeDelegator.Contract(
    ctx,
    block.header,
    node,
  )
  const [assets, balances] = await delegatorContract.getAssetBalances()

  // Get the rates for the assets
  const rates = await multicall(
    ctx,
    block.header,
    abiOracle.functions.getAssetPrice,
    config.addresses.lrtOracle,
    assets.map((asset) => [asset]),
  )
  // Convert the balances to ETH
  const ethBalances = balances.map(
    (balance, i) => (balance * rates[i]) / 1_000000000_000000000n,
  )
  // Sum the ETH balances
  const totalAmount = ethBalances.reduce(
    (sum, ethBalance) => sum + ethBalance,
    0n,
  )

  // FIXME: why get latest?
  const lastNodeDelegatorEntry = await getLatestNodeDelegator(
    ctx,
    node.toLowerCase(),
  )
  let pointsEarned = 0n
  if (calculatePoints) {
    const calcPoints = (ethAmount: bigint, hours: number) =>
      ethAmount * BigInt(hours)
    if (lastNodeDelegatorEntry) {
      const lastHour = Math.floor(
        lastNodeDelegatorEntry.timestamp.getTime() / HOUR_MS,
      )
      const currentHour = Math.floor(block.header.timestamp / HOUR_MS)
      const hours = currentHour - lastHour
      pointsEarned = calcPoints(totalAmount, hours)
    }
  }

  const nodeDelegator = new LRTNodeDelegator({
    id: `${block.header.height}:${node}`,
    blockNumber: block.header.height,
    timestamp: new Date(block.header.timestamp),
    node: node.toLowerCase(),
    amount: totalAmount,
    points: (lastNodeDelegatorEntry?.points ?? 0n) + pointsEarned,
    holdings: [],
  })
  nodeDelegator.holdings = assets.map((asset, i) => {
    const lastHolding = lastNodeDelegatorEntry?.holdings.find(
      (h) => h.asset === asset.toLowerCase(),
    )
    const holding = new LRTNodeDelegatorHoldings({
      id: `${block.header.height}:${node}:${asset.toLowerCase()}`,
      asset: asset.toLowerCase(),
      delegator: nodeDelegator,
      amount: ethBalances[i],
      points: lastHolding?.points ?? 0n,
    })
    state.nodeDelegatorHoldings.set(holding.id, holding)
    return holding
  })

  state.nodeDelegators.set(nodeDelegator.id, nodeDelegator)
  haveNodeDelegatorInstance = true
  return { nodeDelegator, pointsEarned }
}

const addBalance = async (
  ctx: Context,
  params: {
    log: Log
    timestamp: Date
    recipient: string
    balance: bigint
    depositAsset?: string
    conditionNameFilter?: string
  },
) => {
  const state = useLrtState(ctx)
  const recipient = await getRecipient(ctx, params.recipient.toLowerCase())
  recipient.balance += params.balance
  const balanceData = new LRTBalanceData({
    id: params.log.id,
    recipient,
    asset: params.depositAsset,
    balance: params.balance,
    balanceDate: params.timestamp,
    staticPointsDate: params.timestamp,
    staticPoints: 0n,
  })
  recipient.balanceData.push(balanceData)
  state.balanceData.set(balanceData.id, balanceData)
}

const removeBalance = async (
  ctx: Context,
  params: {
    log: Log
    timestamp: Date
    recipient: string
    balance: bigint
  },
) => {
  const state = useLrtState(ctx)
  const recipient = await getRecipient(ctx, params.recipient)
  calculateRecipientsPoints(params.timestamp.getTime(), [recipient])
  recipient.balance -= params.balance
  let amountToRemove = params.balance
  const balanceData = await getBalanceDataForRecipient(ctx, params.recipient)
  if (!balanceData.length) {
    throw new Error(
      `should have results here for ${params.recipient}, tx ${params.log.transactionHash}`,
    )
  }
  for (const data of balanceData) {
    if (amountToRemove === 0n) return
    if (amountToRemove > data.balance) {
      amountToRemove -= data.balance
      data.balance = 0n
    } else {
      data.balance -= amountToRemove
      amountToRemove = 0n
    }
    if (data.balance === 0n && data.staticPoints === 0n) {
      state.balanceData.delete(data.id)
    } else {
      state.balanceData.set(data.id, data)
    }
  }
}

const transferBalance = async (
  ctx: Context,
  params: {
    log: Log
    timestamp: Date
    from: string
    to: string
    amount: bigint
  },
) => {
  // ctx.log.info({ from: params.from, to: params.to }, 'transferPoints')
  if (params.from === '0x0000000000000000000000000000000000000000') {
    // We don't need to reach `addBalance` here because it is added in the deposit handler.
    return
  }
  await removeBalance(ctx, {
    log: params.log,
    timestamp: params.timestamp,
    recipient: params.from,
    balance: params.amount,
  })
  if (params.to === '0x0000000000000000000000000000000000000000') return
  await addBalance(ctx, {
    log: params.log,
    timestamp: params.timestamp,
    recipient: params.to,
    balance: params.amount,
    conditionNameFilter: 'standard',
  })
}
