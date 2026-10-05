import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales" ADD COLUMN "sidebar_refresh" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "sidebar_refreshing" varchar;

        UPDATE "licenses_locales" SET
            "sidebar_refresh" = CASE WHEN "_locale" = 'de' THEN 'Lizenzen aktualisieren' ELSE 'Refresh licenses' END,
            "sidebar_refreshing" = CASE WHEN "_locale" = 'de' THEN 'Lizenzen werden aktualisiert …' ELSE 'Refreshing licenses…' END;

        ALTER TABLE "licenses_locales" ALTER COLUMN "sidebar_refresh" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "sidebar_refreshing" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales" DROP COLUMN "sidebar_refresh";
        ALTER TABLE "licenses_locales" DROP COLUMN "sidebar_refreshing";
    `)
}
