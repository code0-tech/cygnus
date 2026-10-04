import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_offset_cards_cards_media_type" AS ENUM('image', 'playground');
  CREATE TYPE "public"."enum_pages_blocks_swipe_cards_cards_media_type" AS ENUM('image', 'playground');
  CREATE TYPE "public"."enum_pages_blocks_cta_image_media_type" AS ENUM('image', 'playground');
  CREATE TYPE "public"."enum_pages_blocks_card_row_cards_media_type" AS ENUM('image', 'playground');
  CREATE TYPE "public"."enum_pages_blocks_scroll_cards_items_media_type" AS ENUM('image', 'playground');
  CREATE TYPE "public"."enum_pages_blocks_standalone_card_media_type" AS ENUM('image', 'playground');
  DROP TABLE "pages_blocks_flow_example_flow_items_segments" CASCADE;
  DROP TABLE "pages_blocks_flow_example_flow_items" CASCADE;
  ALTER TABLE "pages_blocks_offset_cards_cards" ADD COLUMN "media_type" "enum_pages_blocks_offset_cards_cards_media_type" DEFAULT 'image' NOT NULL;
  ALTER TABLE "pages_blocks_offset_cards_cards" ADD COLUMN "playground_url" varchar;
  ALTER TABLE "pages_blocks_swipe_cards_cards" ADD COLUMN "media_type" "enum_pages_blocks_swipe_cards_cards_media_type" DEFAULT 'image' NOT NULL;
  ALTER TABLE "pages_blocks_swipe_cards_cards" ADD COLUMN "playground_url" varchar;
  ALTER TABLE "pages_blocks_cta_image" ADD COLUMN "media_type" "enum_pages_blocks_cta_image_media_type" DEFAULT 'image' NOT NULL;
  ALTER TABLE "pages_blocks_cta_image" ADD COLUMN "playground_url" varchar;
  ALTER TABLE "pages_blocks_card_row_cards" ADD COLUMN "media_type" "enum_pages_blocks_card_row_cards_media_type" DEFAULT 'image' NOT NULL;
  ALTER TABLE "pages_blocks_card_row_cards" ADD COLUMN "playground_url" varchar;
  ALTER TABLE "pages_blocks_scroll_cards_items" ADD COLUMN "media_type" "enum_pages_blocks_scroll_cards_items_media_type" DEFAULT 'image' NOT NULL;
  ALTER TABLE "pages_blocks_scroll_cards_items" ADD COLUMN "playground_url" varchar;
  ALTER TABLE "pages_blocks_standalone_card" ADD COLUMN "media_type" "enum_pages_blocks_standalone_card_media_type" DEFAULT 'image' NOT NULL;
  ALTER TABLE "pages_blocks_standalone_card" ADD COLUMN "playground_url" varchar;
  ALTER TABLE "pages_blocks_flow_example" ADD COLUMN "playground_url" varchar;
  ALTER TABLE "pages_blocks_flow_example" DROP COLUMN "flow_trigger_icon";
  ALTER TABLE "pages_blocks_flow_example" DROP COLUMN "flow_trigger_name";
  DROP TYPE "public"."enum_pages_blocks_flow_example_flow_items_segments_type";
  DROP TYPE "public"."enum_pages_blocks_flow_example_flow_items_color";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_flow_example_flow_items_segments_type" AS ENUM('text', 'literal', 'reference', 'node');
  CREATE TYPE "public"."enum_pages_blocks_flow_example_flow_items_color" AS ENUM('brand', 'yellow', 'aqua', 'blue', 'pink', 'lime', 'magenta');
  CREATE TABLE "pages_blocks_flow_example_flow_items_segments" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_pages_blocks_flow_example_flow_items_segments_type" DEFAULT 'text' NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_flow_example_flow_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" varchar NOT NULL,
  	"color" "enum_pages_blocks_flow_example_flow_items_color" DEFAULT 'brand' NOT NULL,
  	"outline" boolean DEFAULT true
  );
  
  ALTER TABLE "pages_blocks_flow_example" ADD COLUMN "flow_trigger_icon" varchar DEFAULT 'activity' NOT NULL;
  ALTER TABLE "pages_blocks_flow_example" ADD COLUMN "flow_trigger_name" varchar DEFAULT 'Flow trigger' NOT NULL;
  ALTER TABLE "pages_blocks_flow_example_flow_items_segments" ADD CONSTRAINT "pages_blocks_flow_example_flow_items_segments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_flow_example_flow_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_flow_example_flow_items" ADD CONSTRAINT "pages_blocks_flow_example_flow_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_flow_example"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_flow_example_flow_items_segments_order_idx" ON "pages_blocks_flow_example_flow_items_segments" USING btree ("_order");
  CREATE INDEX "pages_blocks_flow_example_flow_items_segments_parent_id_idx" ON "pages_blocks_flow_example_flow_items_segments" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_flow_example_flow_items_segments_locale_idx" ON "pages_blocks_flow_example_flow_items_segments" USING btree ("_locale");
  CREATE INDEX "pages_blocks_flow_example_flow_items_order_idx" ON "pages_blocks_flow_example_flow_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_flow_example_flow_items_parent_id_idx" ON "pages_blocks_flow_example_flow_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_flow_example_flow_items_locale_idx" ON "pages_blocks_flow_example_flow_items" USING btree ("_locale");
  ALTER TABLE "pages_blocks_offset_cards_cards" DROP COLUMN "media_type";
  ALTER TABLE "pages_blocks_offset_cards_cards" DROP COLUMN "playground_url";
  ALTER TABLE "pages_blocks_swipe_cards_cards" DROP COLUMN "media_type";
  ALTER TABLE "pages_blocks_swipe_cards_cards" DROP COLUMN "playground_url";
  ALTER TABLE "pages_blocks_cta_image" DROP COLUMN "media_type";
  ALTER TABLE "pages_blocks_cta_image" DROP COLUMN "playground_url";
  ALTER TABLE "pages_blocks_card_row_cards" DROP COLUMN "media_type";
  ALTER TABLE "pages_blocks_card_row_cards" DROP COLUMN "playground_url";
  ALTER TABLE "pages_blocks_scroll_cards_items" DROP COLUMN "media_type";
  ALTER TABLE "pages_blocks_scroll_cards_items" DROP COLUMN "playground_url";
  ALTER TABLE "pages_blocks_standalone_card" DROP COLUMN "media_type";
  ALTER TABLE "pages_blocks_standalone_card" DROP COLUMN "playground_url";
  ALTER TABLE "pages_blocks_flow_example" DROP COLUMN "playground_url";
  DROP TYPE "public"."enum_pages_blocks_offset_cards_cards_media_type";
  DROP TYPE "public"."enum_pages_blocks_swipe_cards_cards_media_type";
  DROP TYPE "public"."enum_pages_blocks_cta_image_media_type";
  DROP TYPE "public"."enum_pages_blocks_card_row_cards_media_type";
  DROP TYPE "public"."enum_pages_blocks_scroll_cards_items_media_type";
  DROP TYPE "public"."enum_pages_blocks_standalone_card_media_type";`)
}
