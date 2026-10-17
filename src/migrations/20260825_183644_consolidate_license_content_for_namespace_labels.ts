import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "licenses_locales" ADD COLUMN IF NOT EXISTS "editor_change_namespace_label" varchar;
  ALTER TABLE "licenses_locales" ADD COLUMN IF NOT EXISTS "editor_namespace_connected_label" varchar;
  ALTER TABLE "licenses_locales" ADD COLUMN IF NOT EXISTS "editor_namespace_not_connected_label" varchar;
  ALTER TABLE "errors_locales" ADD COLUMN IF NOT EXISTS "payment_method_in_use" varchar;

  UPDATE "licenses_locales" SET
    "editor_change_namespace_label" = COALESCE("editor_change_namespace_label", CASE WHEN "_locale" = 'de' THEN 'Namespace ändern' ELSE 'Change namespace' END),
    "editor_namespace_connected_label" = COALESCE("editor_namespace_connected_label", CASE WHEN "_locale" = 'de' THEN 'Verbunden' ELSE 'Connected' END),
    "editor_namespace_not_connected_label" = COALESCE("editor_namespace_not_connected_label", CASE WHEN "_locale" = 'de' THEN 'Nicht verbunden' ELSE 'Not connected' END);

  UPDATE "errors_locales" SET
    "payment_method_in_use" = COALESCE(
      "payment_method_in_use",
      CASE
        WHEN "_locale" = 'de' THEN 'Diese Zahlungsmethode wird noch verwendet, entweder als Standard des Kunden oder einer seiner Lizenzen. Weise zuerst eine andere zu.'
        ELSE 'This payment method is still in use by the customer or one of their licenses. Assign a different one first.'
      END
    );

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_change_namespace_label" SET NOT NULL;
  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_namespace_connected_label" SET NOT NULL;
  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_namespace_not_connected_label" SET NOT NULL;
  ALTER TABLE "errors_locales" ALTER COLUMN "payment_method_in_use" SET NOT NULL;

  ALTER TABLE "licenses_locales" DROP COLUMN IF EXISTS "values_invoice_statuses_paid";
  ALTER TABLE "licenses_locales" DROP COLUMN IF EXISTS "editor_cancel_label";
  ALTER TABLE "licenses_locales" DROP COLUMN IF EXISTS "cancel_title";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "licenses_locales" ADD COLUMN IF NOT EXISTS "values_invoice_statuses_paid" varchar;
  ALTER TABLE "licenses_locales" ADD COLUMN IF NOT EXISTS "editor_cancel_label" varchar;
  ALTER TABLE "licenses_locales" ADD COLUMN IF NOT EXISTS "cancel_title" varchar;

  UPDATE "licenses_locales" SET
    "values_invoice_statuses_paid" = COALESCE("values_invoice_statuses_paid", "values_statuses_paid"),
    "editor_cancel_label" = COALESCE("editor_cancel_label", CASE WHEN "_locale" = 'de' THEN 'Abbrechen' ELSE 'Cancel' END),
    "cancel_title" = COALESCE("cancel_title", "cancel_confirm_label");

  ALTER TABLE "licenses_locales" ALTER COLUMN "values_invoice_statuses_paid" SET NOT NULL;
  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_cancel_label" SET NOT NULL;
  ALTER TABLE "licenses_locales" ALTER COLUMN "cancel_title" SET NOT NULL;

  ALTER TABLE "licenses_locales" DROP COLUMN IF EXISTS "editor_change_namespace_label";
  ALTER TABLE "licenses_locales" DROP COLUMN IF EXISTS "editor_namespace_connected_label";
  ALTER TABLE "licenses_locales" DROP COLUMN IF EXISTS "editor_namespace_not_connected_label";
  ALTER TABLE "errors_locales" DROP COLUMN IF EXISTS "payment_method_in_use";`)
}
