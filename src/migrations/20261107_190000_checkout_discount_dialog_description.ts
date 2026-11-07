import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    // IF NOT EXISTS / COALESCE: local databases may already have an empty column from Payload's dev schema push.
    await db.execute(sql`
        ALTER TABLE "checkout_locales" ADD COLUMN IF NOT EXISTS "summary_pricing_discount_dialog_description" varchar;

        UPDATE "checkout_locales" SET
            "summary_pricing_discount_dialog_description" = COALESCE(
                NULLIF("summary_pricing_discount_dialog_description", ''),
                CASE
                    WHEN "_locale" = 'de' THEN 'Gib deinen Rabattcode ein. Er wird vor der Zahlung auf deine Bestellung angerechnet.'
                    ELSE 'Enter your discount code. It is applied to your order before you pay.'
                END
            );

        ALTER TABLE "checkout_locales" ALTER COLUMN "summary_pricing_discount_dialog_description" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "checkout_locales" DROP COLUMN "summary_pricing_discount_dialog_description";
    `)
}
