import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales"
            ADD COLUMN "sidebar_download_license_label" varchar;

        UPDATE "licenses_locales" SET
            "sidebar_download_license_label" = CASE WHEN "_locale" = 'de' THEN 'Lizenz herunterladen' ELSE 'Download license' END;

        ALTER TABLE "licenses_locales"
            ALTER COLUMN "sidebar_download_license_label" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales"
            DROP COLUMN "sidebar_download_license_label";
    `)
}
