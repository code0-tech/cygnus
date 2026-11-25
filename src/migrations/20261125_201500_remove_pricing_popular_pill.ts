import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "pages_blocks_pricing"
            DROP COLUMN IF EXISTS "popular_pill_icon",
            DROP COLUMN IF EXISTS "popular_pill_text",
            DROP COLUMN IF EXISTS "popular_pill_color";
        DROP TYPE IF EXISTS "public"."enum_pages_blocks_pricing_popular_pill_color";
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        CREATE TYPE "public"."enum_pages_blocks_pricing_popular_pill_color" AS ENUM ('brand', 'pink', 'yellow', 'aqua', 'blue', 'lime', 'magenta');
        ALTER TABLE "pages_blocks_pricing"
            ADD COLUMN "popular_pill_icon" varchar DEFAULT 'tabler:IconSparkles',
            ADD COLUMN "popular_pill_text" varchar DEFAULT 'Popular',
            ADD COLUMN "popular_pill_color" "public"."enum_pages_blocks_pricing_popular_pill_color" DEFAULT 'brand';
    `)
}
