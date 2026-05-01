import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "pages_blocks_scroll_cards" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "block_name" varchar
    );

    CREATE TABLE IF NOT EXISTS "pages_blocks_scroll_cards_items" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "description" varchar NOT NULL,
      "show_image_border" boolean DEFAULT true,
      "section_layout" varchar DEFAULT 'imageRight' NOT NULL,
      "gradient" varchar DEFAULT 'blue',
      "gradient_direction" varchar DEFAULT 'topLeft',
      "bullet_points" jsonb,
      "image_id" integer,
      "link_label" varchar,
      "link_url" varchar
    );

    ALTER TABLE "pages_blocks_scroll_cards"
      ADD CONSTRAINT "pages_blocks_scroll_cards_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "pages_blocks_scroll_cards_items"
      ADD CONSTRAINT "pages_blocks_scroll_cards_items_image_id_media_id_fk"
      FOREIGN KEY ("image_id") REFERENCES "public"."media"("id")
      ON DELETE set null ON UPDATE no action;

    ALTER TABLE "pages_blocks_scroll_cards_items"
      ADD CONSTRAINT "pages_blocks_scroll_cards_items_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_scroll_cards"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "pages_blocks_scroll_cards_order_idx" ON "pages_blocks_scroll_cards" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_scroll_cards_parent_id_idx" ON "pages_blocks_scroll_cards" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_scroll_cards_path_idx" ON "pages_blocks_scroll_cards" USING btree ("_path");
    CREATE INDEX IF NOT EXISTS "pages_blocks_scroll_cards_locale_idx" ON "pages_blocks_scroll_cards" USING btree ("_locale");
    CREATE INDEX IF NOT EXISTS "pages_blocks_scroll_cards_items_order_idx" ON "pages_blocks_scroll_cards_items" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_scroll_cards_items_parent_id_idx" ON "pages_blocks_scroll_cards_items" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_scroll_cards_items_locale_idx" ON "pages_blocks_scroll_cards_items" USING btree ("_locale");
    CREATE INDEX IF NOT EXISTS "pages_blocks_scroll_cards_items_image_idx" ON "pages_blocks_scroll_cards_items" USING btree ("image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "pages_blocks_scroll_cards_items" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_scroll_cards" CASCADE;
  `)
}
