import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
      ALTER TABLE "pages_blocks_action_hero"
        ADD COLUMN IF NOT EXISTS "block_name" varchar;
      ALTER TABLE "pages_blocks_action_details"
        ADD COLUMN IF NOT EXISTS "block_name" varchar;
      ALTER TABLE "pages_blocks_action_references"
        ADD COLUMN IF NOT EXISTS "block_name" varchar;
      ALTER TABLE "pages_blocks_action_list"
        ADD COLUMN IF NOT EXISTS "block_name" varchar;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
      ALTER TABLE "pages_blocks_action_list"
        DROP COLUMN IF EXISTS "block_name";
      ALTER TABLE "pages_blocks_action_references"
        DROP COLUMN IF EXISTS "block_name";
      ALTER TABLE "pages_blocks_action_details"
        DROP COLUMN IF EXISTS "block_name";
      ALTER TABLE "pages_blocks_action_hero"
        DROP COLUMN IF EXISTS "block_name";
    `)
}
