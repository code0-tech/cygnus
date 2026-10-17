import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config_locales" ADD COLUMN "payment_period_weekly_paid_label" varchar DEFAULT 'paid weekly';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "payment_period_quarterly_paid_label" varchar DEFAULT 'paid quarterly';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "payment_period_yearly_paid_label" varchar DEFAULT 'paid yearly';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config_locales" DROP COLUMN "payment_period_weekly_paid_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "payment_period_quarterly_paid_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "payment_period_yearly_paid_label";`)
}
