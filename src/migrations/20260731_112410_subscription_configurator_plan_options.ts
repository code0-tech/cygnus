import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config" ADD COLUMN "plan_pro_icon" varchar DEFAULT 'sparkles' NOT NULL;
  ALTER TABLE "subscription_config" ADD COLUMN "plan_max_icon" varchar DEFAULT 'rocket' NOT NULL;
  ALTER TABLE "subscription_config" ADD COLUMN "plan_custom_icon" varchar DEFAULT 'settings' NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "plan_title" varchar DEFAULT 'Plan';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "plan_description" varchar DEFAULT 'Choose the plan that best matches your requirements.';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "plan_pro_title" varchar DEFAULT 'Pro';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "plan_pro_description" varchar DEFAULT 'A ready-to-use plan for individuals and smaller teams.';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "plan_max_title" varchar DEFAULT 'Max';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "plan_max_description" varchar DEFAULT 'A ready-to-use plan for organizations with higher requirements.';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "plan_custom_title" varchar DEFAULT 'Custom';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "plan_custom_description" varchar DEFAULT 'Configure usage and additional features for an individual setup.';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config" DROP COLUMN "plan_pro_icon";
  ALTER TABLE "subscription_config" DROP COLUMN "plan_max_icon";
  ALTER TABLE "subscription_config" DROP COLUMN "plan_custom_icon";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "plan_title";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "plan_description";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "plan_pro_title";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "plan_pro_description";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "plan_max_title";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "plan_max_description";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "plan_custom_title";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "plan_custom_description";`)
}
