import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config" ADD COLUMN "ai_tokens_min" numeric DEFAULT 100000 NOT NULL;
  ALTER TABLE "subscription_config" ADD COLUMN "ai_tokens_max" numeric DEFAULT 10000000 NOT NULL;
  ALTER TABLE "subscription_config" ADD COLUMN "ai_tokens_step" numeric DEFAULT 100000 NOT NULL;
  ALTER TABLE "subscription_config" ADD COLUMN "ai_token_price_factor" numeric DEFAULT 0.000001 NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "ai_tokens_title" varchar DEFAULT 'AI Tokens' NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "ai_tokens_description" varchar DEFAULT 'How many AI tokens do you expect to consume per month?' NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "ai_tokens_min_label" varchar DEFAULT '100k tokens' NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "ai_tokens_max_label" varchar DEFAULT '10m tokens' NOT NULL;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "ai_tokens_center_suffix" varchar DEFAULT 'tokens' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config" DROP COLUMN "ai_tokens_min";
  ALTER TABLE "subscription_config" DROP COLUMN "ai_tokens_max";
  ALTER TABLE "subscription_config" DROP COLUMN "ai_tokens_step";
  ALTER TABLE "subscription_config" DROP COLUMN "ai_token_price_factor";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "ai_tokens_title";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "ai_tokens_description";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "ai_tokens_min_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "ai_tokens_max_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "ai_tokens_center_suffix";`)
}
