import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres"

// Moves the dialog groups (editor, subscriptionPreview, billing, cancel, upgrade) into the new license-dialogs global:
// Payload reads every localized field of a global through one json_build_array call, which Postgres caps at 100 arguments.
// Existing texts are copied over; new fields get their localized defaults explicitly, since Payload only applies
// defaultValue when a document is created.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
  CREATE TABLE "license_dialogs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  CREATE TABLE "license_dialogs_locales" (
  	"editor_customer_title" varchar NOT NULL,
  	"editor_customer_description" varchar NOT NULL,
  	"editor_contact_heading" varchar NOT NULL,
  	"editor_payment_method_heading" varchar NOT NULL,
  	"editor_payment_method_description" varchar NOT NULL,
  	"editor_loading_payment_method_label" varchar NOT NULL,
  	"editor_save_payment_method_label" varchar NOT NULL,
  	"editor_saving_payment_method_label" varchar NOT NULL,
  	"editor_payment_method_success" varchar NOT NULL,
  	"editor_no_payment_methods_label" varchar NOT NULL,
  	"editor_add_payment_method_label" varchar NOT NULL,
  	"editor_remove_payment_method_label" varchar NOT NULL,
  	"editor_removing_payment_method_label" varchar NOT NULL,
  	"editor_other_payment_methods_heading" varchar NOT NULL,
  	"editor_use_payment_method_label" varchar NOT NULL,
  	"editor_setting_payment_method_label" varchar NOT NULL,
  	"editor_license_title" varchar NOT NULL,
  	"editor_license_edit_description" varchar NOT NULL,
  	"editor_license_description" varchar NOT NULL,
  	"editor_change_namespace_label" varchar NOT NULL,
  	"editor_save_label" varchar NOT NULL,
  	"editor_close_label" varchar NOT NULL,
  	"editor_general_tab_label" varchar NOT NULL,
  	"editor_payment_methods_tab_label" varchar NOT NULL,
  	"editor_payment_method_tab_label" varchar NOT NULL,
  	"editor_namespace_heading" varchar NOT NULL,
  	"editor_cancellation_heading" varchar NOT NULL,
  	"editor_field_descriptions_name" varchar NOT NULL,
  	"editor_field_descriptions_email" varchar NOT NULL,
  	"editor_field_descriptions_phone" varchar NOT NULL,
  	"editor_field_descriptions_line1" varchar NOT NULL,
  	"editor_field_descriptions_line2" varchar NOT NULL,
  	"editor_field_descriptions_postal_code" varchar NOT NULL,
  	"editor_field_descriptions_city" varchar NOT NULL,
  	"editor_field_descriptions_state" varchar NOT NULL,
  	"editor_field_descriptions_country" varchar NOT NULL,
  	"subscription_preview_total_label" varchar NOT NULL,
  	"subscription_preview_proration_label" varchar NOT NULL,
  	"subscription_preview_immediate_note" varchar NOT NULL,
  	"subscription_preview_scheduled_note" varchar NOT NULL,
  	"subscription_preview_loading_label" varchar NOT NULL,
  	"billing_title" varchar NOT NULL,
  	"billing_description" varchar NOT NULL,
  	"billing_period_label" varchar NOT NULL,
  	"billing_current_period_end_label" varchar NOT NULL,
  	"billing_change_period_label" varchar NOT NULL,
  	"cancel_description" varchar NOT NULL,
  	"cancel_confirm_label" varchar NOT NULL,
  	"cancel_pending_heading" varchar NOT NULL,
  	"cancel_pending_description" varchar NOT NULL,
  	"cancel_cancel_at_label" varchar NOT NULL,
  	"cancel_resume_label" varchar NOT NULL,
  	"upgrade_title" varchar NOT NULL,
  	"upgrade_description" varchar NOT NULL,
  	"upgrade_plan_heading" varchar NOT NULL,
  	"upgrade_preview_heading" varchar NOT NULL,
  	"upgrade_submit_label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  ALTER TABLE "license_dialogs_locales" ADD CONSTRAINT "license_dialogs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."license_dialogs"("id") ON DELETE cascade ON UPDATE no action;

  CREATE UNIQUE INDEX "license_dialogs_locales_locale_parent_id_unique" ON "license_dialogs_locales" USING btree ("_locale","_parent_id");

  -- Carry the existing global over to the new one, keeping its id so the locale rows can reuse _parent_id.
  INSERT INTO "license_dialogs" ("id", "updated_at", "created_at") SELECT "id", "updated_at", "created_at" FROM "licenses";
  SELECT setval(pg_get_serial_sequence('license_dialogs', 'id'), COALESCE(MAX("id"), 1), MAX("id") IS NOT NULL) FROM "license_dialogs";

  INSERT INTO "license_dialogs_locales" (
    "editor_customer_title",
    "editor_customer_description",
    "editor_contact_heading",
    "editor_payment_method_heading",
    "editor_payment_method_description",
    "editor_loading_payment_method_label",
    "editor_save_payment_method_label",
    "editor_saving_payment_method_label",
    "editor_payment_method_success",
    "editor_no_payment_methods_label",
    "editor_add_payment_method_label",
    "editor_remove_payment_method_label",
    "editor_removing_payment_method_label",
    "editor_other_payment_methods_heading",
    "editor_use_payment_method_label",
    "editor_setting_payment_method_label",
    "editor_license_title",
    "editor_license_edit_description",
    "editor_license_description",
    "editor_change_namespace_label",
    "editor_save_label",
    "editor_close_label",
    "subscription_preview_total_label",
    "subscription_preview_proration_label",
    "subscription_preview_immediate_note",
    "subscription_preview_scheduled_note",
    "subscription_preview_loading_label",
    "billing_title",
    "billing_description",
    "billing_period_label",
    "billing_current_period_end_label",
    "cancel_description",
    "cancel_confirm_label",
    "cancel_pending_heading",
    "cancel_pending_description",
    "cancel_cancel_at_label",
    "cancel_resume_label",
    "upgrade_title",
    "upgrade_description",
    "editor_general_tab_label",
    "editor_payment_methods_tab_label",
    "editor_payment_method_tab_label",
    "editor_namespace_heading",
    "editor_cancellation_heading",
    "editor_field_descriptions_name",
    "editor_field_descriptions_email",
    "editor_field_descriptions_phone",
    "editor_field_descriptions_line1",
    "editor_field_descriptions_line2",
    "editor_field_descriptions_postal_code",
    "editor_field_descriptions_city",
    "editor_field_descriptions_state",
    "editor_field_descriptions_country",
    "billing_change_period_label",
    "upgrade_plan_heading",
    "upgrade_preview_heading",
    "upgrade_submit_label",
    "_locale",
    "_parent_id"
  )
  SELECT
    "editor_customer_title",
    "editor_customer_description",
    "editor_contact_heading",
    "editor_payment_method_heading",
    "editor_payment_method_description",
    "editor_loading_payment_method_label",
    "editor_save_payment_method_label",
    "editor_saving_payment_method_label",
    "editor_payment_method_success",
    "editor_no_payment_methods_label",
    "editor_add_payment_method_label",
    "editor_remove_payment_method_label",
    "editor_removing_payment_method_label",
    "editor_other_payment_methods_heading",
    "editor_use_payment_method_label",
    "editor_setting_payment_method_label",
    "editor_license_title",
    "editor_license_edit_description",
    "editor_license_description",
    "editor_change_namespace_label",
    "editor_save_label",
    "editor_close_label",
    "subscription_preview_total_label",
    "subscription_preview_proration_label",
    "subscription_preview_immediate_note",
    "subscription_preview_scheduled_note",
    "subscription_preview_loading_label",
    "billing_title",
    "billing_description",
    "billing_period_label",
    "billing_current_period_end_label",
    "cancel_description",
    "cancel_confirm_label",
    "cancel_pending_heading",
    "cancel_pending_description",
    "cancel_cancel_at_label",
    "cancel_resume_label",
    "upgrade_title",
    "upgrade_description",
    CASE WHEN "_locale" = 'de' THEN 'Allgemein' ELSE 'General' END,
    CASE WHEN "_locale" = 'de' THEN 'Zahlungsmethoden' ELSE 'Payment methods' END,
    CASE WHEN "_locale" = 'de' THEN 'Zahlungsmethode' ELSE 'Payment method' END,
    CASE WHEN "_locale" = 'de' THEN 'Namespace' ELSE 'Namespace' END,
    CASE WHEN "_locale" = 'de' THEN 'Kündigung' ELSE 'Cancellation' END,
    CASE WHEN "_locale" = 'de' THEN 'Name der Person oder Firma, an die Rechnungen adressiert werden.' ELSE 'Name of the person or company invoices are addressed to.' END,
    CASE WHEN "_locale" = 'de' THEN 'Rechnungs-E-Mails werden an diese Adresse gesendet.' ELSE 'Invoice emails are sent to this address.' END,
    CASE WHEN "_locale" = 'de' THEN 'Optionale Telefonnummer für Rückfragen zur Abrechnung.' ELSE 'Optional phone number for billing questions.' END,
    CASE WHEN "_locale" = 'de' THEN 'Straße und Hausnummer.' ELSE 'Street and house number.' END,
    CASE WHEN "_locale" = 'de' THEN 'Adresszusatz wie Etage, Wohnung oder c/o.' ELSE 'Additional address details such as floor, suite or c/o.' END,
    CASE WHEN "_locale" = 'de' THEN 'Postleitzahl der Rechnungsadresse.' ELSE 'Postal code of the billing address.' END,
    CASE WHEN "_locale" = 'de' THEN 'Ort der Rechnungsadresse.' ELSE 'City of the billing address.' END,
    CASE WHEN "_locale" = 'de' THEN 'Bundesland, Provinz oder Region, falls zutreffend.' ELSE 'State, province or region, if applicable.' END,
    CASE WHEN "_locale" = 'de' THEN 'Zweistelliger ISO-Ländercode, z. B. DE.' ELSE 'Two-letter ISO country code, e.g. DE.' END,
    CASE WHEN "_locale" = 'de' THEN 'Zeitraum ändern' ELSE 'Change period' END,
    CASE WHEN "_locale" = 'de' THEN 'Plan' ELSE 'Plan' END,
    CASE WHEN "_locale" = 'de' THEN 'Vorschau' ELSE 'Preview' END,
    CASE WHEN "_locale" = 'de' THEN 'Jetzt upgraden' ELSE 'Upgrade now' END,
    "_locale",
    "_parent_id"
  FROM "licenses_locales";

  ALTER TABLE "licenses_locales" ADD COLUMN "sidebar_back_to_customer_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "sidebar_home_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "sidebar_application_settings_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "sidebar_user_settings_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "sidebar_user_menu_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "sidebar_profile_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "sidebar_settings_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "sidebar_workspaces_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_edition_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_next_billing_date_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "values_editions_cloud" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "values_editions_self_hosted" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "invoices_billing_date_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "invoices_view_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "pagination_previous_page_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "pagination_next_page_label" varchar;

  UPDATE "licenses_locales" SET
    "sidebar_back_to_customer_label" = CASE WHEN "_locale" = 'de' THEN 'Zurück zum Kunden' ELSE 'Back to customer' END,
    "sidebar_home_label" = CASE WHEN "_locale" = 'de' THEN 'Startseite' ELSE 'Home' END,
    "sidebar_application_settings_label" = CASE WHEN "_locale" = 'de' THEN 'Anwendungseinstellungen' ELSE 'Application settings' END,
    "sidebar_user_settings_label" = CASE WHEN "_locale" = 'de' THEN 'Benutzereinstellungen' ELSE 'User settings' END,
    "sidebar_user_menu_label" = CASE WHEN "_locale" = 'de' THEN 'Benutzermenü' ELSE 'User menu' END,
    "sidebar_profile_label" = CASE WHEN "_locale" = 'de' THEN 'Profil' ELSE 'Profile' END,
    "sidebar_settings_label" = CASE WHEN "_locale" = 'de' THEN 'Einstellungen' ELSE 'Settings' END,
    "sidebar_workspaces_label" = CASE WHEN "_locale" = 'de' THEN 'Workspaces' ELSE 'Workspaces' END,
    "dashboard_edition_label" = CASE WHEN "_locale" = 'de' THEN 'Edition' ELSE 'Edition' END,
    "dashboard_next_billing_date_label" = CASE WHEN "_locale" = 'de' THEN 'Nächste Abrechnung' ELSE 'Next billing date' END,
    "values_editions_cloud" = CASE WHEN "_locale" = 'de' THEN 'Cloud Edition' ELSE 'Cloud Edition' END,
    "values_editions_self_hosted" = CASE WHEN "_locale" = 'de' THEN 'Enterprise Edition' ELSE 'Enterprise Edition' END,
    "invoices_billing_date_label" = CASE WHEN "_locale" = 'de' THEN 'Rechnungsdatum' ELSE 'Billing date' END,
    "invoices_view_label" = CASE WHEN "_locale" = 'de' THEN 'Ansehen' ELSE 'View' END,
    "pagination_previous_page_label" = CASE WHEN "_locale" = 'de' THEN 'Vorherige Seite' ELSE 'Previous page' END,
    "pagination_next_page_label" = CASE WHEN "_locale" = 'de' THEN 'Nächste Seite' ELSE 'Next page' END;

  ALTER TABLE "licenses_locales" ALTER COLUMN "sidebar_back_to_customer_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "sidebar_home_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "sidebar_application_settings_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "sidebar_user_settings_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "sidebar_user_menu_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "sidebar_profile_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "sidebar_settings_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "sidebar_workspaces_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_edition_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_next_billing_date_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "values_editions_cloud" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "values_editions_self_hosted" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "invoices_billing_date_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "invoices_view_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "pagination_previous_page_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "pagination_next_page_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" DROP COLUMN "sidebar_dashboard";

  ALTER TABLE "licenses_locales" DROP COLUMN "sidebar_refresh";

  ALTER TABLE "licenses_locales" DROP COLUMN "sidebar_refreshing";

  ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_customers";

  ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_customers_description";

  ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_recent_licenses";

  ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_recent_licenses_description";

  ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_type_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_deployment_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "invoices_period_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "editor_customer_title";

  ALTER TABLE "licenses_locales" DROP COLUMN "editor_customer_description";

  ALTER TABLE "licenses_locales" DROP COLUMN "editor_contact_heading";

  ALTER TABLE "licenses_locales" DROP COLUMN "editor_payment_method_heading";

  ALTER TABLE "licenses_locales" DROP COLUMN "editor_payment_method_description";

  ALTER TABLE "licenses_locales" DROP COLUMN "editor_change_payment_method_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "editor_loading_payment_method_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "editor_save_payment_method_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "editor_saving_payment_method_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "editor_payment_method_success";

  ALTER TABLE "licenses_locales" DROP COLUMN "editor_no_payment_methods_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "editor_add_payment_method_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "editor_remove_payment_method_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "editor_removing_payment_method_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "editor_other_payment_methods_heading";

  ALTER TABLE "licenses_locales" DROP COLUMN "editor_use_payment_method_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "editor_setting_payment_method_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "editor_license_title";

  ALTER TABLE "licenses_locales" DROP COLUMN "editor_license_edit_description";

  ALTER TABLE "licenses_locales" DROP COLUMN "editor_license_description";

  ALTER TABLE "licenses_locales" DROP COLUMN "editor_change_namespace_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "editor_save_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "editor_close_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "subscription_preview_total_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "subscription_preview_proration_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "subscription_preview_immediate_note";

  ALTER TABLE "licenses_locales" DROP COLUMN "subscription_preview_scheduled_note";

  ALTER TABLE "licenses_locales" DROP COLUMN "subscription_preview_loading_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "billing_title";

  ALTER TABLE "licenses_locales" DROP COLUMN "billing_description";

  ALTER TABLE "licenses_locales" DROP COLUMN "billing_period_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "billing_current_period_end_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "cancel_description";

  ALTER TABLE "licenses_locales" DROP COLUMN "cancel_confirm_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "cancel_pending_heading";

  ALTER TABLE "licenses_locales" DROP COLUMN "cancel_pending_description";

  ALTER TABLE "licenses_locales" DROP COLUMN "cancel_cancel_at_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "cancel_resume_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "upgrade_title";

  ALTER TABLE "licenses_locales" DROP COLUMN "upgrade_description";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
  ALTER TABLE "licenses_locales" ADD COLUMN "sidebar_dashboard" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "sidebar_refresh" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "sidebar_refreshing" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_customers" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_customers_description" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_recent_licenses" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_recent_licenses_description" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_type_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_deployment_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "invoices_period_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "editor_customer_title" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "editor_customer_description" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "editor_contact_heading" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "editor_payment_method_heading" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "editor_payment_method_description" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "editor_change_payment_method_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "editor_loading_payment_method_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "editor_save_payment_method_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "editor_saving_payment_method_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "editor_payment_method_success" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "editor_no_payment_methods_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "editor_add_payment_method_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "editor_remove_payment_method_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "editor_removing_payment_method_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "editor_other_payment_methods_heading" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "editor_use_payment_method_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "editor_setting_payment_method_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "editor_license_title" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "editor_license_edit_description" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "editor_license_description" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "editor_change_namespace_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "editor_save_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "editor_close_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "subscription_preview_total_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "subscription_preview_proration_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "subscription_preview_immediate_note" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "subscription_preview_scheduled_note" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "subscription_preview_loading_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "billing_title" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "billing_description" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "billing_period_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "billing_current_period_end_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "cancel_description" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "cancel_confirm_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "cancel_pending_heading" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "cancel_pending_description" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "cancel_cancel_at_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "cancel_resume_label" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "upgrade_title" varchar;

  ALTER TABLE "licenses_locales" ADD COLUMN "upgrade_description" varchar;

  UPDATE "licenses_locales" AS "l" SET
    "editor_customer_title" = "d"."editor_customer_title",
    "editor_customer_description" = "d"."editor_customer_description",
    "editor_contact_heading" = "d"."editor_contact_heading",
    "editor_payment_method_heading" = "d"."editor_payment_method_heading",
    "editor_payment_method_description" = "d"."editor_payment_method_description",
    "editor_loading_payment_method_label" = "d"."editor_loading_payment_method_label",
    "editor_save_payment_method_label" = "d"."editor_save_payment_method_label",
    "editor_saving_payment_method_label" = "d"."editor_saving_payment_method_label",
    "editor_payment_method_success" = "d"."editor_payment_method_success",
    "editor_no_payment_methods_label" = "d"."editor_no_payment_methods_label",
    "editor_add_payment_method_label" = "d"."editor_add_payment_method_label",
    "editor_remove_payment_method_label" = "d"."editor_remove_payment_method_label",
    "editor_removing_payment_method_label" = "d"."editor_removing_payment_method_label",
    "editor_other_payment_methods_heading" = "d"."editor_other_payment_methods_heading",
    "editor_use_payment_method_label" = "d"."editor_use_payment_method_label",
    "editor_setting_payment_method_label" = "d"."editor_setting_payment_method_label",
    "editor_license_title" = "d"."editor_license_title",
    "editor_license_edit_description" = "d"."editor_license_edit_description",
    "editor_license_description" = "d"."editor_license_description",
    "editor_change_namespace_label" = "d"."editor_change_namespace_label",
    "editor_save_label" = "d"."editor_save_label",
    "editor_close_label" = "d"."editor_close_label",
    "subscription_preview_total_label" = "d"."subscription_preview_total_label",
    "subscription_preview_proration_label" = "d"."subscription_preview_proration_label",
    "subscription_preview_immediate_note" = "d"."subscription_preview_immediate_note",
    "subscription_preview_scheduled_note" = "d"."subscription_preview_scheduled_note",
    "subscription_preview_loading_label" = "d"."subscription_preview_loading_label",
    "billing_title" = "d"."billing_title",
    "billing_description" = "d"."billing_description",
    "billing_period_label" = "d"."billing_period_label",
    "billing_current_period_end_label" = "d"."billing_current_period_end_label",
    "cancel_description" = "d"."cancel_description",
    "cancel_confirm_label" = "d"."cancel_confirm_label",
    "cancel_pending_heading" = "d"."cancel_pending_heading",
    "cancel_pending_description" = "d"."cancel_pending_description",
    "cancel_cancel_at_label" = "d"."cancel_cancel_at_label",
    "cancel_resume_label" = "d"."cancel_resume_label",
    "upgrade_title" = "d"."upgrade_title",
    "upgrade_description" = "d"."upgrade_description"
  FROM "license_dialogs_locales" AS "d"
  WHERE "d"."_parent_id" = "l"."_parent_id" AND "d"."_locale" = "l"."_locale";

  UPDATE "licenses_locales" SET
    "sidebar_dashboard" = CASE WHEN "_locale" = 'de' THEN 'Dashboard' ELSE 'Dashboard' END,
    "sidebar_refresh" = CASE WHEN "_locale" = 'de' THEN 'Lizenzen aktualisieren' ELSE 'Refresh licenses' END,
    "sidebar_refreshing" = CASE WHEN "_locale" = 'de' THEN 'Lizenzen werden aktualisiert …' ELSE 'Refreshing licenses…' END,
    "dashboard_customers" = CASE WHEN "_locale" = 'de' THEN 'Kunden' ELSE 'Customers' END,
    "dashboard_customers_description" = CASE WHEN "_locale" = 'de' THEN 'Verwalte die Kunden, die mit deinen Lizenzen verknüpft sind.' ELSE 'Manage the customers connected to your licenses.' END,
    "dashboard_recent_licenses" = CASE WHEN "_locale" = 'de' THEN 'Zuletzt bearbeitete Lizenzen' ELSE 'Last edited licenses' END,
    "dashboard_recent_licenses_description" = CASE WHEN "_locale" = 'de' THEN 'Greife schnell auf die zuletzt bearbeiteten Lizenzen zu.' ELSE 'Quickly access the licenses that were edited most recently.' END,
    "dashboard_type_label" = CASE WHEN "_locale" = 'de' THEN 'Typ' ELSE 'Type' END,
    "dashboard_deployment_label" = CASE WHEN "_locale" = 'de' THEN 'Bereitstellung' ELSE 'Deployment' END,
    "invoices_period_label" = CASE WHEN "_locale" = 'de' THEN 'Abrechnungszeitraum' ELSE 'Billing period' END,
    "editor_change_payment_method_label" = CASE WHEN "_locale" = 'de' THEN 'Zahlungsmethode ändern' ELSE 'Change payment method' END;

  ALTER TABLE "licenses_locales" ALTER COLUMN "sidebar_dashboard" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "sidebar_refresh" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "sidebar_refreshing" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_customers" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_customers_description" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_recent_licenses" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_recent_licenses_description" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_type_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_deployment_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "invoices_period_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_customer_title" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_customer_description" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_contact_heading" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_payment_method_heading" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_payment_method_description" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_change_payment_method_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_loading_payment_method_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_save_payment_method_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_saving_payment_method_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_payment_method_success" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_no_payment_methods_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_add_payment_method_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_remove_payment_method_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_removing_payment_method_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_other_payment_methods_heading" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_use_payment_method_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_setting_payment_method_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_license_title" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_license_edit_description" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_license_description" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_change_namespace_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_save_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_close_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "subscription_preview_total_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "subscription_preview_proration_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "subscription_preview_immediate_note" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "subscription_preview_scheduled_note" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "subscription_preview_loading_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "billing_title" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "billing_description" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "billing_period_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "billing_current_period_end_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "cancel_description" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "cancel_confirm_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "cancel_pending_heading" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "cancel_pending_description" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "cancel_cancel_at_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "cancel_resume_label" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "upgrade_title" SET NOT NULL;

  ALTER TABLE "licenses_locales" ALTER COLUMN "upgrade_description" SET NOT NULL;

  ALTER TABLE "licenses_locales" DROP COLUMN "sidebar_back_to_customer_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "sidebar_home_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "sidebar_application_settings_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "sidebar_user_settings_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "sidebar_user_menu_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "sidebar_profile_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "sidebar_settings_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "sidebar_workspaces_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_edition_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_next_billing_date_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "values_editions_cloud";

  ALTER TABLE "licenses_locales" DROP COLUMN "values_editions_self_hosted";

  ALTER TABLE "licenses_locales" DROP COLUMN "invoices_billing_date_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "invoices_view_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "pagination_previous_page_label";

  ALTER TABLE "licenses_locales" DROP COLUMN "pagination_next_page_label";

  DROP TABLE "license_dialogs_locales" CASCADE;

  DROP TABLE "license_dialogs" CASCADE;`)
}
