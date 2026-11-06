import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config" ALTER COLUMN "defaults_payment_period_b2c" SET DATA TYPE text;
  ALTER TABLE "subscription_config" ALTER COLUMN "defaults_payment_period_b2c" SET DEFAULT 'monthly'::text;
  UPDATE "subscription_config" SET "defaults_payment_period_b2c" = 'monthly' WHERE "defaults_payment_period_b2c" = 'weekly';
  DROP TYPE "public"."enum_subscription_config_defaults_payment_period_b2c";
  CREATE TYPE "public"."enum_subscription_config_defaults_payment_period_b2c" AS ENUM('monthly', 'quarterly', 'yearly');
  ALTER TABLE "subscription_config" ALTER COLUMN "defaults_payment_period_b2c" SET DEFAULT 'monthly'::"public"."enum_subscription_config_defaults_payment_period_b2c";
  ALTER TABLE "subscription_config" ALTER COLUMN "defaults_payment_period_b2c" SET DATA TYPE "public"."enum_subscription_config_defaults_payment_period_b2c" USING "defaults_payment_period_b2c"::"public"."enum_subscription_config_defaults_payment_period_b2c";
  ALTER TABLE "subscription_config" DROP COLUMN "payment_period_weekly_color";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "payment_period_weekly_text";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "payment_period_weekly_period_suffix";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "payment_period_weekly_paid_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "values_payment_periods_weekly";
  DROP TYPE "public"."enum_subscription_config_payment_period_weekly_color";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_subscription_config_payment_period_weekly_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');
  ALTER TABLE "subscription_config" ALTER COLUMN "defaults_payment_period_b2c" SET DATA TYPE text;
  ALTER TABLE "subscription_config" ALTER COLUMN "defaults_payment_period_b2c" SET DEFAULT 'monthly'::text;
  DROP TYPE "public"."enum_subscription_config_defaults_payment_period_b2c";
  CREATE TYPE "public"."enum_subscription_config_defaults_payment_period_b2c" AS ENUM('weekly', 'monthly', 'yearly');
  ALTER TABLE "subscription_config" ALTER COLUMN "defaults_payment_period_b2c" SET DEFAULT 'monthly'::"public"."enum_subscription_config_defaults_payment_period_b2c";
  ALTER TABLE "subscription_config" ALTER COLUMN "defaults_payment_period_b2c" SET DATA TYPE "public"."enum_subscription_config_defaults_payment_period_b2c" USING "defaults_payment_period_b2c"::"public"."enum_subscription_config_defaults_payment_period_b2c";
  ALTER TABLE "subscription_config" ADD COLUMN "payment_period_weekly_color" "enum_subscription_config_payment_period_weekly_color" DEFAULT 'lime';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "payment_period_weekly_text" varchar DEFAULT 'Weekly';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "payment_period_weekly_period_suffix" varchar DEFAULT 'per week';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "payment_period_weekly_paid_label" varchar DEFAULT 'paid weekly';
  ALTER TABLE "licenses_locales" ADD COLUMN "values_payment_periods_weekly" varchar DEFAULT 'Weekly' NOT NULL;`)
}
