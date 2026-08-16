import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "checkout_locales" ADD COLUMN "success_receipt_hint" varchar;
        ALTER TABLE "checkout_locales" ADD COLUMN "success_failed_heading" varchar;
        ALTER TABLE "checkout_locales" ADD COLUMN "success_failed_description" varchar;
        ALTER TABLE "checkout_locales" ADD COLUMN "success_invalid_heading" varchar;
        ALTER TABLE "checkout_locales" ADD COLUMN "success_invalid_description" varchar;
        ALTER TABLE "checkout_locales" ADD COLUMN "success_checkout_retry_label" varchar;

        UPDATE "checkout_locales" SET
            "success_receipt_hint" = CASE
                WHEN "_locale" = 'de' THEN 'Stripe schickt die Rechnung an deine E-Mail-Adresse.'
                ELSE 'Stripe sends the receipt to your email address.'
            END,
            "success_failed_heading" = CASE WHEN "_locale" = 'de' THEN 'Zahlung fehlgeschlagen' ELSE 'Payment failed' END,
            "success_failed_description" = CASE
                WHEN "_locale" = 'de' THEN 'Stripe konnte deine Zahlung nicht verarbeiten. Es wurde nichts abgebucht und kein Abonnement angelegt.'
                ELSE 'Stripe could not process your payment. You have not been charged and no subscription was created.'
            END,
            "success_invalid_heading" = CASE
                WHEN "_locale" = 'de' THEN 'Dieser Checkout-Link ist nicht mehr gültig'
                ELSE 'This checkout link is no longer valid'
            END,
            "success_invalid_description" = CASE
                WHEN "_locale" = 'de' THEN 'Der Link ist abgelaufen oder gehört zu einem anderen Konto. Falls deine Zahlung durchgelaufen ist, findest du die Lizenz in deiner Lizenzübersicht.'
                ELSE 'The link has expired or belongs to another account. If your payment went through, you will find the license in your license dashboard.'
            END,
            "success_checkout_retry_label" = CASE WHEN "_locale" = 'de' THEN 'Zurück zum Checkout' ELSE 'Back to checkout' END;

        ALTER TABLE "checkout_locales" ALTER COLUMN "success_receipt_hint" SET NOT NULL;
        ALTER TABLE "checkout_locales" ALTER COLUMN "success_failed_heading" SET NOT NULL;
        ALTER TABLE "checkout_locales" ALTER COLUMN "success_failed_description" SET NOT NULL;
        ALTER TABLE "checkout_locales" ALTER COLUMN "success_invalid_heading" SET NOT NULL;
        ALTER TABLE "checkout_locales" ALTER COLUMN "success_invalid_description" SET NOT NULL;
        ALTER TABLE "checkout_locales" ALTER COLUMN "success_checkout_retry_label" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "checkout_locales" DROP COLUMN "success_receipt_hint";
        ALTER TABLE "checkout_locales" DROP COLUMN "success_failed_heading";
        ALTER TABLE "checkout_locales" DROP COLUMN "success_failed_description";
        ALTER TABLE "checkout_locales" DROP COLUMN "success_invalid_heading";
        ALTER TABLE "checkout_locales" DROP COLUMN "success_invalid_description";
        ALTER TABLE "checkout_locales" DROP COLUMN "success_checkout_retry_label";
    `)
}
