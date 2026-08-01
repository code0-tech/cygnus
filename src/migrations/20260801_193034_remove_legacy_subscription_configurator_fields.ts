import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config" DROP COLUMN "subscription_tier_pro_icon";
  ALTER TABLE "subscription_config" DROP COLUMN "subscription_tier_pro_color";
  ALTER TABLE "subscription_config" DROP COLUMN "subscription_tier_team_icon";
  ALTER TABLE "subscription_config" DROP COLUMN "subscription_tier_team_color";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "configurator_navigation_back_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "configurator_navigation_next_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "subscription_tier_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "subscription_tier_pro_title";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "subscription_tier_pro_description";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "subscription_tier_team_title";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "subscription_tier_team_description";
  DROP TYPE "public"."enum_subscription_config_subscription_tier_pro_color";
  DROP TYPE "public"."enum_subscription_config_subscription_tier_team_color";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_subscription_config_subscription_tier_pro_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');
  CREATE TYPE "public"."enum_subscription_config_subscription_tier_team_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');
  ALTER TABLE "subscription_config" ADD COLUMN "subscription_tier_pro_icon" varchar DEFAULT 'sparkles' NOT NULL;
  ALTER TABLE "subscription_config" ADD COLUMN "subscription_tier_pro_color" "enum_subscription_config_subscription_tier_pro_color" DEFAULT 'brand';
  ALTER TABLE "subscription_config" ADD COLUMN "subscription_tier_team_icon" varchar DEFAULT 'users-group' NOT NULL;
  ALTER TABLE "subscription_config" ADD COLUMN "subscription_tier_team_color" "enum_subscription_config_subscription_tier_team_color" DEFAULT 'aqua';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "configurator_navigation_back_label" varchar DEFAULT 'Back';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "configurator_navigation_next_label" varchar DEFAULT 'Next';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "subscription_tier_label" varchar DEFAULT 'Subscription tier';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "subscription_tier_pro_title" varchar DEFAULT 'PRO';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "subscription_tier_pro_description" varchar DEFAULT 'Single-owner setup for advanced personal or expert workflows.';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "subscription_tier_team_title" varchar DEFAULT 'TEAM';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "subscription_tier_team_description" varchar DEFAULT 'Shared workspace model with seat-based team access.';`)
}
