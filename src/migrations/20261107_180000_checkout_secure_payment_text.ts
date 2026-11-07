import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    // IF NOT EXISTS / COALESCE: local databases may already have an empty column from Payload's dev schema push.
    await db.execute(sql`
        ALTER TABLE "checkout_locales" ADD COLUMN IF NOT EXISTS "form_secure_payment_text" varchar;

        UPDATE "checkout_locales" SET
            "form_secure_payment_text" = COALESCE(
                NULLIF("form_secure_payment_text", ''),
                CASE WHEN "_locale" = 'de' THEN 'Sicher verarbeitet über Stripe. Du kannst jederzeit kündigen.' ELSE 'Processed securely by Stripe. You can cancel anytime.' END
            );

        ALTER TABLE "checkout_locales" ALTER COLUMN "form_secure_payment_text" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "checkout_locales" DROP COLUMN "form_secure_payment_text";
    `)
}
