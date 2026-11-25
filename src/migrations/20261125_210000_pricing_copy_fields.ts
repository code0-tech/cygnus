import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "pages_blocks_pricing"
            ALTER COLUMN "section_heading" SET DEFAULT '**Your pricing for Enterprise,**\\nlicensed per workspace.',
            ADD COLUMN IF NOT EXISTS "comparison_heading" varchar DEFAULT 'Compare plans',
            ADD COLUMN IF NOT EXISTS "popular_label" varchar DEFAULT 'Popular',
            ADD COLUMN IF NOT EXISTS "custom_price_prefix" varchar DEFAULT 'from',
            ADD COLUMN IF NOT EXISTS "custom_price_from" numeric DEFAULT 49.9,
            ADD COLUMN IF NOT EXISTS "discount_prefix" varchar DEFAULT '-',
            ADD COLUMN IF NOT EXISTS "included_aria_label" varchar DEFAULT 'Included',
            ADD COLUMN IF NOT EXISTS "empty_value" varchar DEFAULT chr(8212);

        UPDATE "pages_blocks_pricing" SET
            "section_heading" = '**Your pricing for Enterprise,**\\nlicensed per workspace.'
        WHERE "section_heading" IS NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "pages_blocks_pricing"
            ALTER COLUMN "section_heading" DROP DEFAULT,
            DROP COLUMN IF EXISTS "comparison_heading",
            DROP COLUMN IF EXISTS "popular_label",
            DROP COLUMN IF EXISTS "custom_price_prefix",
            DROP COLUMN IF EXISTS "custom_price_from",
            DROP COLUMN IF EXISTS "discount_prefix",
            DROP COLUMN IF EXISTS "included_aria_label",
            DROP COLUMN IF EXISTS "empty_value";
    `)
}
