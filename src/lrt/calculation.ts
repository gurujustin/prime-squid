import { EntityManager, In } from 'typeorm'
import { parseEther } from 'viem'

import { LRTBalanceData, LRTPointRecipient } from '../model'
import { Context } from '../processor'
import {
  balanceBonuses,
  pointConditions,
  pointInterval,
  referralConditions,
} from './config'
import { encodeAddress } from './encoding'
import {
  getReferralDataForRecipient,
  getReferralDataForReferralCodes,
  isReferralSelfReferencing,
  isValidReferralId,
} from './referrals'
import { useLrtState } from './state'

const sum = (vs: bigint[]) => vs.reduce((sum, v) => sum + v, 0n)

interface ReferralPointData {
  referralId: string
  address: string | undefined
  referralPointsBase: bigint
  referralMultiplier: bigint
  outgoingReferralMultiplier: bigint
}

export const calculateRecipientsPoints = async (
  ctxOrEm: Context | EntityManager,
  timestamp: number,
  recipients: LRTPointRecipient[],
  memo = new Map<
    string,
    {
      referralPointsArray: ReferralPointData[]
      refereePoints: bigint
      refererPoints: bigint
    }
  >(), // Who have we already calculated in this self-referencing function?
) => {
  const state = useLrtState()
  let totalPoints = 0n
  const totalReferralPoints: ReferralPointData[] = []
  for (const recipient of recipients) {
    if (memo.has(recipient.id)) {
      const lastResult = memo.get(recipient.id)!
      totalReferralPoints.push(...lastResult.referralPointsArray)
      totalPoints += lastResult.refererPoints + lastResult.refereePoints
      continue
    }
    state?.recipients.set(recipient.id, recipient)
    const { points, referralPointsArray } = calculatePoints(
      timestamp,
      recipient,
      recipient.balanceData,
    )
    totalReferralPoints.push(...referralPointsArray)

    // =========================
    // =========================
    // Points from using referral codes
    // =========================
    const refereePoints = sum(
      referralPointsArray.map((r) => {
        return (r.referralPointsBase * r.referralMultiplier) / 100n
      }),
    )
    recipient.referralCount = referralPointsArray.length
    recipient.points = points + refereePoints
    recipient.referralPoints = refereePoints
    recipient.pointsDate = new Date(timestamp)
    totalPoints += points

    // =========================
    // =========================
    // Points from others using this recipient's referral codes
    // =========================
    const recipientReferralData = getReferralDataForRecipient(recipient.id)
    const recipientReferralCodes = [
      ...recipientReferralData.map((d) => d.referralId),
      recipient.id,
      encodeAddress(recipient.id),
    ]

    // TODO: Optimize?
    const referringRecipients = [...state.recipients.values()].filter((r) =>
      r.balanceData.find(
        (bd) => bd.referralId && recipientReferralCodes.includes(bd.referralId),
      ),
    )

    const { totalReferralPoints: referringRecipientsPointData } =
      await calculateRecipientsPoints(
        ctxOrEm,
        timestamp,
        referringRecipients,
        memo,
      )

    const incomingReferralPointsData = referringRecipientsPointData.filter(
      (rp) => recipientReferralCodes.includes(rp.referralId),
    )

    const refererPoints = incomingReferralPointsData.reduce(
      (sum, incoming) =>
        sum +
        (incoming.referralPointsBase *
          (incoming.referralMultiplier + incoming.outgoingReferralMultiplier)) /
          100n,
      0n,
    )

    recipient.referrerCount = incomingReferralPointsData.length
    recipient.points += refererPoints
    recipient.referralPoints += refererPoints
    totalPoints += refererPoints
    memo.set(recipient.id, {
      referralPointsArray,
      refereePoints,
      refererPoints,
    })
  }
  return { totalPoints, totalReferralPoints, count: memo.size }
}

/**
 * This will update entity data, which you will have to save later if you want to keep.
 */
const calculatePoints = (
  timestamp: number,
  recipient: LRTPointRecipient,
  balanceData: LRTBalanceData[],
) => {
  const state = useLrtState()
  let points = 0n
  const referralPointsArray: ReferralPointData[] = []
  for (const data of balanceData) {
    state?.balanceData.set(data.id, data)
    const balanceMult = balanceMultiplier(recipient.balance)
    let referralBalanceEarned = 0n
    const conditionPoints = pointConditions.map((c) => {
      if (c.balanceStartDate && c.balanceStartDate > data.balanceDate) return 0n
      if (c.balanceEndDate && c.balanceEndDate < data.balanceDate) return 0n
      // BUGFIX: This was missing until 2024-03-01 (1709251200000)
      if (c.asset && data.asset !== c.asset && timestamp >= 1709251200000) {
        return 0n
      }
      const startTime = Math.max(
        data.staticPointsDate.getTime(),
        c.startDate.getTime(),
        data.balanceDate.getTime(),
      )
      if (timestamp < startTime) return 0n

      const endTime = Math.min(timestamp, c.endDate?.getTime() ?? timestamp)
      if (startTime > endTime) return 0n

      const timespanEarned = calculateTimespanEarned(
        startTime,
        endTime,
        data.balance,
        c.multiplier,
      )
      if (c.name === 'standard') {
        referralBalanceEarned = timespanEarned
      }
      return timespanEarned
    })
    const conditionPointsEarned = sum(conditionPoints)
    const balanceMultEarned = (conditionPointsEarned * balanceMult) / 100n
    data.staticPoints += sum(conditionPoints) + balanceMultEarned
    data.staticReferralPointsBase += referralBalanceEarned
    data.staticPointsDate = new Date(timestamp)
    points += data.staticPoints
    if (
      data.referralId &&
      isValidReferralId(data.referralId) &&
      !isReferralSelfReferencing(data.referralId, recipient.id)
    ) {
      let referralMultiplier = referralConditions
        .filter(
          (rc) =>
            rc.balanceStartDate <= data.balanceDate &&
            (!rc.balanceEndDate || rc.balanceEndDate > data.balanceDate),
        )
        .reduce((sum, rc) => sum + rc.multiplier, 0n)
      const referrerData = getReferralDataForReferralCodes(data.referralId)
      if (referralMultiplier > 0n) {
        referralPointsArray.push({
          referralId: data.referralId,
          address: referrerData.address,
          referralPointsBase: data.staticReferralPointsBase,
          referralMultiplier,
          outgoingReferralMultiplier: referrerData.outgoingReferralMultiplier,
        })
      }
    }
  }
  return { points, referralPointsArray }
}

/**
 * How many points have been earned since the depositor has had `amount` at `timestamp`.
 */
const calculateTimespanEarned = (
  startTimestamp: number,
  endTimestamp: number,
  amount: bigint,
  multiplier: bigint,
): bigint => {
  const intervals =
    (BigInt(endTimestamp - startTimestamp) * 1_000000000_000000000n) /
    BigInt(pointInterval)
  const multipliedAmount = (amount * multiplier) / 100n
  return (
    (parseEther(intervals.toString()) * multipliedAmount * 10_000n) /
    1_000000000_000000000n /
    1_000000000_000000000n
  )
}

const balanceMultiplier = (balance: bigint) => {
  return balanceBonuses.find((b) => balance >= b.gte)?.multiplier ?? 0n
}
