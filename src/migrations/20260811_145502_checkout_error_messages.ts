import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_session_unavailable" varchar DEFAULT 'Your checkout session could not be authenticated. Please try again.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_customer_creation" varchar DEFAULT 'Your billing customer could not be prepared. Please try again.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_customer_type_mismatch" varchar DEFAULT 'Your existing customer type does not match this checkout configuration.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_checkout_session" varchar DEFAULT 'The checkout session could not be created. Please try again.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_checkout_session_expired" varchar DEFAULT 'The checkout session expired. A new session is being created.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_billing_address_update" varchar DEFAULT 'The billing address could not be saved. Please check your details.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_email_update" varchar DEFAULT 'The email address could not be saved. Please check your details.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_tax_id_update" varchar DEFAULT 'The tax ID could not be saved. Please check your details.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_tax_id_incomplete" varchar DEFAULT 'Tax ID type and Tax ID must be provided together.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_payment_confirmation" varchar DEFAULT 'The payment could not be confirmed. Please check your payment details.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_discount_session_required" varchar DEFAULT 'A checkout session is required to validate a discount.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_discount_validation" varchar DEFAULT 'The discount code could not be validated.' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_session_unavailable";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_customer_creation";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_customer_type_mismatch";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_checkout_session";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_checkout_session_expired";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_billing_address_update";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_email_update";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_tax_id_update";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_tax_id_incomplete";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_payment_confirmation";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_discount_session_required";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_errors_discount_validation";`)
}
