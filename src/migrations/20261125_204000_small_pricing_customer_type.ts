import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        DO $$ BEGIN
            CREATE TYPE "public"."enum_pages_blocks_small_pricing_pricing_customer_type" AS ENUM ('b2c', 'b2b');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
        ALTER TABLE "pages_blocks_small_pricing"
            ADD COLUMN IF NOT EXISTS "pricing_customer_type" "public"."enum_pages_blocks_small_pricing_pricing_customer_type" DEFAULT 'b2c' NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "pages_blocks_small_pricing" DROP COLUMN IF EXISTS "pricing_customer_type";
        DROP TYPE IF EXISTS "public"."enum_pages_blocks_small_pricing_pricing_customer_type";
    `)
}
