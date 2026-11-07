import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    // IF NOT EXISTS / COALESCE: local databases may already have empty columns from Payload's dev schema push.
    await db.execute(sql`
        ALTER TABLE "checkout_locales"
            ADD COLUMN IF NOT EXISTS "summary_pricing_subtotal_label" varchar,
            ADD COLUMN IF NOT EXISTS "summary_pricing_total_excluding_tax_label" varchar,
            ADD COLUMN IF NOT EXISTS "summary_pricing_tax_rate_label" varchar,
            ADD COLUMN IF NOT EXISTS "summary_pricing_total_due_today_label" varchar,
            ADD COLUMN IF NOT EXISTS "summary_pricing_total_including_tax_suffix" varchar;

        UPDATE "checkout_locales" SET
            "summary_pricing_subtotal_label" = COALESCE(NULLIF("summary_pricing_subtotal_label", ''), CASE WHEN "_locale" = 'de' THEN 'Zwischensumme' ELSE 'Subtotal' END),
            "summary_pricing_total_excluding_tax_label" = COALESCE(NULLIF("summary_pricing_total_excluding_tax_label", ''), CASE WHEN "_locale" = 'de' THEN 'Gesamt ohne Steuern' ELSE 'Total excluding tax' END),
            "summary_pricing_tax_rate_label" = COALESCE(NULLIF("summary_pricing_tax_rate_label", ''), CASE WHEN "_locale" = 'de' THEN '{rate} auf {amount}' ELSE '{rate} on {amount}' END),
            "summary_pricing_total_due_today_label" = COALESCE(NULLIF("summary_pricing_total_due_today_label", ''), CASE WHEN "_locale" = 'de' THEN 'Heute fällig' ELSE 'Total due today' END),
            "summary_pricing_total_including_tax_suffix" = COALESCE(NULLIF("summary_pricing_total_including_tax_suffix", ''), CASE WHEN "_locale" = 'de' THEN 'inkl. MwSt.' ELSE 'incl. VAT' END);

        ALTER TABLE "checkout_locales"
            ALTER COLUMN "summary_pricing_subtotal_label" SET NOT NULL,
            ALTER COLUMN "summary_pricing_total_excluding_tax_label" SET NOT NULL,
            ALTER COLUMN "summary_pricing_tax_rate_label" SET NOT NULL,
            ALTER COLUMN "summary_pricing_total_due_today_label" SET NOT NULL,
            ALTER COLUMN "summary_pricing_total_including_tax_suffix" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "checkout_locales"
            DROP COLUMN "summary_pricing_subtotal_label",
            DROP COLUMN "summary_pricing_total_excluding_tax_label",
            DROP COLUMN "summary_pricing_tax_rate_label",
            DROP COLUMN "summary_pricing_total_due_today_label",
            DROP COLUMN "summary_pricing_total_including_tax_suffix";
    `)
}
