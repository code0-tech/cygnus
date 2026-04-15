import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config" ADD COLUMN "workflow_executions_min" numeric DEFAULT 200 NOT NULL;
  ALTER TABLE "subscription_config" ADD COLUMN "workflow_executions_max" numeric DEFAULT 10000 NOT NULL;
  ALTER TABLE "subscription_config" ADD COLUMN "workflow_executions_step" numeric DEFAULT 100 NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_executions_title" varchar NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_executions_description" varchar NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_executions_min_label" varchar NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_executions_max_label" varchar NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_executions_center_suffix" varchar NOT NULL;
  ALTER TABLE "subscription_config" DROP COLUMN "team_seats_min";
  ALTER TABLE "subscription_config" DROP COLUMN "team_seats_max";
  ALTER TABLE "subscription_config" DROP COLUMN "team_seats_step";
  ALTER TABLE "subscription_config" DROP COLUMN "runtime_min";
  ALTER TABLE "subscription_config" DROP COLUMN "runtime_max";
  ALTER TABLE "subscription_config" DROP COLUMN "runtime_step";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "team_seats_title";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "team_seats_description";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "team_seats_min_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "team_seats_max_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "team_seats_center_suffix";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "runtime_title";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "runtime_description";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "runtime_monthly_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "runtime_payg_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "runtime_payg_description";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "runtime_min_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "runtime_max_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "runtime_center_suffix";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config" ADD COLUMN "team_seats_min" numeric DEFAULT 2 NOT NULL;
  ALTER TABLE "subscription_config" ADD COLUMN "team_seats_max" numeric DEFAULT 250 NOT NULL;
  ALTER TABLE "subscription_config" ADD COLUMN "team_seats_step" numeric DEFAULT 1 NOT NULL;
  ALTER TABLE "subscription_config" ADD COLUMN "runtime_min" numeric DEFAULT 200 NOT NULL;
  ALTER TABLE "subscription_config" ADD COLUMN "runtime_max" numeric DEFAULT 10000 NOT NULL;
  ALTER TABLE "subscription_config" ADD COLUMN "runtime_step" numeric DEFAULT 100 NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "team_seats_title" varchar NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "team_seats_description" varchar NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "team_seats_min_label" varchar NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "team_seats_max_label" varchar NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "team_seats_center_suffix" varchar NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "runtime_title" varchar NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "runtime_description" varchar NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "runtime_monthly_label" varchar NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "runtime_payg_label" varchar NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "runtime_payg_description" varchar NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "runtime_min_label" varchar NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "runtime_max_label" varchar NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "runtime_center_suffix" varchar NOT NULL;
  ALTER TABLE "subscription_config" DROP COLUMN "workflow_executions_min";
  ALTER TABLE "subscription_config" DROP COLUMN "workflow_executions_max";
  ALTER TABLE "subscription_config" DROP COLUMN "workflow_executions_step";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "workflow_executions_title";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "workflow_executions_description";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "workflow_executions_min_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "workflow_executions_max_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "workflow_executions_center_suffix";`)
}
