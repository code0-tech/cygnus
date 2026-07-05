import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
   CREATE TABLE "subscription_config_workflow_calculator_business_types" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"conversion_rate" numeric DEFAULT 1 NOT NULL
  );

  CREATE TABLE "subscription_config_workflow_calculator_business_types_locales" (
  	"name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_calculator_trigger_label" varchar DEFAULT 'Calculate';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_calculator_title" varchar DEFAULT 'Calculate workflow executions';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_calculator_description" varchar DEFAULT 'Estimate monthly volume from your active workflows and their average execution frequency.';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_calculator_close_label" varchar DEFAULT 'Close dialog';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_calculator_business_type_label" varchar DEFAULT 'Business type';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_calculator_active_workflows_label" varchar DEFAULT 'Active workflows';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_calculator_runs_per_day_label" varchar DEFAULT 'Runs per month';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_calculator_days_per_month_label" varchar DEFAULT 'Days per month';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_calculator_estimate_label" varchar DEFAULT 'Estimated monthly volume';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_calculator_range_note" varchar DEFAULT 'Rounded to the configurable range from {min} to {max}.';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_calculator_cancel_label" varchar DEFAULT 'Cancel';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_calculator_apply_label" varchar DEFAULT 'Apply value';
  ALTER TABLE "subscription_config_workflow_calculator_business_types" ADD CONSTRAINT "subscription_config_workflow_calculator_business_types_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."subscription_config"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscription_config_workflow_calculator_business_types_locales" ADD CONSTRAINT "subscription_config_workflow_calculator_business_types_lo_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."subscription_config_workflow_calculator_business_types"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "subscription_config_workflow_calculator_business_types_order_idx" ON "subscription_config_workflow_calculator_business_types" USING btree ("_order");
  CREATE INDEX "subscription_config_workflow_calculator_business_types_parent_id_idx" ON "subscription_config_workflow_calculator_business_types" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "subscription_config_workflow_calculator_business_types_local" ON "subscription_config_workflow_calculator_business_types_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
   DROP TABLE "subscription_config_workflow_calculator_business_types" CASCADE;
  DROP TABLE "subscription_config_workflow_calculator_business_types_locales" CASCADE;
  ALTER TABLE "subscription_config_locales" DROP COLUMN "workflow_calculator_trigger_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "workflow_calculator_title";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "workflow_calculator_description";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "workflow_calculator_close_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "workflow_calculator_business_type_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "workflow_calculator_active_workflows_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "workflow_calculator_runs_per_day_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "workflow_calculator_days_per_month_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "workflow_calculator_estimate_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "workflow_calculator_range_note";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "workflow_calculator_cancel_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "workflow_calculator_apply_label";`)
}
