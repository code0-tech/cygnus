import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    // IF NOT EXISTS / COALESCE: local databases may already have empty columns from Payload's dev schema push.
    await db.execute(sql`
        ALTER TABLE "checkout_locales"
            ADD COLUMN IF NOT EXISTS "form_contact_heading" varchar,
            ADD COLUMN IF NOT EXISTS "form_not_charged_yet_text" varchar;

        UPDATE "checkout_locales" SET
            "form_contact_heading" = COALESCE(NULLIF("form_contact_heading", ''), CASE WHEN "_locale" = 'de' THEN 'Kontakt' ELSE 'Contact' END),
            "form_not_charged_yet_text" = COALESCE(NULLIF("form_not_charged_yet_text", ''), CASE WHEN "_locale" = 'de' THEN 'Es wird noch nichts abgebucht.' ELSE 'You won''t be charged yet.' END);

        ALTER TABLE "checkout_locales"
            ALTER COLUMN "form_contact_heading" SET NOT NULL,
            ALTER COLUMN "form_not_charged_yet_text" SET NOT NULL,
            ALTER COLUMN "form_billing_heading" DROP DEFAULT;

        -- Only replace the untouched previous default; customized headings are kept.
        UPDATE "checkout_locales" SET
            "form_billing_heading" = CASE WHEN "_locale" = 'de' THEN 'Rechnungsadresse' ELSE 'Billing address' END
        WHERE "form_billing_heading" = 'Billing Address';
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "checkout_locales"
            DROP COLUMN "form_contact_heading",
            DROP COLUMN "form_not_charged_yet_text",
            ALTER COLUMN "form_billing_heading" SET DEFAULT 'Billing Address';
    `)
}
