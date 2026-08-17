import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_subscription_config_plan_pro_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');
  CREATE TYPE "public"."enum_subscription_config_plan_max_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');
  CREATE TYPE "public"."enum_subscription_config_plan_custom_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');
  CREATE TABLE "errors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "errors_locales" (
  	"dashboard_load" varchar NOT NULL,
  	"retry" varchar NOT NULL,
  	"customer_update" varchar NOT NULL,
  	"payment_method_update" varchar NOT NULL,
  	"license_update" varchar NOT NULL,
  	"subscription_preview" varchar NOT NULL,
  	"billing_update" varchar NOT NULL,
  	"subscription_cancel" varchar NOT NULL,
  	"subscription_resume" varchar NOT NULL,
  	"plan_upgrade" varchar NOT NULL,
  	"payment_fallback" varchar NOT NULL,
  	"session_unavailable" varchar NOT NULL,
  	"customer_creation" varchar NOT NULL,
  	"customer_type_mismatch" varchar NOT NULL,
  	"checkout_customer" varchar NOT NULL,
  	"checkout_session" varchar NOT NULL,
  	"checkout_session_expired" varchar NOT NULL,
  	"billing_address_update" varchar NOT NULL,
  	"email_update" varchar NOT NULL,
  	"tax_id_update" varchar NOT NULL,
  	"tax_id_incomplete" varchar NOT NULL,
  	"payment_confirmation" varchar NOT NULL,
  	"discount_session_required" varchar NOT NULL,
  	"discount_validation" varchar NOT NULL,
  	"checkout_license_status" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "subscription_config_additional_features" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subscription_config_additional_features_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "subscription_config_additional_features" CASCADE;
  DROP TABLE "subscription_config_additional_features_locales" CASCADE;
  ALTER TABLE "subscription_config_locales" ALTER COLUMN "plan_custom_description" SET DEFAULT 'Configure usage for an individual setup.';
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_description" SET DEFAULT 'This checkout reflects the subscription shape you configured, including runtime.';
  ALTER TABLE "subscription_config" ADD COLUMN "plan_pro_color" "enum_subscription_config_plan_pro_color" DEFAULT 'lime';
  ALTER TABLE "subscription_config" ADD COLUMN "plan_max_color" "enum_subscription_config_plan_max_color" DEFAULT 'magenta';
  ALTER TABLE "subscription_config" ADD COLUMN "plan_custom_color" "enum_subscription_config_plan_custom_color" DEFAULT 'yellow';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "payment_period_title" varchar DEFAULT 'Payment Period';
  ALTER TABLE "checkout_locales" ADD COLUMN "success_receipt_hint" varchar DEFAULT 'Stripe sends the receipt to your email address.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "success_failed_heading" varchar DEFAULT 'Payment failed' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "success_failed_description" varchar DEFAULT 'Stripe could not process your payment. You have not been charged and no subscription was created.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "success_invalid_heading" varchar DEFAULT 'This checkout link is no longer valid' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "success_invalid_description" varchar DEFAULT 'The link has expired or belongs to another account. If your payment went through, you will find the license in your license dashboard.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "success_checkout_retry_label" varchar DEFAULT 'Back to checkout' NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_name_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "pagination_load_more_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "pagination_loading_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_payment_method_heading" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_payment_method_description" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_change_payment_method_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_loading_payment_method_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_save_payment_method_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_saving_payment_method_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_payment_method_success" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "subscription_preview_total_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "subscription_preview_proration_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "subscription_preview_immediate_note" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "subscription_preview_scheduled_note" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "subscription_preview_loading_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "billing_title" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "billing_description" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "billing_period_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "billing_current_period_end_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "billing_pending_change_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "cancel_title" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "cancel_description" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "cancel_confirm_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "cancel_pending_heading" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "cancel_pending_description" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "cancel_cancel_at_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "cancel_resume_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "upgrade_title" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "upgrade_description" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "upgrade_plan_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "upgrade_increase_only_note" varchar NOT NULL;
  ALTER TABLE "errors_locales" ADD CONSTRAINT "errors_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."errors"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "errors_locales_locale_parent_id_unique" ON "errors_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "subscription_config_locales" DROP COLUMN "additional_features_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "additional_features_description";
  ALTER TABLE "checkout" DROP COLUMN "summary_additional_features_icon";
  ALTER TABLE "checkout" DROP COLUMN "summary_additional_features_icon_color";
  ALTER TABLE "checkout_locales" DROP COLUMN "summary_additional_features_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "summary_additional_features_description";
  ALTER TABLE "checkout_locales" DROP COLUMN "summary_pricing_additional_features_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_payment_error_fallback";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_session_unavailable";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_customer_creation";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_customer_type_mismatch";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_checkout_customer";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_checkout_session";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_checkout_session_expired";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_billing_address_update";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_email_update";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_tax_id_update";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_tax_id_incomplete";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_payment_confirmation";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_discount_session_required";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_discount_validation";
  ALTER TABLE "checkout_locales" DROP COLUMN "success_license_status_error";
  ALTER TABLE "licenses_locales" DROP COLUMN "errors_dashboard_load";
  ALTER TABLE "licenses_locales" DROP COLUMN "errors_retry";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_billing_address_heading";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_name_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_phone_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_address_line1_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_address_line2_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_city_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_state_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_postal_code_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_country_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_customer_error";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_license_error";
  DROP TYPE "public"."enum_checkout_summary_additional_features_icon_color";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_checkout_summary_additional_features_icon_color" AS ENUM('neutral', 'brand', 'aqua', 'blue', 'pink', 'yellow', 'lime', 'magenta');
  CREATE TABLE "subscription_config_additional_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" varchar NOT NULL,
  	"price" numeric DEFAULT 0,
  	"weekly_price" numeric DEFAULT 0
  );
  
  CREATE TABLE "subscription_config_additional_features_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "errors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "errors_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "errors" CASCADE;
  DROP TABLE "errors_locales" CASCADE;
  ALTER TABLE "subscription_config_locales" ALTER COLUMN "plan_custom_description" SET DEFAULT 'Configure usage and additional features for an individual setup.';
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_description" SET DEFAULT 'This checkout reflects the subscription shape you configured, including runtime and optional add-ons.';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "additional_features_label" varchar;
  ALTER TABLE "subscription_config_locales" ADD COLUMN "additional_features_description" varchar;
  ALTER TABLE "checkout" ADD COLUMN "summary_additional_features_icon" varchar DEFAULT 'tabler:IconSparkles' NOT NULL;
  ALTER TABLE "checkout" ADD COLUMN "summary_additional_features_icon_color" "enum_checkout_summary_additional_features_icon_color" DEFAULT 'yellow' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "summary_additional_features_label" varchar DEFAULT 'Additional Features' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "summary_additional_features_description" varchar DEFAULT 'Selected add-ons that extend the base subscription.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "summary_pricing_additional_features_label" varchar DEFAULT 'Additional Features' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_payment_error_fallback" varchar DEFAULT 'An unexpected error occurred.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_session_unavailable" varchar DEFAULT 'Your checkout session could not be authenticated. Please try again.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_customer_creation" varchar DEFAULT 'Your billing customer could not be prepared. Please try again.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_customer_type_mismatch" varchar DEFAULT 'Your existing customer type does not match this checkout configuration.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_checkout_customer" varchar DEFAULT 'The selected billing customer cannot be used for this checkout.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_checkout_session" varchar DEFAULT 'The checkout session could not be created. Please try again.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_checkout_session_expired" varchar DEFAULT 'The checkout session expired. A new session is being created.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_billing_address_update" varchar DEFAULT 'The billing address could not be saved. Please check your details.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_email_update" varchar DEFAULT 'The email address could not be saved. Please check your details.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_tax_id_update" varchar DEFAULT 'The tax ID could not be saved. Please check your details.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_tax_id_incomplete" varchar DEFAULT 'Tax ID type and Tax ID must be provided together.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_payment_confirmation" varchar DEFAULT 'The payment could not be confirmed. Please check your payment details.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_discount_session_required" varchar DEFAULT 'A checkout session is required to validate a discount.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_discount_validation" varchar DEFAULT 'The discount code could not be validated.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "success_license_status_error" varchar DEFAULT 'We could not check whether your license is ready.' NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "errors_dashboard_load" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "errors_retry" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_billing_address_heading" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_name_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_phone_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_address_line1_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_address_line2_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_city_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_state_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_postal_code_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_country_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_customer_error" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_license_error" varchar NOT NULL;
  ALTER TABLE "subscription_config_additional_features" ADD CONSTRAINT "subscription_config_additional_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."subscription_config"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscription_config_additional_features_locales" ADD CONSTRAINT "subscription_config_additional_features_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."subscription_config_additional_features"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "subscription_config_additional_features_order_idx" ON "subscription_config_additional_features" USING btree ("_order");
  CREATE INDEX "subscription_config_additional_features_parent_id_idx" ON "subscription_config_additional_features" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "subscription_config_additional_features_locales_locale_paren" ON "subscription_config_additional_features_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "subscription_config" DROP COLUMN "plan_pro_color";
  ALTER TABLE "subscription_config" DROP COLUMN "plan_max_color";
  ALTER TABLE "subscription_config" DROP COLUMN "plan_custom_color";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "payment_period_title";
  ALTER TABLE "checkout_locales" DROP COLUMN "success_receipt_hint";
  ALTER TABLE "checkout_locales" DROP COLUMN "success_failed_heading";
  ALTER TABLE "checkout_locales" DROP COLUMN "success_failed_description";
  ALTER TABLE "checkout_locales" DROP COLUMN "success_invalid_heading";
  ALTER TABLE "checkout_locales" DROP COLUMN "success_invalid_description";
  ALTER TABLE "checkout_locales" DROP COLUMN "success_checkout_retry_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_name_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "pagination_load_more_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "pagination_loading_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_payment_method_heading";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_payment_method_description";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_change_payment_method_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_loading_payment_method_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_save_payment_method_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_saving_payment_method_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_payment_method_success";
  ALTER TABLE "licenses_locales" DROP COLUMN "subscription_preview_total_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "subscription_preview_proration_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "subscription_preview_immediate_note";
  ALTER TABLE "licenses_locales" DROP COLUMN "subscription_preview_scheduled_note";
  ALTER TABLE "licenses_locales" DROP COLUMN "subscription_preview_loading_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "billing_title";
  ALTER TABLE "licenses_locales" DROP COLUMN "billing_description";
  ALTER TABLE "licenses_locales" DROP COLUMN "billing_period_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "billing_current_period_end_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "billing_pending_change_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "cancel_title";
  ALTER TABLE "licenses_locales" DROP COLUMN "cancel_description";
  ALTER TABLE "licenses_locales" DROP COLUMN "cancel_confirm_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "cancel_pending_heading";
  ALTER TABLE "licenses_locales" DROP COLUMN "cancel_pending_description";
  ALTER TABLE "licenses_locales" DROP COLUMN "cancel_cancel_at_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "cancel_resume_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "upgrade_title";
  ALTER TABLE "licenses_locales" DROP COLUMN "upgrade_description";
  ALTER TABLE "licenses_locales" DROP COLUMN "upgrade_plan_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "upgrade_increase_only_note";
  DROP TYPE "public"."enum_subscription_config_plan_pro_color";
  DROP TYPE "public"."enum_subscription_config_plan_max_color";
  DROP TYPE "public"."enum_subscription_config_plan_custom_color";`)
}
