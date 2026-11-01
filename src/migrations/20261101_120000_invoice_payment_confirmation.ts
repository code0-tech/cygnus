import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales"
            ADD COLUMN "invoices_pay_label" varchar;

        UPDATE "licenses_locales" SET
            "invoices_pay_label" = CASE WHEN "_locale" = 'de' THEN 'Jetzt bezahlen' ELSE 'Pay now' END;

        ALTER TABLE "licenses_locales"
            ALTER COLUMN "invoices_pay_label" SET NOT NULL;

        ALTER TABLE "license_toasts_locales"
            ADD COLUMN "invoice_paid_title" varchar,
            ADD COLUMN "invoice_paid_description" varchar,
            ADD COLUMN "payment_processing_title" varchar,
            ADD COLUMN "payment_processing_description" varchar;

        UPDATE "license_toasts_locales" SET
            "invoice_paid_title" = CASE WHEN "_locale" = 'de' THEN 'Zahlung bestätigt' ELSE 'Payment confirmed' END,
            "invoice_paid_description" = CASE WHEN "_locale" = 'de'
                THEN 'Stripe hat die Zahlung bestätigt. Die Rechnung wird in Kürze als bezahlt angezeigt.'
                ELSE 'Stripe confirmed the payment. The invoice shows as paid in a moment.' END,
            "payment_processing_title" = CASE WHEN "_locale" = 'de' THEN 'Zahlung wird verarbeitet' ELSE 'Payment is being processed' END,
            "payment_processing_description" = CASE WHEN "_locale" = 'de'
                THEN 'Deine Bank verarbeitet die Zahlung noch. Davon abhängige Änderungen gelten, sobald Stripe sie bestätigt.'
                ELSE 'Your bank is still processing the payment. Changes that depend on it apply once Stripe confirms it.' END;

        ALTER TABLE "license_toasts_locales"
            ALTER COLUMN "invoice_paid_title" SET NOT NULL,
            ALTER COLUMN "invoice_paid_description" SET NOT NULL,
            ALTER COLUMN "payment_processing_title" SET NOT NULL,
            ALTER COLUMN "payment_processing_description" SET NOT NULL;

        ALTER TABLE "errors_locales"
            ADD COLUMN "upgrade_payment_pending" varchar;

        UPDATE "errors_locales" SET
            "upgrade_payment_pending" = CASE WHEN "_locale" = 'de'
                THEN 'Das Upgrade wartet auf die Zahlung. Bezahle die offene Rechnung dieser Lizenz, damit es wirksam wird.'
                ELSE 'The upgrade is waiting for its payment. Pay the open invoice of this license to apply it.' END;

        ALTER TABLE "errors_locales"
            ALTER COLUMN "upgrade_payment_pending" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "errors_locales"
            DROP COLUMN "upgrade_payment_pending";

        ALTER TABLE "license_toasts_locales"
            DROP COLUMN "invoice_paid_title",
            DROP COLUMN "invoice_paid_description",
            DROP COLUMN "payment_processing_title",
            DROP COLUMN "payment_processing_description";

        ALTER TABLE "licenses_locales"
            DROP COLUMN "invoices_pay_label";
    `)
}
