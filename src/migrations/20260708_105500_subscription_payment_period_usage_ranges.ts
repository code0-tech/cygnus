import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config" RENAME COLUMN "workflow_executions_step" TO "workflow_executions_b2b_step";
  ALTER TABLE "subscription_config" RENAME COLUMN "workflow_executions_min" TO "workflow_executions_b2b_min";
  ALTER TABLE "subscription_config" RENAME COLUMN "workflow_executions_max" TO "workflow_executions_b2b_max";
  ALTER TABLE "subscription_config" ADD COLUMN "workflow_executions_b2c_step" numeric DEFAULT 10;
  ALTER TABLE "subscription_config" ADD COLUMN "workflow_executions_b2c_min" numeric DEFAULT 10;
  ALTER TABLE "subscription_config" ADD COLUMN "workflow_executions_b2c_max" numeric DEFAULT 1000;
  ALTER TABLE "subscription_config" RENAME COLUMN "ai_tokens_step" TO "ai_tokens_b2b_step";
  ALTER TABLE "subscription_config" RENAME COLUMN "ai_tokens_min" TO "ai_tokens_b2b_min";
  ALTER TABLE "subscription_config" RENAME COLUMN "ai_tokens_max" TO "ai_tokens_b2b_max";
  ALTER TABLE "subscription_config" ADD COLUMN "ai_tokens_b2c_step" numeric DEFAULT 10000;
  ALTER TABLE "subscription_config" ADD COLUMN "ai_tokens_b2c_min" numeric DEFAULT 10000;
  ALTER TABLE "subscription_config" ADD COLUMN "ai_tokens_b2c_max" numeric DEFAULT 1000000;
  ALTER TABLE "subscription_config" ADD COLUMN "payment_period_quarterly_discount" numeric DEFAULT 0;
  ALTER TABLE "subscription_config" ADD COLUMN "payment_period_yearly_discount" numeric DEFAULT 0;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "payment_period_label" varchar DEFAULT 'Payment period';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "payment_period_description" varchar DEFAULT 'Choose how often you want to be billed.';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "payment_period_monthly_text" varchar DEFAULT 'Monthly';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "payment_period_quarterly_text" varchar DEFAULT 'Quarterly';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "payment_period_yearly_text" varchar DEFAULT 'Yearly';
  ALTER TABLE "subscription_config_locales" RENAME COLUMN "workflow_executions_center_suffix" TO "workflow_executions_suffix";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "workflow_executions_min_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "workflow_executions_max_label";
  ALTER TABLE "subscription_config_locales" RENAME COLUMN "ai_tokens_center_suffix" TO "ai_tokens_suffix";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "ai_tokens_min_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "ai_tokens_max_label";`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config_locales" ADD COLUMN "ai_tokens_max_label" varchar DEFAULT '10M tokens';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "ai_tokens_min_label" varchar DEFAULT '100K tokens';
  ALTER TABLE "subscription_config_locales" RENAME COLUMN "ai_tokens_suffix" TO "ai_tokens_center_suffix";
  ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_executions_max_label" varchar DEFAULT '10,000 exec';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_executions_min_label" varchar DEFAULT '200 exec';
  ALTER TABLE "subscription_config_locales" RENAME COLUMN "workflow_executions_suffix" TO "workflow_executions_center_suffix";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "payment_period_yearly_text";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "payment_period_quarterly_text";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "payment_period_monthly_text";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "payment_period_description";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "payment_period_label";
  ALTER TABLE "subscription_config" DROP COLUMN "payment_period_yearly_discount";
  ALTER TABLE "subscription_config" DROP COLUMN "payment_period_quarterly_discount";
  ALTER TABLE "subscription_config" DROP COLUMN "ai_tokens_b2c_max";
  ALTER TABLE "subscription_config" DROP COLUMN "ai_tokens_b2c_min";
  ALTER TABLE "subscription_config" DROP COLUMN "ai_tokens_b2c_step";
  ALTER TABLE "subscription_config" RENAME COLUMN "ai_tokens_b2b_max" TO "ai_tokens_max";
  ALTER TABLE "subscription_config" RENAME COLUMN "ai_tokens_b2b_min" TO "ai_tokens_min";
  ALTER TABLE "subscription_config" RENAME COLUMN "ai_tokens_b2b_step" TO "ai_tokens_step";
  ALTER TABLE "subscription_config" DROP COLUMN "workflow_executions_b2c_max";
  ALTER TABLE "subscription_config" DROP COLUMN "workflow_executions_b2c_min";
  ALTER TABLE "subscription_config" DROP COLUMN "workflow_executions_b2c_step";
  ALTER TABLE "subscription_config" RENAME COLUMN "workflow_executions_b2b_max" TO "workflow_executions_max";
  ALTER TABLE "subscription_config" RENAME COLUMN "workflow_executions_b2b_min" TO "workflow_executions_min";
  ALTER TABLE "subscription_config" RENAME COLUMN "workflow_executions_b2b_step" TO "workflow_executions_step";`);
}
