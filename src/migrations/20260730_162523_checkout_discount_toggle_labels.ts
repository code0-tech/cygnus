import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" ADD COLUMN "summary_pricing_discount_prompt_label" varchar DEFAULT 'Have a discount?' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "summary_pricing_discount_remove_label" varchar DEFAULT 'Remove' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" DROP COLUMN "summary_pricing_discount_prompt_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "summary_pricing_discount_remove_label";`)
}
