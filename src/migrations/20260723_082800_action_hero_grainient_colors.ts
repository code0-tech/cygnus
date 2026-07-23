import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
      ALTER TABLE "pages_blocks_action_hero"
        ADD COLUMN IF NOT EXISTS "grainient_colors_color1" varchar DEFAULT '#72f896',
        ADD COLUMN IF NOT EXISTS "grainient_colors_color2" varchar DEFAULT '#7472f8',
        ADD COLUMN IF NOT EXISTS "grainient_colors_color3" varchar DEFAULT '#13102d',
        ADD COLUMN IF NOT EXISTS "grainient_colors_background_color" varchar DEFAULT '#13102d';
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
      ALTER TABLE "pages_blocks_action_hero"
        DROP COLUMN IF EXISTS "grainient_colors_background_color",
        DROP COLUMN IF EXISTS "grainient_colors_color3",
        DROP COLUMN IF EXISTS "grainient_colors_color2",
        DROP COLUMN IF EXISTS "grainient_colors_color1";
    `)
}
