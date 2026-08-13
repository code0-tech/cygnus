import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_description";
        ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_empty_description";
        ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_invoices";
        ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_payment_profiles";
    `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_description" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_empty_description" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_invoices" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_payment_profiles" varchar;

        UPDATE "licenses_locales"
        SET
            "dashboard_description" = CASE WHEN "_locale" = 'de' THEN 'Verwalte deine Lizenzen.' ELSE 'Manage your licenses.' END,
            "dashboard_empty_description" = CASE
                WHEN "_locale" = 'de' THEN 'Sobald eine Lizenz vorhanden ist, erscheint sie hier.'
                ELSE 'Licenses will appear here as soon as they are available.'
            END,
            "dashboard_invoices" = CASE WHEN "_locale" = 'de' THEN 'Rechnungen' ELSE 'Invoices' END,
            "dashboard_payment_profiles" = CASE WHEN "_locale" = 'de' THEN 'Zahlungsprofile' ELSE 'Payment Profiles' END;

        ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_description" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_empty_description" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_invoices" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_payment_profiles" SET NOT NULL;
    `)
}
