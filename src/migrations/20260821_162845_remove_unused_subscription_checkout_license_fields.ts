import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config" DROP COLUMN "title";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "options_panel_heading";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "payment_period_title";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "price_heading";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "price_caption";
  ALTER TABLE "checkout" DROP COLUMN "title";
  ALTER TABLE "checkout" DROP COLUMN "summary_ai_tokens_icon";
  ALTER TABLE "checkout" DROP COLUMN "summary_ai_tokens_icon_color";
  ALTER TABLE "checkout" DROP COLUMN "summary_workflow_executions_icon";
  ALTER TABLE "checkout" DROP COLUMN "summary_workflow_executions_icon_color";
  ALTER TABLE "checkout_locales" DROP COLUMN "navigation_back_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "summary_configuration_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "summary_deployment_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "summary_customer_type_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "summary_ai_tokens_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "summary_workflow_executions_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "summary_pricing_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "summary_pricing_description";
  ALTER TABLE "checkout_locales" DROP COLUMN "summary_pricing_discount_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_payment_heading";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_customer_fallback_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_mobile_contact_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_mobile_next_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_mobile_tax_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_name_placeholder";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_phone_placeholder";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_line1_placeholder";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_line2_placeholder";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_state_placeholder";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_country_placeholder";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_country_empty_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_tax_id_type_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_tax_id_type_placeholder";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_tax_id_value_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_tax_id_value_placeholder";
  ALTER TABLE "checkout_locales" DROP COLUMN "success_license_ready_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "success_back_to_homepage_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_self_hosted_description";
  ALTER TABLE "licenses_locales" DROP COLUMN "upgrade_plan_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "upgrade_increase_only_note";
  DROP TYPE "public"."enum_checkout_summary_ai_tokens_icon_color";
  DROP TYPE "public"."enum_checkout_summary_workflow_executions_icon_color";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_checkout_summary_ai_tokens_icon_color" AS ENUM('neutral', 'brand', 'aqua', 'blue', 'pink', 'yellow', 'lime', 'magenta');
  CREATE TYPE "public"."enum_checkout_summary_workflow_executions_icon_color" AS ENUM('neutral', 'brand', 'aqua', 'blue', 'pink', 'yellow', 'lime', 'magenta');
  ALTER TABLE "subscription_config" ADD COLUMN "title" varchar DEFAULT 'Subscription Config';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "options_panel_heading" varchar DEFAULT 'Build the subscription shape';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "payment_period_title" varchar DEFAULT 'Payment Period';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "price_heading" varchar DEFAULT 'Price';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "price_caption" varchar DEFAULT 'per month';
  ALTER TABLE "checkout" ADD COLUMN "title" varchar DEFAULT 'Checkout Content' NOT NULL;
  ALTER TABLE "checkout" ADD COLUMN "summary_ai_tokens_icon" varchar DEFAULT 'tabler:IconBrain' NOT NULL;
  ALTER TABLE "checkout" ADD COLUMN "summary_ai_tokens_icon_color" "enum_checkout_summary_ai_tokens_icon_color" DEFAULT 'magenta' NOT NULL;
  ALTER TABLE "checkout" ADD COLUMN "summary_workflow_executions_icon" varchar DEFAULT 'tabler:IconBolt' NOT NULL;
  ALTER TABLE "checkout" ADD COLUMN "summary_workflow_executions_icon_color" "enum_checkout_summary_workflow_executions_icon_color" DEFAULT 'brand' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "navigation_back_label" varchar DEFAULT 'Back' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "summary_configuration_label" varchar DEFAULT 'Your configuration' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "summary_deployment_label" varchar DEFAULT 'Deployment' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "summary_customer_type_label" varchar DEFAULT 'Customer Type' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "summary_ai_tokens_label" varchar DEFAULT 'AI Tokens' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "summary_workflow_executions_label" varchar DEFAULT 'Workflow Executions' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "summary_pricing_label" varchar DEFAULT 'Pricing' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "summary_pricing_description" varchar DEFAULT 'Monthly breakdown based on your current setup.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "summary_pricing_discount_label" varchar DEFAULT 'Discount' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_payment_heading" varchar DEFAULT 'Payment Details' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_customer_fallback_label" varchar DEFAULT 'Customer' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_mobile_contact_label" varchar DEFAULT 'Contact details' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_mobile_next_label" varchar DEFAULT 'Continue' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_mobile_tax_label" varchar DEFAULT 'Tax details' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_name_placeholder" varchar DEFAULT 'Full name or company name' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_phone_placeholder" varchar DEFAULT 'Optional' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_line1_placeholder" varchar DEFAULT 'Street and house number' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_line2_placeholder" varchar DEFAULT 'Optional' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_state_placeholder" varchar DEFAULT 'Optional' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_country_placeholder" varchar DEFAULT 'Select a country' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_country_empty_label" varchar DEFAULT 'No country found.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_tax_id_type_label" varchar DEFAULT 'Tax ID type' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_tax_id_type_placeholder" varchar DEFAULT 'eu_vat' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_tax_id_value_label" varchar DEFAULT 'Tax ID' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_tax_id_value_placeholder" varchar DEFAULT 'DE123456789' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "success_license_ready_label" varchar DEFAULT 'Your license is ready.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "success_back_to_homepage_label" varchar DEFAULT 'Return to homepage' NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_self_hosted_description" varchar DEFAULT 'Self-hosted licenses have no editable namespace.' NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "upgrade_plan_label" varchar DEFAULT 'New plan' NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "upgrade_increase_only_note" varchar DEFAULT 'You can only increase these amounts here.' NOT NULL;`)
}
