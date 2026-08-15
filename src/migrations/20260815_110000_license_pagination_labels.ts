import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales" ADD COLUMN "pagination_load_more_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "pagination_loading_label" varchar;

        UPDATE "licenses_locales" SET
            "pagination_load_more_label" = CASE WHEN "_locale" = 'de' THEN 'Mehr laden' ELSE 'Load more' END,
            "pagination_loading_label" = CASE WHEN "_locale" = 'de' THEN 'Wird geladen …' ELSE 'Loading…' END;

        ALTER TABLE "licenses_locales" ALTER COLUMN "pagination_load_more_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "pagination_loading_label" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales" DROP COLUMN "pagination_load_more_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "pagination_loading_label";
    `)
}
