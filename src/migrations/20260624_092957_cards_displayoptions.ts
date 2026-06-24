import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_pages_blocks_scroll_cards_items_section_layout" ADD VALUE 'imageRightFullscreen';
  ALTER TYPE "public"."enum_pages_blocks_scroll_cards_items_section_layout" ADD VALUE 'imageLeftFullscreen';
  ALTER TYPE "public"."enum_pages_blocks_standalone_card_section_layout" ADD VALUE 'imageRightFullscreen';
  ALTER TYPE "public"."enum_pages_blocks_standalone_card_section_layout" ADD VALUE 'imageLeftFullscreen';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_scroll_cards_items" ALTER COLUMN "section_layout" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_scroll_cards_items" ALTER COLUMN "section_layout" SET DEFAULT 'imageRight'::text;
  DROP TYPE "public"."enum_pages_blocks_scroll_cards_items_section_layout";
  CREATE TYPE "public"."enum_pages_blocks_scroll_cards_items_section_layout" AS ENUM('imageRight', 'imageLeft', 'imageFullscreen');
  ALTER TABLE "pages_blocks_scroll_cards_items" ALTER COLUMN "section_layout" SET DEFAULT 'imageRight'::"public"."enum_pages_blocks_scroll_cards_items_section_layout";
  ALTER TABLE "pages_blocks_scroll_cards_items" ALTER COLUMN "section_layout" SET DATA TYPE "public"."enum_pages_blocks_scroll_cards_items_section_layout" USING "section_layout"::"public"."enum_pages_blocks_scroll_cards_items_section_layout";
  ALTER TABLE "pages_blocks_standalone_card" ALTER COLUMN "section_layout" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_standalone_card" ALTER COLUMN "section_layout" SET DEFAULT 'imageRight'::text;
  DROP TYPE "public"."enum_pages_blocks_standalone_card_section_layout";
  CREATE TYPE "public"."enum_pages_blocks_standalone_card_section_layout" AS ENUM('imageRight', 'imageLeft', 'imageFullscreen');
  ALTER TABLE "pages_blocks_standalone_card" ALTER COLUMN "section_layout" SET DEFAULT 'imageRight'::"public"."enum_pages_blocks_standalone_card_section_layout";
  ALTER TABLE "pages_blocks_standalone_card" ALTER COLUMN "section_layout" SET DATA TYPE "public"."enum_pages_blocks_standalone_card_section_layout" USING "section_layout"::"public"."enum_pages_blocks_standalone_card_section_layout";`)
}
