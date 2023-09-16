import { lookupArchive } from '@subsquid/archive-registry'
import {
  BlockHeader,
  DataHandlerContext,
  EvmBatchProcessor,
  EvmBatchProcessorFields,
  Log as _Log,
  Transaction as _Transaction,
} from '@subsquid/evm-processor'
import { Store, TypeormDatabase } from '@subsquid/typeorm-store'

export const processor = new EvmBatchProcessor()
  .setDataSource({
    // Change the Archive endpoints for run the squid
    // against the other EVM networks
    // For a full list of supported networks and config options
    // see https://docs.subsquid.io/evm-indexing/
    archive: lookupArchive('eth-mainnet'),

    // Must be set for RPC ingestion (https://docs.subsquid.io/evm-indexing/evm-processor/)
    // OR to enable contract state queries (https://docs.subsquid.io/evm-indexing/query-state/)
    // chain: 'https://rpc.ankr.com/eth',
    // chain: "https://mainnet.infura.io/v3/03b96dfbb4904c5c89c04680dd480064",
    chain: {
      url: process.env.RPC_ENDPOINT || 'http://localhost:8545',
      // Alchemy is deprecating `eth_getBlockReceipts` https://docs.alchemy.com/reference/eth-getblockreceipts
      // so we need to set `maxBatchCallSize` 1 to avoid using this method
      maxBatchCallSize: 1,
    },
  })
  .setFinalityConfirmation(10)
  .setFields({
    transaction: {
      from: true,
      hash: true,
      gasUsed: true,
      gas: true,
      value: true,
      sighash: true,
      input: true,
      status: true,
    },
    log: {
      transactionHash: true,
      topics: true,
      data: true,
    },
    trace: {
      callTo: true,
      callSighash: true,
      callValue: true,
      callFrom: true,
      callInput: true,
      createResultAddress: true,
      // action: true,
    },
  })
  .setBlockRange({
    from: Math.min(
      16933090, // OETH: https://etherscan.io/tx/0x3b4ece4f5fef04bf7ceaec4f6c6edf700540d7597589f8da0e3a8c94264a3b50
      17067001, // OETH Vault: https://etherscan.io/tx/0x0b81a0e2b7d824ce493465221218b9c79b4a9478c0bb7760b386be240f5985b8
      17067223, // OETH Frax Staking: https://etherscan.io/tx/0x422903d2be38a264423a77e8472d365fa567f5bca12ea2403dfaee1b305c7da4
    ),
  })

export const run = (
  processors: {
    name?: string
    setup: (p: typeof processor) => void
    process: (ctx: Context) => Promise<void>
  }[],
) => {
  processors.forEach((p) => p.setup(processor))
  processor.run(
    new TypeormDatabase({ supportHotBlocks: true }),
    async (ctx) => {
      let start = Date.now()
      const time = (name: string) => () =>
        ctx.log.info(`${name} ${Date.now() - start}ms`)
      await Promise.all(
        processors.map((p, index) =>
          p.process(ctx).then(time(p.name ?? `p${index}`)),
        ),
      )
    },
  )
}

export type Fields = EvmBatchProcessorFields<typeof processor>
export type Context = DataHandlerContext<Store, Fields>
export type Block = BlockHeader<Fields>
export type Log = _Log<Fields>
export type Transaction = _Transaction<Fields>
export type ProcessorContext<Store> = DataHandlerContext<Store, Fields>
