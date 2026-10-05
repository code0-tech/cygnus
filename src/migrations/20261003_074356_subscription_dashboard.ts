import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres"

// Rename existing labels to preserve translations; seed new localized fields before enforcing NOT NULL.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "licenses_locales" RENAME COLUMN "values_statuses_payment_failed" TO "values_statuses_past_due";
  ALTER TABLE "licenses_locales" RENAME COLUMN "values_statuses_expired" TO "values_statuses_incomplete_expired";
  ALTER TABLE "licenses_locales" RENAME COLUMN "values_statuses_paid" TO "values_invoice_statuses_paid";
  ALTER TABLE "licenses_locales" ADD COLUMN "values_statuses_incomplete" varchar;
  UPDATE "licenses_locales" SET "values_statuses_incomplete" = CASE WHEN "_locale" = 'de' THEN 'Unvollständig' ELSE 'Incomplete' END;
  ALTER TABLE "licenses_locales" ALTER COLUMN "values_statuses_incomplete" SET NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "values_statuses_paused" varchar;
  UPDATE "licenses_locales" SET "values_statuses_paused" = CASE WHEN "_locale" = 'de' THEN 'Pausiert' ELSE 'Paused' END;
  ALTER TABLE "licenses_locales" ALTER COLUMN "values_statuses_paused" SET NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "values_statuses_trialing" varchar;
  UPDATE "licenses_locales" SET "values_statuses_trialing" = CASE WHEN "_locale" = 'de' THEN 'Testphase' ELSE 'Trial' END;
  ALTER TABLE "licenses_locales" ALTER COLUMN "values_statuses_trialing" SET NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "values_statuses_unpaid" varchar;
  UPDATE "licenses_locales" SET "values_statuses_unpaid" = CASE WHEN "_locale" = 'de' THEN 'Unbezahlt' ELSE 'Unpaid' END;
  ALTER TABLE "licenses_locales" ALTER COLUMN "values_statuses_unpaid" SET NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "invoices_line_items_label" varchar;
  UPDATE "licenses_locales" SET "invoices_line_items_label" = CASE WHEN "_locale" = 'de' THEN 'Rechnungspositionen' ELSE 'Line items' END;
  ALTER TABLE "licenses_locales" ALTER COLUMN "invoices_line_items_label" SET NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "invoices_quantity_label" varchar;
  UPDATE "licenses_locales" SET "invoices_quantity_label" = CASE WHEN "_locale" = 'de' THEN 'Menge' ELSE 'Quantity' END;
  ALTER TABLE "licenses_locales" ALTER COLUMN "invoices_quantity_label" SET NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "invoices_net_label" varchar;
  UPDATE "licenses_locales" SET "invoices_net_label" = CASE WHEN "_locale" = 'de' THEN 'Netto' ELSE 'Net' END;
  ALTER TABLE "licenses_locales" ALTER COLUMN "invoices_net_label" SET NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "invoices_tax_label" varchar;
  UPDATE "licenses_locales" SET "invoices_tax_label" = CASE WHEN "_locale" = 'de' THEN 'Steuer' ELSE 'Tax' END;
  ALTER TABLE "licenses_locales" ALTER COLUMN "invoices_tax_label" SET NOT NULL;
  ALTER TABLE "license_dialogs_locales" ADD COLUMN "subscription_preview_pending_change_text" varchar;
  UPDATE "license_dialogs_locales" SET "subscription_preview_pending_change_text" = CASE WHEN "_locale" = 'de' THEN 'Wechsel auf {selection} am {date}.' ELSE 'Switch to {selection} on {date}.' END;
  ALTER TABLE "license_dialogs_locales" ALTER COLUMN "subscription_preview_pending_change_text" SET NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "licenses_locales" RENAME COLUMN "values_invoice_statuses_paid" TO "values_statuses_paid";
  ALTER TABLE "licenses_locales" RENAME COLUMN "values_statuses_past_due" TO "values_statuses_payment_failed";
  ALTER TABLE "licenses_locales" RENAME COLUMN "values_statuses_incomplete_expired" TO "values_statuses_expired";
  ALTER TABLE "licenses_locales" DROP COLUMN "values_statuses_incomplete";
  ALTER TABLE "licenses_locales" DROP COLUMN "values_statuses_paused";
  ALTER TABLE "licenses_locales" DROP COLUMN "values_statuses_trialing";
  ALTER TABLE "licenses_locales" DROP COLUMN "values_statuses_unpaid";
  ALTER TABLE "licenses_locales" DROP COLUMN "invoices_line_items_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "invoices_quantity_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "invoices_net_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "invoices_tax_label";
  ALTER TABLE "license_dialogs_locales" DROP COLUMN "subscription_preview_pending_change_text";`)
}
