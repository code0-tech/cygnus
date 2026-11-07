import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    // IF NOT EXISTS / COALESCE: local databases may already have an empty column from Payload's dev schema push.
    await db.execute(sql`
        ALTER TABLE "checkout_locales" ADD COLUMN IF NOT EXISTS "form_secure_checkout_label" varchar;

        UPDATE "checkout_locales" SET
            "form_secure_checkout_label" = COALESCE(NULLIF("form_secure_checkout_label", ''), CASE WHEN "_locale" = 'de' THEN 'Sicherer Checkout' ELSE 'Secure checkout' END);

        ALTER TABLE "checkout_locales" ALTER COLUMN "form_secure_checkout_label" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "checkout_locales" DROP COLUMN "form_secure_checkout_label";
    `)
}
