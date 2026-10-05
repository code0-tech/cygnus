import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config_locales" ADD COLUMN "deployment_description" varchar;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "plan_description" varchar;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "customer_type_description" varchar;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "payment_period_description" varchar;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_executions_description" varchar;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "ai_tokens_description" varchar;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "additional_features_description" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config_locales" DROP COLUMN "deployment_description";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "plan_description";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "customer_type_description";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "payment_period_description";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "workflow_executions_description";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "ai_tokens_description";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "additional_features_description";`)
}
