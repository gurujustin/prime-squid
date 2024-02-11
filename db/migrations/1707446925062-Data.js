module.exports = class Data1707446925062 {
    name = 'Data1707446925062'

    async up(db) {
        await db.query(`CREATE TABLE "lrt_deposit" ("id" character varying NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "block_number" integer NOT NULL, "referral_id" text NOT NULL, "depositor" text NOT NULL, "asset" text NOT NULL, "deposit_amount" numeric NOT NULL, "amount_received" numeric NOT NULL, CONSTRAINT "PK_ad21ac1aaeea740bd658dd5b7f5" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_1710650fa59a4c8ff61af698b3" ON "lrt_deposit" ("timestamp") `)
        await db.query(`CREATE INDEX "IDX_14fae3388d6cb222f07f3d2584" ON "lrt_deposit" ("block_number") `)
        await db.query(`CREATE INDEX "IDX_229ca7f410f04404b865d2830f" ON "lrt_deposit" ("referral_id") `)
        await db.query(`CREATE INDEX "IDX_0a317fd9c746c1695a7515e8fb" ON "lrt_deposit" ("depositor") `)
        await db.query(`CREATE TABLE "lrt_point_recipient" ("id" character varying NOT NULL, "balance" numeric NOT NULL, "points" numeric NOT NULL, "points_date" TIMESTAMP WITH TIME ZONE NOT NULL, "referral_points" numeric NOT NULL, "el_points" numeric NOT NULL, "referral_count" integer NOT NULL, "referrer_count" integer NOT NULL, CONSTRAINT "PK_d92d1946162990fb7f6e9418211" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_806e89bce71b9c55c6160e32fd" ON "lrt_point_recipient" ("points_date") `)
        await db.query(`CREATE TABLE "lrt_balance_data" ("id" character varying NOT NULL, "referral_id" text, "static_points_date" TIMESTAMP WITH TIME ZONE NOT NULL, "static_points" numeric NOT NULL, "static_referral_points_base" numeric NOT NULL, "asset" text, "balance" numeric NOT NULL, "balance_date" TIMESTAMP WITH TIME ZONE NOT NULL, "recipient_id" character varying, CONSTRAINT "PK_0ea0b2d704eb121ed0f6061531b" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_61e40cacf71c10157332c95dc2" ON "lrt_balance_data" ("recipient_id") `)
        await db.query(`CREATE INDEX "IDX_0b03feb3bcdd16517c08bae903" ON "lrt_balance_data" ("referral_id") `)
        await db.query(`CREATE TABLE "lrt_point_recipient_history" ("id" character varying NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "block_number" integer NOT NULL, "balance" numeric NOT NULL, "points" numeric NOT NULL, "points_date" TIMESTAMP WITH TIME ZONE NOT NULL, "referral_points" numeric NOT NULL, "el_points" numeric NOT NULL, "referral_count" integer NOT NULL, "referrer_count" integer NOT NULL, CONSTRAINT "PK_831d0d299f8efd82c12b9494eb7" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_2acff968089f8162d351cb5ca2" ON "lrt_point_recipient_history" ("timestamp") `)
        await db.query(`CREATE INDEX "IDX_1f6e4a56e1106f11a50d5b30d8" ON "lrt_point_recipient_history" ("block_number") `)
        await db.query(`CREATE INDEX "IDX_25c0e476ca31abd7a74a8b4a9c" ON "lrt_point_recipient_history" ("points_date") `)
        await db.query(`CREATE TABLE "lrt_summary" ("id" character varying NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "block_number" integer NOT NULL, "balance" numeric NOT NULL, "points" numeric NOT NULL, "el_points" numeric NOT NULL, CONSTRAINT "PK_20cc1ddd92e29b97d990c95c130" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_68e45ce3e1da597d030f27acf6" ON "lrt_summary" ("timestamp") `)
        await db.query(`CREATE INDEX "IDX_82cd3e23b0a7a65b75773ae865" ON "lrt_summary" ("block_number") `)
        await db.query(`CREATE TABLE "lrt_node_delegator_holdings" ("id" character varying NOT NULL, "asset" text NOT NULL, "amount" numeric NOT NULL, "delegator_id" character varying, CONSTRAINT "PK_b16c26b07feb23b5ae8778f09b3" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_f4f758f6162648ea2de3faefbd" ON "lrt_node_delegator_holdings" ("delegator_id") `)
        await db.query(`CREATE INDEX "IDX_4e8663d1dc6a5623dbfb4de947" ON "lrt_node_delegator_holdings" ("asset") `)
        await db.query(`CREATE TABLE "lrt_node_delegator" ("id" character varying NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "block_number" integer NOT NULL, "node" text NOT NULL, "amount" numeric NOT NULL, "points" numeric NOT NULL, CONSTRAINT "PK_00c9b979aed504224511fe1719a" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_74a1123cf49f717c876f5384e5" ON "lrt_node_delegator" ("timestamp") `)
        await db.query(`CREATE INDEX "IDX_c3f45d1d8bdc99417e40baca58" ON "lrt_node_delegator" ("block_number") `)
        await db.query(`CREATE INDEX "IDX_d5f6eb2d98dca0ff8eef1d9c7b" ON "lrt_node_delegator" ("node") `)
        await db.query(`ALTER TABLE "lrt_balance_data" ADD CONSTRAINT "FK_61e40cacf71c10157332c95dc20" FOREIGN KEY ("recipient_id") REFERENCES "lrt_point_recipient"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "lrt_node_delegator_holdings" ADD CONSTRAINT "FK_f4f758f6162648ea2de3faefbd5" FOREIGN KEY ("delegator_id") REFERENCES "lrt_node_delegator"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    }

    async down(db) {
        await db.query(`DROP TABLE "lrt_deposit"`)
        await db.query(`DROP INDEX "public"."IDX_1710650fa59a4c8ff61af698b3"`)
        await db.query(`DROP INDEX "public"."IDX_14fae3388d6cb222f07f3d2584"`)
        await db.query(`DROP INDEX "public"."IDX_229ca7f410f04404b865d2830f"`)
        await db.query(`DROP INDEX "public"."IDX_0a317fd9c746c1695a7515e8fb"`)
        await db.query(`DROP TABLE "lrt_point_recipient"`)
        await db.query(`DROP INDEX "public"."IDX_806e89bce71b9c55c6160e32fd"`)
        await db.query(`DROP TABLE "lrt_balance_data"`)
        await db.query(`DROP INDEX "public"."IDX_61e40cacf71c10157332c95dc2"`)
        await db.query(`DROP INDEX "public"."IDX_0b03feb3bcdd16517c08bae903"`)
        await db.query(`DROP TABLE "lrt_point_recipient_history"`)
        await db.query(`DROP INDEX "public"."IDX_2acff968089f8162d351cb5ca2"`)
        await db.query(`DROP INDEX "public"."IDX_1f6e4a56e1106f11a50d5b30d8"`)
        await db.query(`DROP INDEX "public"."IDX_25c0e476ca31abd7a74a8b4a9c"`)
        await db.query(`DROP TABLE "lrt_summary"`)
        await db.query(`DROP INDEX "public"."IDX_68e45ce3e1da597d030f27acf6"`)
        await db.query(`DROP INDEX "public"."IDX_82cd3e23b0a7a65b75773ae865"`)
        await db.query(`DROP TABLE "lrt_node_delegator_holdings"`)
        await db.query(`DROP INDEX "public"."IDX_f4f758f6162648ea2de3faefbd"`)
        await db.query(`DROP INDEX "public"."IDX_4e8663d1dc6a5623dbfb4de947"`)
        await db.query(`DROP TABLE "lrt_node_delegator"`)
        await db.query(`DROP INDEX "public"."IDX_74a1123cf49f717c876f5384e5"`)
        await db.query(`DROP INDEX "public"."IDX_c3f45d1d8bdc99417e40baca58"`)
        await db.query(`DROP INDEX "public"."IDX_d5f6eb2d98dca0ff8eef1d9c7b"`)
        await db.query(`ALTER TABLE "lrt_balance_data" DROP CONSTRAINT "FK_61e40cacf71c10157332c95dc20"`)
        await db.query(`ALTER TABLE "lrt_node_delegator_holdings" DROP CONSTRAINT "FK_f4f758f6162648ea2de3faefbd5"`)
    }
}
