import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "enum_pages_blocks_action_details_section_layout" AS ENUM ('center', 'left');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN
        CREATE TYPE "enum_pages_blocks_action_list_section_layout" AS ENUM ('center', 'left');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN
        CREATE TYPE "enum_pages_blocks_action_references_section_layout" AS ENUM ('center', 'left');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      ALTER TABLE "pages_blocks_action_details"
        ADD COLUMN IF NOT EXISTS "section_layout" "enum_pages_blocks_action_details_section_layout" DEFAULT 'left',
        ADD COLUMN IF NOT EXISTS "section_link_button_label" varchar,
        ADD COLUMN IF NOT EXISTS "section_link_button_url" varchar;

      ALTER TABLE "pages_blocks_action_list"
        ADD COLUMN IF NOT EXISTS "section_layout" "enum_pages_blocks_action_list_section_layout" DEFAULT 'left',
        ADD COLUMN IF NOT EXISTS "section_link_button_label" varchar,
        ADD COLUMN IF NOT EXISTS "section_link_button_url" varchar;

      ALTER TABLE "pages_blocks_action_references"
        ADD COLUMN IF NOT EXISTS "section_heading" varchar DEFAULT 'References',
        ADD COLUMN IF NOT EXISTS "section_layout" "enum_pages_blocks_action_references_section_layout" DEFAULT 'left',
        ADD COLUMN IF NOT EXISTS "section_description" varchar,
        ADD COLUMN IF NOT EXISTS "section_link_button_label" varchar,
        ADD COLUMN IF NOT EXISTS "section_link_button_url" varchar;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
      ALTER TABLE "pages_blocks_action_references"
        DROP COLUMN IF EXISTS "section_heading",
        DROP COLUMN IF EXISTS "section_layout",
        DROP COLUMN IF EXISTS "section_description",
        DROP COLUMN IF EXISTS "section_link_button_label",
        DROP COLUMN IF EXISTS "section_link_button_url";
      ALTER TABLE "pages_blocks_action_list"
        DROP COLUMN IF EXISTS "section_layout",
        DROP COLUMN IF EXISTS "section_link_button_label",
        DROP COLUMN IF EXISTS "section_link_button_url";
      ALTER TABLE "pages_blocks_action_details"
        DROP COLUMN IF EXISTS "section_layout",
        DROP COLUMN IF EXISTS "section_link_button_label",
        DROP COLUMN IF EXISTS "section_link_button_url";
      DROP TYPE IF EXISTS "enum_pages_blocks_action_references_section_layout";
      DROP TYPE IF EXISTS "enum_pages_blocks_action_list_section_layout";
      DROP TYPE IF EXISTS "enum_pages_blocks_action_details_section_layout";
    `)
}
