import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_subscription_config_payment_period_monthly_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');
  CREATE TYPE "public"."enum_subscription_config_payment_period_quarterly_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');
  CREATE TYPE "public"."enum_subscription_config_payment_period_yearly_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');
  ALTER TABLE "subscription_config" ADD COLUMN "payment_period_monthly_color" "enum_subscription_config_payment_period_monthly_color" DEFAULT 'brand';
  ALTER TABLE "subscription_config" ADD COLUMN "payment_period_quarterly_color" "enum_subscription_config_payment_period_quarterly_color" DEFAULT 'aqua';
  ALTER TABLE "subscription_config" ADD COLUMN "payment_period_yearly_color" "enum_subscription_config_payment_period_yearly_color" DEFAULT 'magenta';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config" DROP COLUMN "payment_period_monthly_color";
  ALTER TABLE "subscription_config" DROP COLUMN "payment_period_quarterly_color";
  ALTER TABLE "subscription_config" DROP COLUMN "payment_period_yearly_color";
  DROP TYPE "public"."enum_subscription_config_payment_period_monthly_color";
  DROP TYPE "public"."enum_subscription_config_payment_period_quarterly_color";
  DROP TYPE "public"."enum_subscription_config_payment_period_yearly_color";`)
}
