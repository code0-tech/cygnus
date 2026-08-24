import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "licenses_locales" ADD COLUMN "editor_no_payment_methods_label" varchar;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_add_payment_method_label" varchar;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_remove_payment_method_label" varchar;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_removing_payment_method_label" varchar;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_default_payment_method_label" varchar;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_other_payment_methods_heading" varchar;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_use_payment_method_label" varchar;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_setting_payment_method_label" varchar;
  ALTER TABLE "errors_locales" ADD COLUMN "payment_method_remove" varchar;
  ALTER TABLE "errors_locales" ADD COLUMN "payment_method_assign" varchar;

  UPDATE "licenses_locales" SET
    "editor_no_payment_methods_label" = CASE WHEN "_locale" = 'de' THEN 'Noch keine Zahlungsmethoden' ELSE 'No payment methods yet' END,
    "editor_add_payment_method_label" = CASE WHEN "_locale" = 'de' THEN 'Zahlungsmethode hinzufügen' ELSE 'Add payment method' END,
    "editor_remove_payment_method_label" = CASE WHEN "_locale" = 'de' THEN 'Entfernen' ELSE 'Remove' END,
    "editor_removing_payment_method_label" = CASE WHEN "_locale" = 'de' THEN 'Wird entfernt …' ELSE 'Removing…' END,
    "editor_default_payment_method_label" = CASE WHEN "_locale" = 'de' THEN 'Standard' ELSE 'Default' END,
    "editor_other_payment_methods_heading" = CASE WHEN "_locale" = 'de' THEN 'Weitere Zahlungsmethoden' ELSE 'Other payment methods' END,
    "editor_use_payment_method_label" = CASE WHEN "_locale" = 'de' THEN 'Diese verwenden' ELSE 'Use this' END,
    "editor_setting_payment_method_label" = CASE WHEN "_locale" = 'de' THEN 'Wird zugewiesen …' ELSE 'Assigning…' END;

  UPDATE "errors_locales" SET
    "payment_method_remove" = CASE WHEN "_locale" = 'de' THEN 'Die Zahlungsmethode konnte nicht entfernt werden.' ELSE 'The payment method could not be removed.' END,
    "payment_method_assign" = CASE WHEN "_locale" = 'de' THEN 'Die Zahlungsmethode konnte dieser Lizenz nicht zugewiesen werden.' ELSE 'The payment method could not be assigned to this license.' END;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_no_payment_methods_label" SET NOT NULL;
  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_add_payment_method_label" SET NOT NULL;
  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_remove_payment_method_label" SET NOT NULL;
  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_removing_payment_method_label" SET NOT NULL;
  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_default_payment_method_label" SET NOT NULL;
  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_other_payment_methods_heading" SET NOT NULL;
  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_use_payment_method_label" SET NOT NULL;
  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_setting_payment_method_label" SET NOT NULL;
  ALTER TABLE "errors_locales" ALTER COLUMN "payment_method_remove" SET NOT NULL;
  ALTER TABLE "errors_locales" ALTER COLUMN "payment_method_assign" SET NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "licenses_locales" DROP COLUMN "editor_no_payment_methods_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_add_payment_method_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_remove_payment_method_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_removing_payment_method_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_default_payment_method_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_other_payment_methods_heading";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_use_payment_method_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_setting_payment_method_label";
  ALTER TABLE "errors_locales" DROP COLUMN "payment_method_remove";
  ALTER TABLE "errors_locales" DROP COLUMN "payment_method_assign";`)
}
