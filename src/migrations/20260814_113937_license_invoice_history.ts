import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales" ADD COLUMN "values_invoice_statuses_draft" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "values_invoice_statuses_open" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "values_invoice_statuses_paid" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "values_invoice_statuses_uncollectible" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "values_invoice_statuses_void" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "invoices_title" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "invoices_empty" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "invoices_number_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "invoices_period_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "invoices_amount_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "invoices_status_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "invoices_download_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "invoices_unavailable_label" varchar;

        UPDATE "licenses_locales" SET
            "values_invoice_statuses_draft" = CASE WHEN "_locale" = 'de' THEN 'Entwurf' ELSE 'Draft' END,
            "values_invoice_statuses_open" = CASE WHEN "_locale" = 'de' THEN 'Offen' ELSE 'Open' END,
            "values_invoice_statuses_paid" = CASE WHEN "_locale" = 'de' THEN 'Bezahlt' ELSE 'Paid' END,
            "values_invoice_statuses_uncollectible" = CASE WHEN "_locale" = 'de' THEN 'Uneinbringlich' ELSE 'Uncollectible' END,
            "values_invoice_statuses_void" = CASE WHEN "_locale" = 'de' THEN 'Storniert' ELSE 'Void' END,
            "invoices_title" = CASE WHEN "_locale" = 'de' THEN 'Rechnungen' ELSE 'Invoices' END,
            "invoices_empty" = CASE WHEN "_locale" = 'de' THEN 'Noch keine Rechnungen' ELSE 'No invoices yet' END,
            "invoices_number_label" = CASE WHEN "_locale" = 'de' THEN 'Rechnung' ELSE 'Invoice' END,
            "invoices_period_label" = CASE WHEN "_locale" = 'de' THEN 'Abrechnungszeitraum' ELSE 'Billing period' END,
            "invoices_amount_label" = CASE WHEN "_locale" = 'de' THEN 'Gesamt' ELSE 'Total' END,
            "invoices_status_label" = CASE WHEN "_locale" = 'de' THEN 'Zahlungsstatus' ELSE 'Payment status' END,
            "invoices_download_label" = CASE WHEN "_locale" = 'de' THEN 'Herunterladen' ELSE 'Download' END,
            "invoices_unavailable_label" = CASE WHEN "_locale" = 'de' THEN 'Nicht verfügbar' ELSE 'Not available' END;

        ALTER TABLE "licenses_locales" ALTER COLUMN "values_invoice_statuses_draft" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "values_invoice_statuses_open" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "values_invoice_statuses_paid" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "values_invoice_statuses_uncollectible" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "values_invoice_statuses_void" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "invoices_title" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "invoices_empty" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "invoices_number_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "invoices_period_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "invoices_amount_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "invoices_status_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "invoices_download_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "invoices_unavailable_label" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales" DROP COLUMN "values_invoice_statuses_draft";
        ALTER TABLE "licenses_locales" DROP COLUMN "values_invoice_statuses_open";
        ALTER TABLE "licenses_locales" DROP COLUMN "values_invoice_statuses_paid";
        ALTER TABLE "licenses_locales" DROP COLUMN "values_invoice_statuses_uncollectible";
        ALTER TABLE "licenses_locales" DROP COLUMN "values_invoice_statuses_void";
        ALTER TABLE "licenses_locales" DROP COLUMN "invoices_title";
        ALTER TABLE "licenses_locales" DROP COLUMN "invoices_empty";
        ALTER TABLE "licenses_locales" DROP COLUMN "invoices_number_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "invoices_period_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "invoices_amount_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "invoices_status_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "invoices_download_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "invoices_unavailable_label";
    `)
}
