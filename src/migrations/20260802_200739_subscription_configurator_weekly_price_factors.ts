import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config_additional_features" ADD COLUMN "weekly_price" numeric DEFAULT 0;
  ALTER TABLE "subscription_config" ADD COLUMN "payment_period_monthly_discount" numeric DEFAULT 0;
  ALTER TABLE "subscription_config" ADD COLUMN "workflow_execution_weekly_price_factor" numeric DEFAULT 0.00023;
  ALTER TABLE "subscription_config" ADD COLUMN "ai_token_weekly_price_factor" numeric DEFAULT 2.3e-7;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config_additional_features" DROP COLUMN "weekly_price";
  ALTER TABLE "subscription_config" DROP COLUMN "payment_period_monthly_discount";
  ALTER TABLE "subscription_config" DROP COLUMN "workflow_execution_weekly_price_factor";
  ALTER TABLE "subscription_config" DROP COLUMN "ai_token_weekly_price_factor";`)
}
