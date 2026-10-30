import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "footer" ADD COLUMN "legal_links_terms_url" varchar DEFAULT '/terms' NOT NULL;
  ALTER TABLE "footer_locales" ADD COLUMN "legal_links_terms_label" varchar DEFAULT 'Terms & Conditions' NOT NULL;
  ALTER TABLE "subscription_config" DROP COLUMN "packages_pro_prices_weekly";
  ALTER TABLE "subscription_config" DROP COLUMN "packages_pro_prices_monthly";
  ALTER TABLE "subscription_config" DROP COLUMN "packages_pro_prices_quarterly";
  ALTER TABLE "subscription_config" DROP COLUMN "packages_pro_prices_yearly";
  ALTER TABLE "subscription_config" DROP COLUMN "packages_max_prices_weekly";
  ALTER TABLE "subscription_config" DROP COLUMN "packages_max_prices_monthly";
  ALTER TABLE "subscription_config" DROP COLUMN "packages_max_prices_quarterly";
  ALTER TABLE "subscription_config" DROP COLUMN "packages_max_prices_yearly";
  ALTER TABLE "subscription_config" DROP COLUMN "payment_period_monthly_discount";
  ALTER TABLE "subscription_config" DROP COLUMN "payment_period_quarterly_discount";
  ALTER TABLE "subscription_config" DROP COLUMN "payment_period_yearly_discount";
  ALTER TABLE "subscription_config" DROP COLUMN "workflow_execution_price_factor";
  ALTER TABLE "subscription_config" DROP COLUMN "workflow_execution_weekly_price_factor";
  ALTER TABLE "subscription_config" DROP COLUMN "ai_token_price_factor";
  ALTER TABLE "subscription_config" DROP COLUMN "ai_token_weekly_price_factor";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config" ADD COLUMN "packages_pro_prices_weekly" numeric DEFAULT 0;
  ALTER TABLE "subscription_config" ADD COLUMN "packages_pro_prices_monthly" numeric DEFAULT 0;
  ALTER TABLE "subscription_config" ADD COLUMN "packages_pro_prices_quarterly" numeric DEFAULT 0;
  ALTER TABLE "subscription_config" ADD COLUMN "packages_pro_prices_yearly" numeric DEFAULT 0;
  ALTER TABLE "subscription_config" ADD COLUMN "packages_max_prices_weekly" numeric DEFAULT 0;
  ALTER TABLE "subscription_config" ADD COLUMN "packages_max_prices_monthly" numeric DEFAULT 0;
  ALTER TABLE "subscription_config" ADD COLUMN "packages_max_prices_quarterly" numeric DEFAULT 0;
  ALTER TABLE "subscription_config" ADD COLUMN "packages_max_prices_yearly" numeric DEFAULT 0;
  ALTER TABLE "subscription_config" ADD COLUMN "payment_period_monthly_discount" numeric DEFAULT 0;
  ALTER TABLE "subscription_config" ADD COLUMN "payment_period_quarterly_discount" numeric DEFAULT 0;
  ALTER TABLE "subscription_config" ADD COLUMN "payment_period_yearly_discount" numeric DEFAULT 0;
  ALTER TABLE "subscription_config" ADD COLUMN "workflow_execution_price_factor" numeric DEFAULT 0.001;
  ALTER TABLE "subscription_config" ADD COLUMN "workflow_execution_weekly_price_factor" numeric DEFAULT 0.00023;
  ALTER TABLE "subscription_config" ADD COLUMN "ai_token_price_factor" numeric DEFAULT 0.000001;
  ALTER TABLE "subscription_config" ADD COLUMN "ai_token_weekly_price_factor" numeric DEFAULT 2.3e-7;
  ALTER TABLE "footer" DROP COLUMN "legal_links_terms_url";
  ALTER TABLE "footer_locales" DROP COLUMN "legal_links_terms_label";`)
}
