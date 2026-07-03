import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_offset_cards_card_placement" AS ENUM('alternate', 'right', 'left');
  ALTER TABLE "pages_blocks_offset_cards" ADD COLUMN "card_placement" "enum_pages_blocks_offset_cards_card_placement" DEFAULT 'alternate' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_offset_cards" DROP COLUMN "card_placement";
  DROP TYPE "public"."enum_pages_blocks_offset_cards_card_placement";`)
}
