import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config_workflow_calculator_business_types" ADD COLUMN "icon" varchar DEFAULT 'building' NOT NULL;
  ALTER TABLE "subscription_config_workflow_calculator_business_types_locales" ADD COLUMN "conversion_unit" varchar DEFAULT 'executions' NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_calculator_business_type_search_placeholder" varchar DEFAULT 'Search business types';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_calculator_no_business_types_found_label" varchar DEFAULT 'No business types found.';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config_workflow_calculator_business_types" DROP COLUMN "icon";
  ALTER TABLE "subscription_config_workflow_calculator_business_types_locales" DROP COLUMN "conversion_unit";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "workflow_calculator_business_type_search_placeholder";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "workflow_calculator_no_business_types_found_label";`)
}
