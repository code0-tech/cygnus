import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "checkout_locales"
            ADD COLUMN "summary_pricing_tax_inclusive_label" varchar,
            ADD COLUMN "summary_pricing_tax_exclusive_label" varchar;

        UPDATE "checkout_locales" SET
            "summary_pricing_tax_inclusive_label" = CASE WHEN "_locale" = 'de'
                THEN 'Enthaltene Steuer' ELSE 'Included tax' END,
            "summary_pricing_tax_exclusive_label" = CASE WHEN "_locale" = 'de'
                THEN 'Zusätzliche Steuer' ELSE 'Additional tax' END;

        ALTER TABLE "checkout_locales"
            ALTER COLUMN "summary_pricing_tax_inclusive_label" SET NOT NULL,
            ALTER COLUMN "summary_pricing_tax_exclusive_label" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "checkout_locales"
            DROP COLUMN "summary_pricing_tax_inclusive_label",
            DROP COLUMN "summary_pricing_tax_exclusive_label";
    `)
}
