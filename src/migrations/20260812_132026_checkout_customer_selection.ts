import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" ADD COLUMN "form_customer_select_label" varchar DEFAULT 'Billing customer' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_new_customer_label" varchar DEFAULT 'Create new customer' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_customer_fallback_label" varchar DEFAULT 'Customer' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_checkout_customer" varchar DEFAULT 'The selected billing customer cannot be used for this checkout.' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" DROP COLUMN "form_customer_select_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_new_customer_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_customer_fallback_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_checkout_customer";`)
}
