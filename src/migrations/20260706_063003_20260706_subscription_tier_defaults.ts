import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config" ALTER COLUMN "subscription_tier_pro_icon" SET DEFAULT 'sparkles';
  ALTER TABLE "subscription_config" ALTER COLUMN "subscription_tier_team_icon" SET DEFAULT 'users-group';
  ALTER TABLE "subscription_config_locales" ALTER COLUMN "subscription_tier_label" SET DEFAULT 'Subscription tier';
  ALTER TABLE "subscription_config_locales" ALTER COLUMN "subscription_tier_pro_title" SET DEFAULT 'PRO';
  ALTER TABLE "subscription_config_locales" ALTER COLUMN "subscription_tier_pro_description" SET DEFAULT 'Single-owner setup for advanced personal or expert workflows.';
  ALTER TABLE "subscription_config_locales" ALTER COLUMN "subscription_tier_team_title" SET DEFAULT 'TEAM';
  ALTER TABLE "subscription_config_locales" ALTER COLUMN "subscription_tier_team_description" SET DEFAULT 'Shared workspace model with seat-based team access.';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config" ALTER COLUMN "subscription_tier_pro_icon" DROP DEFAULT;
  ALTER TABLE "subscription_config" ALTER COLUMN "subscription_tier_team_icon" DROP DEFAULT;
  ALTER TABLE "subscription_config_locales" ALTER COLUMN "subscription_tier_label" DROP DEFAULT;
  ALTER TABLE "subscription_config_locales" ALTER COLUMN "subscription_tier_pro_title" DROP DEFAULT;
  ALTER TABLE "subscription_config_locales" ALTER COLUMN "subscription_tier_pro_description" DROP DEFAULT;
  ALTER TABLE "subscription_config_locales" ALTER COLUMN "subscription_tier_team_title" DROP DEFAULT;
  ALTER TABLE "subscription_config_locales" ALTER COLUMN "subscription_tier_team_description" DROP DEFAULT;`)
}
