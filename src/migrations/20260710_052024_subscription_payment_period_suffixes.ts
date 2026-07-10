import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config_locales" ADD COLUMN "payment_period_monthly_period_suffix" varchar DEFAULT 'per month';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "payment_period_quarterly_period_suffix" varchar DEFAULT 'per quarter';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "payment_period_yearly_period_suffix" varchar DEFAULT 'per year';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config_locales" DROP COLUMN "payment_period_monthly_period_suffix";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "payment_period_quarterly_period_suffix";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "payment_period_yearly_period_suffix";`)
}
