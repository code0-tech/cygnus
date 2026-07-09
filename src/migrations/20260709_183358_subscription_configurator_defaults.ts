import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_subscription_config_defaults_deployment" AS ENUM('self-hosted', 'cloud');
  CREATE TYPE "public"."enum_subscription_config_defaults_customer_type" AS ENUM('b2b', 'b2c');
  CREATE TYPE "public"."enum_subscription_config_defaults_payment_period" AS ENUM('monthly', 'quarterly', 'yearly');
  ALTER TABLE "subscription_config" ADD COLUMN "defaults_deployment" "enum_subscription_config_defaults_deployment" DEFAULT 'self-hosted';
  ALTER TABLE "subscription_config" ADD COLUMN "defaults_customer_type" "enum_subscription_config_defaults_customer_type" DEFAULT 'b2b';
  ALTER TABLE "subscription_config" ADD COLUMN "defaults_payment_period" "enum_subscription_config_defaults_payment_period" DEFAULT 'monthly';
  ALTER TABLE "subscription_config" ADD COLUMN "defaults_workflow_executions_b2b" numeric DEFAULT 1000;
  ALTER TABLE "subscription_config" ADD COLUMN "defaults_workflow_executions_b2c" numeric DEFAULT 100;
  ALTER TABLE "subscription_config" ADD COLUMN "defaults_ai_tokens_b2b" numeric DEFAULT 1000000;
  ALTER TABLE "subscription_config" ADD COLUMN "defaults_ai_tokens_b2c" numeric DEFAULT 100000;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config" DROP COLUMN "defaults_deployment";
  ALTER TABLE "subscription_config" DROP COLUMN "defaults_customer_type";
  ALTER TABLE "subscription_config" DROP COLUMN "defaults_payment_period";
  ALTER TABLE "subscription_config" DROP COLUMN "defaults_workflow_executions_b2b";
  ALTER TABLE "subscription_config" DROP COLUMN "defaults_workflow_executions_b2c";
  ALTER TABLE "subscription_config" DROP COLUMN "defaults_ai_tokens_b2b";
  ALTER TABLE "subscription_config" DROP COLUMN "defaults_ai_tokens_b2c";
  DROP TYPE "public"."enum_subscription_config_defaults_deployment";
  DROP TYPE "public"."enum_subscription_config_defaults_customer_type";
  DROP TYPE "public"."enum_subscription_config_defaults_payment_period";`)
}
