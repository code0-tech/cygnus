import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" ADD COLUMN "summary_pricing_discount_label" varchar DEFAULT 'Discount' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "summary_pricing_tax_label" varchar DEFAULT 'Tax' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" DROP COLUMN "summary_pricing_discount_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "summary_pricing_tax_label";`)
}
