import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
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

        ALTER TABLE "errors_locales" ADD CONSTRAINT "errors_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."errors"("id") ON DELETE cascade ON UPDATE no action;
        CREATE UNIQUE INDEX "errors_locales_locale_parent_id_unique" ON "errors_locales" USING btree ("_locale","_parent_id");

        ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_name_label" varchar;
        UPDATE "licenses_locales" SET "dashboard_name_label" = CASE WHEN "_locale" = 'de' THEN 'Name' ELSE 'Name' END;
        ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_name_label" SET NOT NULL;

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
        ALTER TABLE "licenses_locales" DROP COLUMN "editor_payment_method_setup_error";
        ALTER TABLE "licenses_locales" DROP COLUMN "editor_license_error";
        ALTER TABLE "licenses_locales" DROP COLUMN "subscription_preview_error";
        ALTER TABLE "licenses_locales" DROP COLUMN "billing_update_error";
        ALTER TABLE "licenses_locales" DROP COLUMN "cancel_cancel_error";
        ALTER TABLE "licenses_locales" DROP COLUMN "cancel_resume_error";
        ALTER TABLE "licenses_locales" DROP COLUMN "upgrade_update_error";

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
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "checkout_locales" ADD COLUMN "form_payment_error_fallback" varchar;
        ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_session_unavailable" varchar;
        ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_customer_creation" varchar;
        ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_customer_type_mismatch" varchar;
        ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_checkout_customer" varchar;
        ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_checkout_session" varchar;
        ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_checkout_session_expired" varchar;
        ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_billing_address_update" varchar;
        ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_email_update" varchar;
        ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_tax_id_update" varchar;
        ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_tax_id_incomplete" varchar;
        ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_payment_confirmation" varchar;
        ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_discount_session_required" varchar;
        ALTER TABLE "checkout_locales" ADD COLUMN "form_errors_discount_validation" varchar;
        ALTER TABLE "checkout_locales" ADD COLUMN "success_license_status_error" varchar;

        UPDATE "checkout_locales" SET
            "form_payment_error_fallback" = 'An unexpected error occurred.',
            "form_errors_session_unavailable" = 'Your checkout session could not be authenticated. Please try again.',
            "form_errors_customer_creation" = 'Your billing customer could not be prepared. Please try again.',
            "form_errors_customer_type_mismatch" = 'Your existing customer type does not match this checkout configuration.',
            "form_errors_checkout_customer" = 'The selected billing customer cannot be used for this checkout.',
            "form_errors_checkout_session" = 'The checkout session could not be created. Please try again.',
            "form_errors_checkout_session_expired" = 'The checkout session expired. A new session is being created.',
            "form_errors_billing_address_update" = 'The billing address could not be saved. Please check your details.',
            "form_errors_email_update" = 'The email address could not be saved. Please check your details.',
            "form_errors_tax_id_update" = 'The tax ID could not be saved. Please check your details.',
            "form_errors_tax_id_incomplete" = 'Tax ID type and Tax ID must be provided together.',
            "form_errors_payment_confirmation" = 'The payment could not be confirmed. Please check your payment details.',
            "form_errors_discount_session_required" = 'A checkout session is required to validate a discount.',
            "form_errors_discount_validation" = 'The discount code could not be validated.',
            "success_license_status_error" = 'We could not check whether your license is ready.';

        ALTER TABLE "checkout_locales" ALTER COLUMN "form_payment_error_fallback" SET NOT NULL;
        ALTER TABLE "checkout_locales" ALTER COLUMN "form_errors_session_unavailable" SET NOT NULL;
        ALTER TABLE "checkout_locales" ALTER COLUMN "form_errors_customer_creation" SET NOT NULL;
        ALTER TABLE "checkout_locales" ALTER COLUMN "form_errors_customer_type_mismatch" SET NOT NULL;
        ALTER TABLE "checkout_locales" ALTER COLUMN "form_errors_checkout_customer" SET NOT NULL;
        ALTER TABLE "checkout_locales" ALTER COLUMN "form_errors_checkout_session" SET NOT NULL;
        ALTER TABLE "checkout_locales" ALTER COLUMN "form_errors_checkout_session_expired" SET NOT NULL;
        ALTER TABLE "checkout_locales" ALTER COLUMN "form_errors_billing_address_update" SET NOT NULL;
        ALTER TABLE "checkout_locales" ALTER COLUMN "form_errors_email_update" SET NOT NULL;
        ALTER TABLE "checkout_locales" ALTER COLUMN "form_errors_tax_id_update" SET NOT NULL;
        ALTER TABLE "checkout_locales" ALTER COLUMN "form_errors_tax_id_incomplete" SET NOT NULL;
        ALTER TABLE "checkout_locales" ALTER COLUMN "form_errors_payment_confirmation" SET NOT NULL;
        ALTER TABLE "checkout_locales" ALTER COLUMN "form_errors_discount_session_required" SET NOT NULL;
        ALTER TABLE "checkout_locales" ALTER COLUMN "form_errors_discount_validation" SET NOT NULL;
        ALTER TABLE "checkout_locales" ALTER COLUMN "success_license_status_error" SET NOT NULL;

        ALTER TABLE "licenses_locales" ADD COLUMN "errors_dashboard_load" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "errors_retry" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_billing_address_heading" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_name_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_phone_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_address_line1_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_address_line2_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_city_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_state_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_postal_code_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_country_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_customer_error" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_payment_method_setup_error" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_license_error" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "subscription_preview_error" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "billing_update_error" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "cancel_cancel_error" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "cancel_resume_error" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "upgrade_update_error" varchar;

        UPDATE "licenses_locales" SET
            "errors_dashboard_load" = CASE WHEN "_locale" = 'de' THEN 'Das Lizenz-Dashboard konnte nicht geladen werden.' ELSE 'The license dashboard could not be loaded.' END,
            "errors_retry" = CASE WHEN "_locale" = 'de' THEN 'Erneut versuchen' ELSE 'Try again' END,
            "editor_billing_address_heading" = CASE WHEN "_locale" = 'de' THEN 'Rechnungsadresse' ELSE 'Billing address' END,
            "editor_name_label" = CASE WHEN "_locale" = 'de' THEN 'Name' ELSE 'Name' END,
            "editor_phone_label" = CASE WHEN "_locale" = 'de' THEN 'Telefon' ELSE 'Phone' END,
            "editor_address_line1_label" = CASE WHEN "_locale" = 'de' THEN 'Adresszeile 1' ELSE 'Address line 1' END,
            "editor_address_line2_label" = CASE WHEN "_locale" = 'de' THEN 'Adresszeile 2' ELSE 'Address line 2' END,
            "editor_city_label" = CASE WHEN "_locale" = 'de' THEN 'Stadt' ELSE 'City' END,
            "editor_state_label" = CASE WHEN "_locale" = 'de' THEN 'Bundesland' ELSE 'State' END,
            "editor_postal_code_label" = CASE WHEN "_locale" = 'de' THEN 'Postleitzahl' ELSE 'Postal code' END,
            "editor_country_label" = CASE WHEN "_locale" = 'de' THEN 'Ländercode' ELSE 'Country code' END,
            "editor_customer_error" = CASE WHEN "_locale" = 'de' THEN 'Der Kunde konnte nicht aktualisiert werden.' ELSE 'The customer could not be updated.' END,
            "editor_payment_method_setup_error" = CASE WHEN "_locale" = 'de' THEN 'Die Zahlungsmethode konnte nicht aktualisiert werden.' ELSE 'The payment method could not be updated.' END,
            "editor_license_error" = CASE WHEN "_locale" = 'de' THEN 'Die Lizenz konnte nicht aktualisiert werden.' ELSE 'The license could not be updated.' END,
            "subscription_preview_error" = CASE WHEN "_locale" = 'de' THEN 'Die Änderung konnte nicht vorausberechnet werden.' ELSE 'The change could not be previewed.' END,
            "billing_update_error" = CASE WHEN "_locale" = 'de' THEN 'Das Abrechnungsintervall konnte nicht aktualisiert werden.' ELSE 'The billing period could not be updated.' END,
            "cancel_cancel_error" = CASE WHEN "_locale" = 'de' THEN 'Das Abonnement konnte nicht gekündigt werden.' ELSE 'The subscription could not be cancelled.' END,
            "cancel_resume_error" = CASE WHEN "_locale" = 'de' THEN 'Die Kündigung konnte nicht zurückgenommen werden.' ELSE 'The cancellation could not be reversed.' END,
            "upgrade_update_error" = CASE WHEN "_locale" = 'de' THEN 'Der Plan konnte nicht aktualisiert werden.' ELSE 'The plan could not be upgraded.' END;

        ALTER TABLE "licenses_locales" ALTER COLUMN "errors_dashboard_load" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "errors_retry" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_billing_address_heading" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_name_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_phone_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_address_line1_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_address_line2_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_city_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_state_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_postal_code_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_country_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_customer_error" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_payment_method_setup_error" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_license_error" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "subscription_preview_error" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "billing_update_error" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "cancel_cancel_error" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "cancel_resume_error" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "upgrade_update_error" SET NOT NULL;

        ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_name_label";

        DROP TABLE "errors_locales" CASCADE;
        DROP TABLE "errors" CASCADE;
    `)
}
