import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales" ADD COLUMN "licenses" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "empty_licenses" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "sidebar_logout" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "sidebar_logging_out" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_description" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_empty_description" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_invoices" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_payment_profiles" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_customers" varchar;

        UPDATE "licenses_locales"
        SET
            "licenses" = CASE WHEN "_locale" = 'de' THEN 'Lizenzen' ELSE 'Licenses' END,
            "empty_licenses" = CASE WHEN "_locale" = 'de' THEN 'Noch keine Lizenzen' ELSE 'No licenses yet' END,
            "sidebar_logout" = CASE WHEN "_locale" = 'de' THEN 'Abmelden' ELSE 'Log out' END,
            "sidebar_logging_out" = CASE WHEN "_locale" = 'de' THEN 'Wird abgemeldet …' ELSE 'Logging out…' END,
            "dashboard_description" = CASE WHEN "_locale" = 'de' THEN 'Verwalte deine Lizenzen.' ELSE 'Manage your licenses.' END,
            "dashboard_empty_description" = CASE
                WHEN "_locale" = 'de' THEN 'Sobald eine Lizenz vorhanden ist, erscheint sie hier.'
                ELSE 'Licenses will appear here as soon as they are available.'
            END,
            "dashboard_invoices" = CASE WHEN "_locale" = 'de' THEN 'Rechnungen' ELSE 'Invoices' END,
            "dashboard_payment_profiles" = CASE WHEN "_locale" = 'de' THEN 'Zahlungsprofile' ELSE 'Payment Profiles' END,
            "dashboard_customers" = CASE WHEN "_locale" = 'de' THEN 'Kunden' ELSE 'Customers' END;

        ALTER TABLE "licenses_locales" ALTER COLUMN "licenses" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "empty_licenses" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "sidebar_logout" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "sidebar_logging_out" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_description" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_empty_description" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_invoices" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_payment_profiles" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_customers" SET NOT NULL;

        ALTER TABLE "licenses_locales" DROP COLUMN "cards_licenses";
        ALTER TABLE "licenses_locales" DROP COLUMN "cards_subscriptions";
        ALTER TABLE "licenses_locales" DROP COLUMN "cards_payment_profiles";
        ALTER TABLE "licenses_locales" DROP COLUMN "cards_invoices";
        ALTER TABLE "licenses" DROP COLUMN "title";
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses" ADD COLUMN "title" varchar DEFAULT 'License Collection' NOT NULL;
        ALTER TABLE "licenses_locales" ADD COLUMN "cards_licenses" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "cards_subscriptions" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "cards_payment_profiles" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "cards_invoices" varchar;

        UPDATE "licenses_locales"
        SET
            "cards_licenses" = "licenses",
            "cards_payment_profiles" = "dashboard_payment_profiles",
            "cards_invoices" = "dashboard_invoices";

        ALTER TABLE "licenses_locales" DROP COLUMN "licenses";
        ALTER TABLE "licenses_locales" DROP COLUMN "empty_licenses";
        ALTER TABLE "licenses_locales" DROP COLUMN "sidebar_logout";
        ALTER TABLE "licenses_locales" DROP COLUMN "sidebar_logging_out";
        ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_description";
        ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_empty_description";
        ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_invoices";
        ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_payment_profiles";
        ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_customers";
    `)
}
