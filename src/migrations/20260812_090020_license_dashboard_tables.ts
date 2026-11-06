import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_empty_customers" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_recent_licenses" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_customer_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_email_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_last_edited_label" varchar;

        UPDATE "licenses_locales"
        SET
            "dashboard_empty_customers" = CASE WHEN "_locale" = 'de' THEN 'Noch keine Kunden' ELSE 'No customers yet' END,
            "dashboard_recent_licenses" = CASE WHEN "_locale" = 'de' THEN 'Zuletzt bearbeitete Lizenzen' ELSE 'Last edited licenses' END,
            "dashboard_customer_label" = CASE WHEN "_locale" = 'de' THEN 'Kunde' ELSE 'Customer' END,
            "dashboard_email_label" = CASE WHEN "_locale" = 'de' THEN 'E-Mail' ELSE 'Email' END,
            "dashboard_last_edited_label" = CASE WHEN "_locale" = 'de' THEN 'Zuletzt bearbeitet' ELSE 'Last edited' END;

        ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_empty_customers" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_recent_licenses" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_customer_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_email_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_last_edited_label" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_empty_customers";
        ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_recent_licenses";
        ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_customer_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_email_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_last_edited_label";
    `)
}
