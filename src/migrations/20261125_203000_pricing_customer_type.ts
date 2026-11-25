import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "pages_blocks_pricing"
            ADD COLUMN IF NOT EXISTS "pricing_customer_type" varchar DEFAULT 'b2c' NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "pages_blocks_pricing"
            DROP COLUMN IF EXISTS "pricing_customer_type";
    `)
}
