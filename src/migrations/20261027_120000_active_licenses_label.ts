import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales"
            ADD COLUMN "dashboard_active_licenses_label" varchar;

        UPDATE "licenses_locales" SET
            "dashboard_active_licenses_label" = CASE WHEN "_locale" = 'de' THEN 'Aktive Lizenzen' ELSE 'Active licenses' END;

        ALTER TABLE "licenses_locales"
            ALTER COLUMN "dashboard_active_licenses_label" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales"
            DROP COLUMN "dashboard_active_licenses_label";
    `)
}
