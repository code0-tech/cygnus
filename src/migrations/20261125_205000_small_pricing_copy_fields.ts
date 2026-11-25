import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "pages_blocks_small_pricing"
            ALTER COLUMN "section_heading" SET DEFAULT '**Simple pricing**\nfor every stage of your business.',
            ADD COLUMN IF NOT EXISTS "copy_popular_label" varchar DEFAULT 'Popular',
            ADD COLUMN IF NOT EXISTS "copy_custom_price_prefix" varchar DEFAULT 'from',
            ADD COLUMN IF NOT EXISTS "copy_custom_price_from" numeric DEFAULT 49.9,
            ADD COLUMN IF NOT EXISTS "copy_discount_prefix" varchar DEFAULT '-',
            ADD COLUMN IF NOT EXISTS "copy_workflow_unit_label" varchar DEFAULT 'executions',
            ADD COLUMN IF NOT EXISTS "copy_ai_tokens_unit_label" varchar DEFAULT 'AI tokens',
            ADD COLUMN IF NOT EXISTS "copy_usage_separator" varchar DEFAULT chr(8226),
            ADD COLUMN IF NOT EXISTS "copy_custom_usage_text" varchar DEFAULT 'Usage you configure yourself',
            ADD COLUMN IF NOT EXISTS "copy_not_sure_title" varchar DEFAULT 'Not sure yet?',
            ADD COLUMN IF NOT EXISTS "copy_not_sure_description" varchar DEFAULT 'Compare all plans and features side by side.',
            ADD COLUMN IF NOT EXISTS "copy_details_button_label" varchar DEFAULT 'See all plan details',
            ADD COLUMN IF NOT EXISTS "copy_details_url" varchar DEFAULT '/pricing',
            ADD COLUMN IF NOT EXISTS "copy_period_savings_text" varchar DEFAULT 'Save {quarterly} quarterly or {yearly} yearly.';

        UPDATE "pages_blocks_small_pricing" SET
            "section_heading" = CASE WHEN "_locale" = 'de' THEN '**Einfache Preise**\nf\u00fcr jede Phase deines Unternehmens.' ELSE '**Simple pricing**\nfor every stage of your business.' END
        WHERE "section_heading" IS NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "pages_blocks_small_pricing"
            ALTER COLUMN "section_heading" DROP DEFAULT,
            DROP COLUMN IF EXISTS "copy_popular_label",
            DROP COLUMN IF EXISTS "copy_custom_price_prefix",
            DROP COLUMN IF EXISTS "copy_custom_price_from",
            DROP COLUMN IF EXISTS "copy_discount_prefix",
            DROP COLUMN IF EXISTS "copy_workflow_unit_label",
            DROP COLUMN IF EXISTS "copy_ai_tokens_unit_label",
            DROP COLUMN IF EXISTS "copy_usage_separator",
            DROP COLUMN IF EXISTS "copy_custom_usage_text",
            DROP COLUMN IF EXISTS "copy_not_sure_title",
            DROP COLUMN IF EXISTS "copy_not_sure_description",
            DROP COLUMN IF EXISTS "copy_details_button_label",
            DROP COLUMN IF EXISTS "copy_details_url",
            DROP COLUMN IF EXISTS "copy_period_savings_text";
    `)
}
