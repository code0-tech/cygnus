import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "pages_blocks_stats_items" ADD COLUMN IF NOT EXISTS "suffix" varchar;
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM "information_schema"."columns"
                WHERE "table_schema" = 'public'
                  AND "table_name" = 'pages_blocks_stats_items'
                  AND "column_name" = 'show_plus'
            ) THEN
                EXECUTE 'UPDATE "pages_blocks_stats_items" SET "suffix" = ''+'' WHERE "show_plus" = true';
            END IF;
        END
        $$;
        ALTER TABLE "pages_blocks_stats_items" DROP COLUMN IF EXISTS "show_plus";
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "pages_blocks_stats_items" ADD COLUMN IF NOT EXISTS "show_plus" boolean DEFAULT false;
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM "information_schema"."columns"
                WHERE "table_schema" = 'public'
                  AND "table_name" = 'pages_blocks_stats_items'
                  AND "column_name" = 'suffix'
            ) THEN
                EXECUTE 'UPDATE "pages_blocks_stats_items" SET "show_plus" = true WHERE "suffix" = ''+''';
            END IF;
        END
        $$;
        ALTER TABLE "pages_blocks_stats_items" DROP COLUMN IF EXISTS "suffix";
    `)
}
