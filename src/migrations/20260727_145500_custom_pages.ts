import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "pages" ALTER COLUMN "slug" DROP NOT NULL;
        ALTER TABLE "pages" ADD COLUMN "custom_page" boolean DEFAULT false;
        ALTER TABLE "pages" ADD COLUMN "custom_slug" varchar;
        CREATE UNIQUE INDEX "pages_custom_slug_idx" ON "pages" USING btree ("custom_slug");
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM "pages" WHERE "custom_page" = true) THEN
                RAISE EXCEPTION 'Cannot roll back custom pages while custom page records exist.';
            END IF;
        END
        $$;

        DROP INDEX "public"."pages_custom_slug_idx";
        ALTER TABLE "pages" DROP COLUMN "custom_slug";
        ALTER TABLE "pages" DROP COLUMN "custom_page";
        ALTER TABLE "pages" ALTER COLUMN "slug" SET NOT NULL;
    `)
}
