import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_bento" ADD COLUMN IF NOT EXISTS "section_layout" varchar DEFAULT 'center';
    ALTER TABLE "pages_blocks_card_row" ADD COLUMN IF NOT EXISTS "section_layout" varchar DEFAULT 'center';
    ALTER TABLE "pages_blocks_faq" ADD COLUMN IF NOT EXISTS "section_layout" varchar DEFAULT 'center';
    ALTER TABLE "pages_blocks_offset_cards" ADD COLUMN IF NOT EXISTS "section_layout" varchar DEFAULT 'center';
    ALTER TABLE "pages_blocks_roadmap" ADD COLUMN IF NOT EXISTS "section_layout" varchar DEFAULT 'center';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_roadmap" DROP COLUMN IF EXISTS "section_layout";
    ALTER TABLE "pages_blocks_offset_cards" DROP COLUMN IF EXISTS "section_layout";
    ALTER TABLE "pages_blocks_faq" DROP COLUMN IF EXISTS "section_layout";
    ALTER TABLE "pages_blocks_card_row" DROP COLUMN IF EXISTS "section_layout";
    ALTER TABLE "pages_blocks_bento" DROP COLUMN IF EXISTS "section_layout";
  `)
}
