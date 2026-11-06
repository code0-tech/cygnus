import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "licenses_locales" RENAME COLUMN "editor_default_payment_method_label" TO "dashboard_customers_description";
  ALTER TABLE "licenses_locales" RENAME COLUMN "billing_pending_change_label" TO "dashboard_recent_licenses_description";
  UPDATE "licenses_locales"
  SET
    "dashboard_customers_description" = CASE
      WHEN "_locale" = 'de' THEN 'Verwalte die Kunden, die mit deinen Lizenzen verknüpft sind.'
      ELSE 'Manage the customers connected to your licenses.'
    END,
    "dashboard_recent_licenses_description" = CASE
      WHEN "_locale" = 'de' THEN 'Greife schnell auf die zuletzt bearbeiteten Lizenzen zu.'
      ELSE 'Quickly access the licenses that were edited most recently.'
    END;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "licenses_locales" RENAME COLUMN "dashboard_customers_description" TO "editor_default_payment_method_label";
  ALTER TABLE "licenses_locales" RENAME COLUMN "dashboard_recent_licenses_description" TO "billing_pending_change_label";
  UPDATE "licenses_locales"
  SET
    "editor_default_payment_method_label" = CASE WHEN "_locale" = 'de' THEN 'Standard' ELSE 'Default' END,
    "billing_pending_change_label" = CASE WHEN "_locale" = 'de' THEN 'Geplante Änderung' ELSE 'Scheduled change' END;`)
}
