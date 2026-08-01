import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config" ADD COLUMN "workflow_executions_b2b_default" numeric DEFAULT 1000;
  ALTER TABLE "subscription_config" ADD COLUMN "workflow_executions_b2c_default" numeric DEFAULT 100;
  ALTER TABLE "subscription_config" ADD COLUMN "ai_tokens_b2b_default" numeric DEFAULT 1000000;
  ALTER TABLE "subscription_config" ADD COLUMN "ai_tokens_b2c_default" numeric DEFAULT 100000;
  ALTER TABLE "subscription_config" DROP COLUMN "defaults_workflow_executions_b2b";
  ALTER TABLE "subscription_config" DROP COLUMN "defaults_workflow_executions_b2c";
  ALTER TABLE "subscription_config" DROP COLUMN "defaults_ai_tokens_b2b";
  ALTER TABLE "subscription_config" DROP COLUMN "defaults_ai_tokens_b2c";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config" ADD COLUMN "defaults_workflow_executions_b2b" numeric DEFAULT 1000;
  ALTER TABLE "subscription_config" ADD COLUMN "defaults_workflow_executions_b2c" numeric DEFAULT 100;
  ALTER TABLE "subscription_config" ADD COLUMN "defaults_ai_tokens_b2b" numeric DEFAULT 1000000;
  ALTER TABLE "subscription_config" ADD COLUMN "defaults_ai_tokens_b2c" numeric DEFAULT 100000;
  ALTER TABLE "subscription_config" DROP COLUMN "workflow_executions_b2b_default";
  ALTER TABLE "subscription_config" DROP COLUMN "workflow_executions_b2c_default";
  ALTER TABLE "subscription_config" DROP COLUMN "ai_tokens_b2b_default";
  ALTER TABLE "subscription_config" DROP COLUMN "ai_tokens_b2c_default";`)
}
