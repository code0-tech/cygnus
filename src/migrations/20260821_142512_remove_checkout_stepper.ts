import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "checkout_locales" DROP COLUMN "stepper_configuration_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "stepper_billing_address_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "stepper_payment_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "stepper_success_label";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "checkout_locales" ADD COLUMN "stepper_configuration_label" varchar DEFAULT 'Configuration' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "stepper_billing_address_label" varchar DEFAULT 'Billing Address' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "stepper_payment_label" varchar DEFAULT 'Payment' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "stepper_success_label" varchar DEFAULT 'Success' NOT NULL;`)
}
