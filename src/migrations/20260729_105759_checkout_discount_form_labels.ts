import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" ADD COLUMN "summary_pricing_discount_input_placeholder" varchar DEFAULT 'Discount code' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "summary_pricing_discount_button_label" varchar DEFAULT 'Apply' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" DROP COLUMN "summary_pricing_discount_input_placeholder";
  ALTER TABLE "checkout_locales" DROP COLUMN "summary_pricing_discount_button_label";`)
}
