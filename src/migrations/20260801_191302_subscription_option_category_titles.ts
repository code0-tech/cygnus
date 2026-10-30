import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config_locales" ALTER COLUMN "deployment_label" SET DEFAULT 'Choose where your code0 instance will run.';
  ALTER TABLE "subscription_config_locales" ALTER COLUMN "plan_title" SET DEFAULT 'Choose the plan that best matches your requirements.';
  ALTER TABLE "subscription_config_locales" ALTER COLUMN "customer_type_label" SET DEFAULT 'Choose the customer model that best matches your use case.';
  ALTER TABLE "subscription_config_locales" ALTER COLUMN "payment_period_label" SET DEFAULT 'Choose how often you want to be billed.';
  ALTER TABLE "subscription_config_locales" ALTER COLUMN "workflow_executions_title" SET DEFAULT 'How many workflow executions do you expect per month?';
  ALTER TABLE "subscription_config_locales" ALTER COLUMN "ai_tokens_title" SET DEFAULT 'How many AI tokens do you expect to consume per month?';
  ALTER TABLE "subscription_config_locales" DROP COLUMN "deployment_description";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "plan_description";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "customer_type_description";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "payment_period_description";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "workflow_executions_description";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "ai_tokens_description";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config_locales" ALTER COLUMN "deployment_label" SET DEFAULT 'Deployment';
  ALTER TABLE "subscription_config_locales" ALTER COLUMN "plan_title" SET DEFAULT 'Plan';
  ALTER TABLE "subscription_config_locales" ALTER COLUMN "customer_type_label" SET DEFAULT 'Customer Type';
  ALTER TABLE "subscription_config_locales" ALTER COLUMN "payment_period_label" SET DEFAULT 'Payment period';
  ALTER TABLE "subscription_config_locales" ALTER COLUMN "workflow_executions_title" SET DEFAULT 'Workflow Executions';
  ALTER TABLE "subscription_config_locales" ALTER COLUMN "ai_tokens_title" SET DEFAULT 'AI Tokens';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "deployment_description" varchar DEFAULT 'Choose where your code0 instance will run.';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "plan_description" varchar DEFAULT 'Choose the plan that best matches your requirements.';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "customer_type_description" varchar DEFAULT 'Choose the customer model that best matches your use case.';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "payment_period_description" varchar DEFAULT 'Choose how often you want to be billed.';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_executions_description" varchar DEFAULT 'How many workflow executions do you expect per month?';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "ai_tokens_description" varchar DEFAULT 'How many AI tokens do you expect to consume per month?';`)
}
