import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" ALTER COLUMN "navigation_back_label" SET DEFAULT 'Back';
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_eyebrow" SET DEFAULT 'Order Summary';
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_heading" SET DEFAULT 'Review your configuration';
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_description" SET DEFAULT 'This checkout reflects the subscription shape you configured, including runtime and optional add-ons.';
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_deployment_label" SET DEFAULT 'Deployment';
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_customer_type_label" SET DEFAULT 'Customer Type';
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_workflow_executions_label" SET DEFAULT 'Workflow Executions';
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_additional_features_label" SET DEFAULT 'Additional Features';
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_additional_features_description" SET DEFAULT 'Selected add-ons that extend the base subscription.';
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_pricing_label" SET DEFAULT 'Pricing';
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_pricing_description" SET DEFAULT 'Monthly breakdown based on your current setup.';
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_pricing_base_label" SET DEFAULT 'AI Tokens';
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_pricing_workflow_executions_label" SET DEFAULT 'Workflow Executions';
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_pricing_additional_features_label" SET DEFAULT 'Additional Features';
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_pricing_total_label" SET DEFAULT 'Total';
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_pricing_per_month_suffix" SET DEFAULT '/mo';
  ALTER TABLE "checkout_locales" ALTER COLUMN "form_billing_heading" SET DEFAULT 'Billing Address';
  ALTER TABLE "checkout_locales" ALTER COLUMN "form_payment_heading" SET DEFAULT 'Payment Details';
  ALTER TABLE "checkout_locales" ALTER COLUMN "form_continue_label" SET DEFAULT 'Continue to Payment';
  ALTER TABLE "checkout_locales" ALTER COLUMN "form_back_to_billing_label" SET DEFAULT 'Back to Billing';
  ALTER TABLE "checkout_locales" ALTER COLUMN "form_pay_now_label" SET DEFAULT 'Pay now';
  ALTER TABLE "checkout_locales" ALTER COLUMN "form_processing_label" SET DEFAULT 'Processing...';
  ALTER TABLE "checkout_locales" ALTER COLUMN "form_payment_error_fallback" SET DEFAULT 'An unexpected error occurred.';
  ALTER TABLE "checkout_locales" ALTER COLUMN "success_heading" SET DEFAULT 'Payment submitted';
  ALTER TABLE "checkout_locales" ALTER COLUMN "success_description" SET DEFAULT 'Stripe has received your payment confirmation. You can close this page or return to the site.';
  ALTER TABLE "checkout_locales" ALTER COLUMN "success_back_to_homepage_label" SET DEFAULT 'Return to homepage';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" ALTER COLUMN "navigation_back_label" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_eyebrow" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_heading" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_description" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_deployment_label" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_customer_type_label" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_workflow_executions_label" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_additional_features_label" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_additional_features_description" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_pricing_label" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_pricing_description" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_pricing_base_label" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_pricing_workflow_executions_label" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_pricing_additional_features_label" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_pricing_total_label" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "summary_pricing_per_month_suffix" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "form_billing_heading" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "form_payment_heading" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "form_continue_label" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "form_back_to_billing_label" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "form_pay_now_label" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "form_processing_label" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "form_payment_error_fallback" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "success_heading" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "success_description" DROP DEFAULT;
  ALTER TABLE "checkout_locales" ALTER COLUMN "success_back_to_homepage_label" DROP DEFAULT;`)
}
