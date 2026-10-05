import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_subscription_config_defaults_payment_period_b2b" AS ENUM('monthly', 'quarterly', 'yearly');
  CREATE TYPE "public"."enum_subscription_config_defaults_payment_period_b2c" AS ENUM('weekly', 'monthly', 'yearly');
  CREATE TYPE "public"."enum_subscription_config_payment_period_weekly_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');
  ALTER TABLE "subscription_config" ADD COLUMN "defaults_payment_period_b2b" "enum_subscription_config_defaults_payment_period_b2b" DEFAULT 'monthly';
  ALTER TABLE "subscription_config" ADD COLUMN "defaults_payment_period_b2c" "enum_subscription_config_defaults_payment_period_b2c" DEFAULT 'monthly';
  ALTER TABLE "subscription_config" ADD COLUMN "packages_pro_prices_weekly" numeric DEFAULT 0;
  ALTER TABLE "subscription_config" ADD COLUMN "packages_max_prices_weekly" numeric DEFAULT 0;
  ALTER TABLE "subscription_config" ADD COLUMN "payment_period_weekly_color" "enum_subscription_config_payment_period_weekly_color" DEFAULT 'lime';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "payment_period_weekly_text" varchar DEFAULT 'Weekly';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "payment_period_weekly_period_suffix" varchar DEFAULT 'per week';
  ALTER TABLE "subscription_config" DROP COLUMN "defaults_payment_period";
  DROP TYPE "public"."enum_subscription_config_defaults_payment_period";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_subscription_config_defaults_payment_period" AS ENUM('monthly', 'quarterly', 'yearly');
  ALTER TABLE "subscription_config" ADD COLUMN "defaults_payment_period" "enum_subscription_config_defaults_payment_period" DEFAULT 'monthly';
  ALTER TABLE "subscription_config" DROP COLUMN "defaults_payment_period_b2b";
  ALTER TABLE "subscription_config" DROP COLUMN "defaults_payment_period_b2c";
  ALTER TABLE "subscription_config" DROP COLUMN "packages_pro_prices_weekly";
  ALTER TABLE "subscription_config" DROP COLUMN "packages_max_prices_weekly";
  ALTER TABLE "subscription_config" DROP COLUMN "payment_period_weekly_color";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "payment_period_weekly_text";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "payment_period_weekly_period_suffix";
  DROP TYPE "public"."enum_subscription_config_defaults_payment_period_b2b";
  DROP TYPE "public"."enum_subscription_config_defaults_payment_period_b2c";
  DROP TYPE "public"."enum_subscription_config_payment_period_weekly_color";`)
}
