import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_hero" ADD COLUMN IF NOT EXISTS "centered" boolean DEFAULT false;
    ALTER TABLE "pages_blocks_hero" ADD COLUMN IF NOT EXISTS "grainient_colors_color1" varchar;
    ALTER TABLE "pages_blocks_hero" ADD COLUMN IF NOT EXISTS "grainient_colors_color2" varchar;
    ALTER TABLE "pages_blocks_hero" ADD COLUMN IF NOT EXISTS "grainient_colors_color3" varchar;
    ALTER TABLE "pages_blocks_hero" ADD COLUMN IF NOT EXISTS "grainient_colors_background_color" varchar;

    INSERT INTO "pages_blocks_hero" (
      "_order",
      "_parent_id",
      "_path",
      "_locale",
      "id",
      "heading",
      "centered",
      "grainient_colors_color1",
      "grainient_colors_color2",
      "grainient_colors_color3",
      "grainient_colors_background_color",
      "block_name"
    )
    SELECT
      "_order",
      "_parent_id",
      "_path",
      "_locale",
      "id",
      "heading",
      true,
      CASE WHEN "_path" LIKE '%community-edition%' THEN '#10213a' ELSE '#13102d' END,
      CASE WHEN "_path" LIKE '%community-edition%' THEN '#f872e2' ELSE '#7472f8' END,
      CASE WHEN "_path" LIKE '%community-edition%' THEN '#f8f172' ELSE '#72c9f8' END,
      CASE WHEN "_path" LIKE '%community-edition%' THEN '#0b1324' ELSE '#140c22' END,
      "block_name"
    FROM "pages_blocks_edition_hero"
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_hero_texts" (
      "_order",
      "_parent_id",
      "_locale",
      "id",
      "text"
    )
    SELECT
      "_order",
      "_parent_id",
      "_locale",
      "id",
      "text"
    FROM "pages_blocks_edition_hero_texts"
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_hero_buttons" (
      "_order",
      "_parent_id",
      "_locale",
      "id",
      "label",
      "url",
      "variant"
    )
    SELECT
      "_order",
      "_parent_id",
      "_locale",
      "id",
      "label",
      "url",
      "variant"::text::"enum_pages_blocks_hero_buttons_variant"
    FROM "pages_blocks_edition_hero_buttons"
    ON CONFLICT ("id") DO NOTHING;

    DROP TABLE IF EXISTS "pages_blocks_edition_hero_texts" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_edition_hero_buttons" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_edition_hero" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_pages_blocks_edition_hero_buttons_variant";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_hero" DROP COLUMN IF EXISTS "grainient_colors_background_color";
    ALTER TABLE "pages_blocks_hero" DROP COLUMN IF EXISTS "grainient_colors_color3";
    ALTER TABLE "pages_blocks_hero" DROP COLUMN IF EXISTS "grainient_colors_color2";
    ALTER TABLE "pages_blocks_hero" DROP COLUMN IF EXISTS "grainient_colors_color1";
    ALTER TABLE "pages_blocks_hero" DROP COLUMN IF EXISTS "centered";

    CREATE TYPE "public"."enum_pages_blocks_edition_hero_buttons_variant" AS ENUM('none', 'normal', 'outlined', 'filled');

    CREATE TABLE IF NOT EXISTS "pages_blocks_edition_hero" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "heading" varchar NOT NULL,
      "image_alt" varchar DEFAULT '' NOT NULL,
      "block_name" varchar
    );

    CREATE TABLE IF NOT EXISTS "pages_blocks_edition_hero_texts" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "text" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "pages_blocks_edition_hero_buttons" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "url" varchar NOT NULL,
      "variant" "enum_pages_blocks_edition_hero_buttons_variant" DEFAULT 'normal'
    );

    ALTER TABLE "pages_blocks_edition_hero"
      ADD CONSTRAINT "pages_blocks_edition_hero_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "pages_blocks_edition_hero_texts"
      ADD CONSTRAINT "pages_blocks_edition_hero_texts_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_edition_hero"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "pages_blocks_edition_hero_buttons"
      ADD CONSTRAINT "pages_blocks_edition_hero_buttons_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_edition_hero"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_hero_order_idx" ON "pages_blocks_edition_hero" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_hero_parent_id_idx" ON "pages_blocks_edition_hero" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_hero_path_idx" ON "pages_blocks_edition_hero" USING btree ("_path");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_hero_locale_idx" ON "pages_blocks_edition_hero" USING btree ("_locale");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_hero_texts_order_idx" ON "pages_blocks_edition_hero_texts" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_hero_texts_parent_id_idx" ON "pages_blocks_edition_hero_texts" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_hero_texts_locale_idx" ON "pages_blocks_edition_hero_texts" USING btree ("_locale");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_hero_buttons_order_idx" ON "pages_blocks_edition_hero_buttons" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_hero_buttons_parent_id_idx" ON "pages_blocks_edition_hero_buttons" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_hero_buttons_locale_idx" ON "pages_blocks_edition_hero_buttons" USING btree ("_locale");
  `)
}
