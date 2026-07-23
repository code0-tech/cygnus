import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
      ALTER TABLE "pages_blocks_action_details"
        ADD COLUMN IF NOT EXISTS "section_heading" varchar,
        ADD COLUMN IF NOT EXISTS "section_description" varchar;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
      ALTER TABLE "pages_blocks_action_details"
        DROP COLUMN IF EXISTS "section_heading",
        DROP COLUMN IF EXISTS "section_description";
    `)
}
