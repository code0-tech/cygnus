import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales"
            ADD COLUMN "dashboard_recent_licenses_label" varchar,
            ADD COLUMN "dashboard_recent_licenses_description" varchar;

        UPDATE "licenses_locales" SET
            "dashboard_recent_licenses_label" = CASE WHEN "_locale" = 'de' THEN 'Zuletzt bearbeitete Lizenzen' ELSE 'Recently edited licenses' END,
            "dashboard_recent_licenses_description" = CASE WHEN "_locale" = 'de'
                THEN 'Die fünf zuletzt geänderten Lizenzen aller Kunden.'
                ELSE 'The five licenses changed most recently across all customers.' END;

        ALTER TABLE "licenses_locales"
            ALTER COLUMN "dashboard_recent_licenses_label" SET NOT NULL,
            ALTER COLUMN "dashboard_recent_licenses_description" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales"
            DROP COLUMN "dashboard_recent_licenses_label",
            DROP COLUMN "dashboard_recent_licenses_description";
    `)
}
