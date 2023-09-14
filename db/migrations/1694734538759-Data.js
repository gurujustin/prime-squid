module.exports = class Data1694734538759 {
    name = 'Data1694734538759'

    async up(db) {
        await db.query(`CREATE TABLE "history" ("id" character varying NOT NULL, "value" numeric NOT NULL, "balance" numeric NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "block_number" integer NOT NULL, "tx_hash" text NOT NULL, "type" text NOT NULL, "address_id" character varying, CONSTRAINT "PK_9384942edf4804b38ca0ee51416" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_59a55adcc59ddb69c297da693e" ON "history" ("address_id") `)
        await db.query(`CREATE INDEX "IDX_7a259431108a22e8ca2f375fc7" ON "history" ("block_number") `)
        await db.query(`CREATE INDEX "IDX_1b82c15d87635d95eaa4dd42ec" ON "history" ("tx_hash") `)
        await db.query(`CREATE TABLE "address" ("id" character varying NOT NULL, "is_contract" boolean NOT NULL, "rebasing_option" text NOT NULL, "balance" numeric NOT NULL, "earned" numeric NOT NULL, "credits" numeric NOT NULL, "last_updated" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_d92de1f82754668b5f5f5dd4fd5" PRIMARY KEY ("id"))`)
        await db.query(`CREATE TABLE "apy" ("id" character varying NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "block_number" integer NOT NULL, "tx_hash" text NOT NULL, "apr" numeric NOT NULL, "apy" numeric NOT NULL, "apy7_day_avg" numeric NOT NULL, "apy14_day_avg" numeric NOT NULL, "apy30_day_avg" numeric NOT NULL, "rebasing_credits_per_token" numeric NOT NULL, CONSTRAINT "PK_7826924ff9c029af7533753f6af" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_1f069a908b679be0b5fbc0b2e6" ON "apy" ("timestamp") `)
        await db.query(`CREATE INDEX "IDX_7fb752652a983d6629a722ae7a" ON "apy" ("block_number") `)
        await db.query(`CREATE INDEX "IDX_d1165411d71160d1230073d0fa" ON "apy" ("tx_hash") `)
        await db.query(`CREATE TABLE "rebase" ("id" character varying NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "block_number" integer NOT NULL, "tx_hash" text NOT NULL, "total_supply" numeric NOT NULL, "rebasing_credits" numeric NOT NULL, "rebasing_credits_per_token" numeric NOT NULL, "apy_id" character varying, CONSTRAINT "PK_cadd381a400a7e41b538c788d13" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_c308a9ecd3d05b0c45e7c60d10" ON "rebase" ("timestamp") `)
        await db.query(`CREATE INDEX "IDX_a5955dbd9ac031314697cbd54f" ON "rebase" ("block_number") `)
        await db.query(`CREATE INDEX "IDX_7cd793b6c4bc15b9082e0eb97a" ON "rebase" ("tx_hash") `)
        await db.query(`CREATE INDEX "IDX_02d02f9022ef86e60f1a84b9dc" ON "rebase" ("apy_id") `)
        await db.query(`CREATE TABLE "vault" ("id" character varying NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "block_number" integer NOT NULL, "tx_hash" text NOT NULL, "eth" numeric NOT NULL, "weth" numeric NOT NULL, "st_eth" numeric NOT NULL, "r_eth" numeric NOT NULL, "frx_eth" numeric NOT NULL, CONSTRAINT "PK_dd0898234c77f9d97585171ac59" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_0f1a5b7e346813a4ec3a03010b" ON "vault" ("timestamp") `)
        await db.query(`CREATE INDEX "IDX_a9b314451a9001a7b0a222f68a" ON "vault" ("block_number") `)
        await db.query(`CREATE INDEX "IDX_534a4b5cb80e57e6e7d138b869" ON "vault" ("tx_hash") `)
        await db.query(`CREATE TABLE "curve" ("id" character varying NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "block_number" integer NOT NULL, "tx_hash" text NOT NULL, "eth" numeric NOT NULL, "oeth" numeric NOT NULL, CONSTRAINT "PK_5aa8792c58dd9c0ae7e09d98611" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_46ef935a92d46f4c5e7be3d9a0" ON "curve" ("timestamp") `)
        await db.query(`CREATE INDEX "IDX_abec6d1835577bb9af8c8f3cd8" ON "curve" ("block_number") `)
        await db.query(`CREATE INDEX "IDX_5b78300fa8fa16be40dd917f07" ON "curve" ("tx_hash") `)
        await db.query(`CREATE TABLE "frax_staking" ("id" character varying NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "block_number" integer NOT NULL, "tx_hash" text NOT NULL, "frx_eth" numeric NOT NULL, CONSTRAINT "PK_8e4f242a30dc9aa67ce89dd9011" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_c40e57574ecb23502fa6755b03" ON "frax_staking" ("timestamp") `)
        await db.query(`CREATE INDEX "IDX_ac105b3fae6f14114535b8d0e2" ON "frax_staking" ("block_number") `)
        await db.query(`CREATE INDEX "IDX_a7ed335fc044ab5077cd1fa544" ON "frax_staking" ("tx_hash") `)
        await db.query(`CREATE TABLE "morpho_aave" ("id" character varying NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "block_number" integer NOT NULL, "tx_hash" text NOT NULL, "weth" numeric NOT NULL, CONSTRAINT "PK_8b9569518db5529db65205aaafe" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_3570ea91a91129f64a38665d39" ON "morpho_aave" ("timestamp") `)
        await db.query(`CREATE INDEX "IDX_1263cc804aa44983b8f146c2c4" ON "morpho_aave" ("block_number") `)
        await db.query(`CREATE INDEX "IDX_f2dcb463ee37e7ea641de047df" ON "morpho_aave" ("tx_hash") `)
        await db.query(`CREATE TABLE "dripper" ("id" character varying NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "block_number" integer NOT NULL, "tx_hash" text NOT NULL, "weth" numeric NOT NULL, CONSTRAINT "PK_74fd102c8d1c60f4b1650a61ffc" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_88c58f8948c3294c2a9e2791dc" ON "dripper" ("timestamp") `)
        await db.query(`CREATE INDEX "IDX_06822c0a260797711acc9023d5" ON "dripper" ("block_number") `)
        await db.query(`CREATE INDEX "IDX_00e3b19ec41de0785079baeca5" ON "dripper" ("tx_hash") `)
        await db.query(`CREATE TABLE "financial_statement" ("id" character varying NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "block_number" integer NOT NULL, "tx_hash" text NOT NULL, "vault_id" character varying, "curve_id" character varying, "frax_staking_id" character varying, "morpho_aave_id" character varying, "dripper_id" character varying, CONSTRAINT "PK_4e795d12a43006ece4788e13371" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_ef18e864908765e31b7232fe41" ON "financial_statement" ("timestamp") `)
        await db.query(`CREATE INDEX "IDX_0b50f0a8fca1f65659ce36feb4" ON "financial_statement" ("block_number") `)
        await db.query(`CREATE INDEX "IDX_e1979157fdc9f59d396e8f8440" ON "financial_statement" ("tx_hash") `)
        await db.query(`CREATE INDEX "IDX_9f37653694923d2b62c6c01190" ON "financial_statement" ("vault_id") `)
        await db.query(`CREATE INDEX "IDX_f809f02abcc22d9ef50c97b42c" ON "financial_statement" ("curve_id") `)
        await db.query(`CREATE INDEX "IDX_b5c2c4b2d43680e3c6470d7f9d" ON "financial_statement" ("frax_staking_id") `)
        await db.query(`CREATE INDEX "IDX_a610e78431c0dd56724129f223" ON "financial_statement" ("morpho_aave_id") `)
        await db.query(`CREATE INDEX "IDX_7a506ebb6c720f35607810b734" ON "financial_statement" ("dripper_id") `)
        await db.query(`ALTER TABLE "history" ADD CONSTRAINT "FK_59a55adcc59ddb69c297da693e5" FOREIGN KEY ("address_id") REFERENCES "address"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "rebase" ADD CONSTRAINT "FK_02d02f9022ef86e60f1a84b9dc2" FOREIGN KEY ("apy_id") REFERENCES "apy"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "financial_statement" ADD CONSTRAINT "FK_9f37653694923d2b62c6c01190b" FOREIGN KEY ("vault_id") REFERENCES "vault"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "financial_statement" ADD CONSTRAINT "FK_f809f02abcc22d9ef50c97b42c8" FOREIGN KEY ("curve_id") REFERENCES "curve"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "financial_statement" ADD CONSTRAINT "FK_b5c2c4b2d43680e3c6470d7f9df" FOREIGN KEY ("frax_staking_id") REFERENCES "frax_staking"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "financial_statement" ADD CONSTRAINT "FK_a610e78431c0dd56724129f2236" FOREIGN KEY ("morpho_aave_id") REFERENCES "morpho_aave"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "financial_statement" ADD CONSTRAINT "FK_7a506ebb6c720f35607810b7347" FOREIGN KEY ("dripper_id") REFERENCES "dripper"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    }

    async down(db) {
        await db.query(`DROP TABLE "history"`)
        await db.query(`DROP INDEX "public"."IDX_59a55adcc59ddb69c297da693e"`)
        await db.query(`DROP INDEX "public"."IDX_7a259431108a22e8ca2f375fc7"`)
        await db.query(`DROP INDEX "public"."IDX_1b82c15d87635d95eaa4dd42ec"`)
        await db.query(`DROP TABLE "address"`)
        await db.query(`DROP TABLE "apy"`)
        await db.query(`DROP INDEX "public"."IDX_1f069a908b679be0b5fbc0b2e6"`)
        await db.query(`DROP INDEX "public"."IDX_7fb752652a983d6629a722ae7a"`)
        await db.query(`DROP INDEX "public"."IDX_d1165411d71160d1230073d0fa"`)
        await db.query(`DROP TABLE "rebase"`)
        await db.query(`DROP INDEX "public"."IDX_c308a9ecd3d05b0c45e7c60d10"`)
        await db.query(`DROP INDEX "public"."IDX_a5955dbd9ac031314697cbd54f"`)
        await db.query(`DROP INDEX "public"."IDX_7cd793b6c4bc15b9082e0eb97a"`)
        await db.query(`DROP INDEX "public"."IDX_02d02f9022ef86e60f1a84b9dc"`)
        await db.query(`DROP TABLE "vault"`)
        await db.query(`DROP INDEX "public"."IDX_0f1a5b7e346813a4ec3a03010b"`)
        await db.query(`DROP INDEX "public"."IDX_a9b314451a9001a7b0a222f68a"`)
        await db.query(`DROP INDEX "public"."IDX_534a4b5cb80e57e6e7d138b869"`)
        await db.query(`DROP TABLE "curve"`)
        await db.query(`DROP INDEX "public"."IDX_46ef935a92d46f4c5e7be3d9a0"`)
        await db.query(`DROP INDEX "public"."IDX_abec6d1835577bb9af8c8f3cd8"`)
        await db.query(`DROP INDEX "public"."IDX_5b78300fa8fa16be40dd917f07"`)
        await db.query(`DROP TABLE "frax_staking"`)
        await db.query(`DROP INDEX "public"."IDX_c40e57574ecb23502fa6755b03"`)
        await db.query(`DROP INDEX "public"."IDX_ac105b3fae6f14114535b8d0e2"`)
        await db.query(`DROP INDEX "public"."IDX_a7ed335fc044ab5077cd1fa544"`)
        await db.query(`DROP TABLE "morpho_aave"`)
        await db.query(`DROP INDEX "public"."IDX_3570ea91a91129f64a38665d39"`)
        await db.query(`DROP INDEX "public"."IDX_1263cc804aa44983b8f146c2c4"`)
        await db.query(`DROP INDEX "public"."IDX_f2dcb463ee37e7ea641de047df"`)
        await db.query(`DROP TABLE "dripper"`)
        await db.query(`DROP INDEX "public"."IDX_88c58f8948c3294c2a9e2791dc"`)
        await db.query(`DROP INDEX "public"."IDX_06822c0a260797711acc9023d5"`)
        await db.query(`DROP INDEX "public"."IDX_00e3b19ec41de0785079baeca5"`)
        await db.query(`DROP TABLE "financial_statement"`)
        await db.query(`DROP INDEX "public"."IDX_ef18e864908765e31b7232fe41"`)
        await db.query(`DROP INDEX "public"."IDX_0b50f0a8fca1f65659ce36feb4"`)
        await db.query(`DROP INDEX "public"."IDX_e1979157fdc9f59d396e8f8440"`)
        await db.query(`DROP INDEX "public"."IDX_9f37653694923d2b62c6c01190"`)
        await db.query(`DROP INDEX "public"."IDX_f809f02abcc22d9ef50c97b42c"`)
        await db.query(`DROP INDEX "public"."IDX_b5c2c4b2d43680e3c6470d7f9d"`)
        await db.query(`DROP INDEX "public"."IDX_a610e78431c0dd56724129f223"`)
        await db.query(`DROP INDEX "public"."IDX_7a506ebb6c720f35607810b734"`)
        await db.query(`ALTER TABLE "history" DROP CONSTRAINT "FK_59a55adcc59ddb69c297da693e5"`)
        await db.query(`ALTER TABLE "rebase" DROP CONSTRAINT "FK_02d02f9022ef86e60f1a84b9dc2"`)
        await db.query(`ALTER TABLE "financial_statement" DROP CONSTRAINT "FK_9f37653694923d2b62c6c01190b"`)
        await db.query(`ALTER TABLE "financial_statement" DROP CONSTRAINT "FK_f809f02abcc22d9ef50c97b42c8"`)
        await db.query(`ALTER TABLE "financial_statement" DROP CONSTRAINT "FK_b5c2c4b2d43680e3c6470d7f9df"`)
        await db.query(`ALTER TABLE "financial_statement" DROP CONSTRAINT "FK_a610e78431c0dd56724129f2236"`)
        await db.query(`ALTER TABLE "financial_statement" DROP CONSTRAINT "FK_7a506ebb6c720f35607810b7347"`)
    }
}
