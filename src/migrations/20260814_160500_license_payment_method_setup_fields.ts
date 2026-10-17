import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_payment_method_heading" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_payment_method_description" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_change_payment_method_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_loading_payment_method_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_save_payment_method_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_saving_payment_method_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_payment_method_success" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_payment_method_setup_error" varchar;

        UPDATE "licenses_locales" SET
            "editor_payment_method_heading" = CASE WHEN "_locale" = 'de' THEN 'Standard-Zahlungsmethode' ELSE 'Default payment method' END,
            "editor_payment_method_description" = CASE WHEN "_locale" = 'de' THEN 'Verwalte die Zahlungsmethode für zukünftige Rechnungen sicher über Stripe.' ELSE 'Manage the payment method used for future invoices securely through Stripe.' END,
            "editor_change_payment_method_label" = CASE WHEN "_locale" = 'de' THEN 'Zahlungsmethode ändern' ELSE 'Change payment method' END,
            "editor_loading_payment_method_label" = CASE WHEN "_locale" = 'de' THEN 'Zahlungsformular wird geladen …' ELSE 'Loading payment form…' END,
            "editor_save_payment_method_label" = CASE WHEN "_locale" = 'de' THEN 'Zahlungsmethode speichern' ELSE 'Save payment method' END,
            "editor_saving_payment_method_label" = CASE WHEN "_locale" = 'de' THEN 'Zahlungsmethode wird gespeichert …' ELSE 'Saving payment method…' END,
            "editor_payment_method_success" = CASE WHEN "_locale" = 'de' THEN 'Die Zahlungsmethode wurde akzeptiert und wird in Kürze als Standard verwendet.' ELSE 'The payment method was accepted and will become the default shortly.' END,
            "editor_payment_method_setup_error" = CASE WHEN "_locale" = 'de' THEN 'Die Zahlungsmethode konnte nicht aktualisiert werden.' ELSE 'The payment method could not be updated.' END;

        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_payment_method_heading" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_payment_method_description" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_change_payment_method_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_loading_payment_method_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_save_payment_method_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_saving_payment_method_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_payment_method_success" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_payment_method_setup_error" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales" DROP COLUMN "editor_payment_method_heading";
        ALTER TABLE "licenses_locales" DROP COLUMN "editor_payment_method_description";
        ALTER TABLE "licenses_locales" DROP COLUMN "editor_change_payment_method_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "editor_loading_payment_method_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "editor_save_payment_method_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "editor_saving_payment_method_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "editor_payment_method_success";
        ALTER TABLE "licenses_locales" DROP COLUMN "editor_payment_method_setup_error";
    `)
}
