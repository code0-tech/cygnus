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

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "pages_blocks_card_row" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "block_name" varchar
    );

    CREATE TABLE IF NOT EXISTS "pages_blocks_card_row_cards" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "description" varchar,
      "link_label" varchar,
      "link_url" varchar,
      "image_id" integer
    );

    ALTER TABLE "pages_blocks_card_row"
      ADD CONSTRAINT "pages_blocks_card_row_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "pages_blocks_card_row_cards"
      ADD CONSTRAINT "pages_blocks_card_row_cards_image_id_media_id_fk"
      FOREIGN KEY ("image_id") REFERENCES "public"."media"("id")
      ON DELETE set null ON UPDATE no action;

    ALTER TABLE "pages_blocks_card_row_cards"
      ADD CONSTRAINT "pages_blocks_card_row_cards_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_card_row"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "pages_blocks_card_row_order_idx" ON "pages_blocks_card_row" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_card_row_parent_id_idx" ON "pages_blocks_card_row" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_card_row_path_idx" ON "pages_blocks_card_row" USING btree ("_path");
    CREATE INDEX IF NOT EXISTS "pages_blocks_card_row_locale_idx" ON "pages_blocks_card_row" USING btree ("_locale");
    CREATE INDEX IF NOT EXISTS "pages_blocks_card_row_cards_order_idx" ON "pages_blocks_card_row_cards" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_card_row_cards_parent_id_idx" ON "pages_blocks_card_row_cards" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_card_row_cards_locale_idx" ON "pages_blocks_card_row_cards" USING btree ("_locale");
    CREATE INDEX IF NOT EXISTS "pages_blocks_card_row_cards_image_idx" ON "pages_blocks_card_row_cards" USING btree ("image_id");

    INSERT INTO "pages_blocks_card_row" (
      "_order", "_parent_id", "_path", "_locale", "id", "block_name"
    )
    SELECT "_order", "_parent_id", "_path", "_locale", "id", "block_name"
    FROM "pages_blocks_deployment"
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_card_row_cards" (
      "_order", "_parent_id", "_locale", "id", "title", "description", "link_label", "link_url"
    )
    SELECT 0, "id", "_locale", "id" || '-cloud', COALESCE("cloud_title", ''), "cloud_description", "cloud_link_label", "cloud_link_url"
    FROM "pages_blocks_deployment"
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_card_row_cards" (
      "_order", "_parent_id", "_locale", "id", "title", "description", "link_label", "link_url"
    )
    SELECT 1, "id", "_locale", "id" || '-selfhost', COALESCE("selfhost_title", ''), "selfhost_description", "selfhost_link_label", "selfhost_link_url"
    FROM "pages_blocks_deployment"
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_card_row_cards" (
      "_order", "_parent_id", "_locale", "id", "title", "description", "link_label", "link_url"
    )
    SELECT 2, "id", "_locale", "id" || '-dynamic', COALESCE("dynamic_title", ''), "dynamic_description", "dynamic_link_label", "dynamic_link_url"
    FROM "pages_blocks_deployment"
    ON CONFLICT ("id") DO NOTHING;

    DROP TABLE IF EXISTS "pages_blocks_deployment" CASCADE;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "pages_blocks_offset_cards" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "show_section_header" boolean DEFAULT false,
      "block_name" varchar
    );

    CREATE TABLE IF NOT EXISTS "pages_blocks_offset_cards_cards" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "title" varchar NOT NULL,
      "description" varchar NOT NULL,
      "image_id" integer,
      "bullet_points" jsonb,
      "link_label" varchar,
      "link_url" varchar
    );

    ALTER TABLE "pages_blocks_offset_cards"
      ADD CONSTRAINT "pages_blocks_offset_cards_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "pages_blocks_offset_cards_cards"
      ADD CONSTRAINT "pages_blocks_offset_cards_cards_image_id_media_id_fk"
      FOREIGN KEY ("image_id") REFERENCES "public"."media"("id")
      ON DELETE set null ON UPDATE no action;

    ALTER TABLE "pages_blocks_offset_cards_cards"
      ADD CONSTRAINT "pages_blocks_offset_cards_cards_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_offset_cards"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "pages_blocks_offset_cards_order_idx" ON "pages_blocks_offset_cards" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_offset_cards_parent_id_idx" ON "pages_blocks_offset_cards" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_offset_cards_path_idx" ON "pages_blocks_offset_cards" USING btree ("_path");
    CREATE INDEX IF NOT EXISTS "pages_blocks_offset_cards_locale_idx" ON "pages_blocks_offset_cards" USING btree ("_locale");
    CREATE INDEX IF NOT EXISTS "pages_blocks_offset_cards_cards_order_idx" ON "pages_blocks_offset_cards_cards" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_offset_cards_cards_parent_id_idx" ON "pages_blocks_offset_cards_cards" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_offset_cards_cards_locale_idx" ON "pages_blocks_offset_cards_cards" USING btree ("_locale");
    CREATE INDEX IF NOT EXISTS "pages_blocks_offset_cards_cards_image_idx" ON "pages_blocks_offset_cards_cards" USING btree ("image_id");

    INSERT INTO "pages_blocks_offset_cards" (
      "_order", "_parent_id", "_path", "_locale", "id", "show_section_header", "block_name"
    )
    SELECT "_order", "_parent_id", "_path", "_locale", "id", true, "block_name"
    FROM "pages_blocks_usecase"
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_offset_cards_cards" (
      "_order", "_parent_id", "_locale", "id", "label", "title", "description", "image_id", "link_label", "link_url"
    )
    SELECT "_order", "_parent_id", "_locale", "id", "label", "title", "description", "image_id", "link_label", "link_url"
    FROM "pages_blocks_usecase_use_cases"
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_offset_cards" (
      "_order", "_parent_id", "_path", "_locale", "id", "show_section_header", "block_name"
    )
    SELECT "_order", "_parent_id", "_path", "_locale", "id", false, "block_name"
    FROM "pages_blocks_edition_features"
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_offset_cards_cards" (
      "_order", "_parent_id", "_locale", "id", "label", "title", "description", "image_id", "link_label", "link_url"
    )
    SELECT "_order", "_parent_id", "_locale", "id", "label", "title", "description", "image_id", "link_label", "link_url"
    FROM "pages_blocks_edition_features_features"
    ON CONFLICT ("id") DO NOTHING;

    DROP TABLE IF EXISTS "pages_blocks_usecase_use_cases" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_usecase" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_edition_features_features" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_edition_features" CASCADE;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "pages_blocks_install" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "heading" varchar NOT NULL,
      "subheading" varchar NOT NULL,
      "label" varchar,
      "code" varchar NOT NULL,
      "block_name" varchar
    );

    CREATE TABLE IF NOT EXISTS "pages_blocks_swipe_cards" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "heading" varchar,
      "subheading" varchar,
      "block_name" varchar
    );

    CREATE TABLE IF NOT EXISTS "pages_blocks_swipe_cards_cards" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "description" varchar NOT NULL,
      "image_id" integer,
      "link_label" varchar,
      "link_url" varchar
    );

    ALTER TABLE "pages_blocks_install"
      ADD CONSTRAINT "pages_blocks_install_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "pages_blocks_swipe_cards"
      ADD CONSTRAINT "pages_blocks_swipe_cards_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "pages_blocks_swipe_cards_cards"
      ADD CONSTRAINT "pages_blocks_swipe_cards_cards_image_id_media_id_fk"
      FOREIGN KEY ("image_id") REFERENCES "public"."media"("id")
      ON DELETE set null ON UPDATE no action;

    ALTER TABLE "pages_blocks_swipe_cards_cards"
      ADD CONSTRAINT "pages_blocks_swipe_cards_cards_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_swipe_cards"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "pages_blocks_install_order_idx" ON "pages_blocks_install" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_install_parent_id_idx" ON "pages_blocks_install" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_install_path_idx" ON "pages_blocks_install" USING btree ("_path");
    CREATE INDEX IF NOT EXISTS "pages_blocks_install_locale_idx" ON "pages_blocks_install" USING btree ("_locale");
    CREATE INDEX IF NOT EXISTS "pages_blocks_swipe_cards_order_idx" ON "pages_blocks_swipe_cards" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_swipe_cards_parent_id_idx" ON "pages_blocks_swipe_cards" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_swipe_cards_path_idx" ON "pages_blocks_swipe_cards" USING btree ("_path");
    CREATE INDEX IF NOT EXISTS "pages_blocks_swipe_cards_locale_idx" ON "pages_blocks_swipe_cards" USING btree ("_locale");
    CREATE INDEX IF NOT EXISTS "pages_blocks_swipe_cards_cards_order_idx" ON "pages_blocks_swipe_cards_cards" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_swipe_cards_cards_parent_id_idx" ON "pages_blocks_swipe_cards_cards" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_swipe_cards_cards_locale_idx" ON "pages_blocks_swipe_cards_cards" USING btree ("_locale");
    CREATE INDEX IF NOT EXISTS "pages_blocks_swipe_cards_cards_image_idx" ON "pages_blocks_swipe_cards_cards" USING btree ("image_id");

    INSERT INTO "pages_blocks_install" (
      "_order", "_parent_id", "_path", "_locale", "id", "heading", "subheading", "label", "code", "block_name"
    )
    SELECT "_order", "_parent_id", "_path", "_locale", "id", "heading", "subheading", "label", "code", "block_name"
    FROM "pages_blocks_edition_install"
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_swipe_cards" (
      "_order", "_parent_id", "_path", "_locale", "id", "heading", "subheading", "block_name"
    )
    SELECT "_order", "_parent_id", "_path", "_locale", "id", "heading", "subheading", "block_name"
    FROM "pages_blocks_edition_use_cases"
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_swipe_cards_cards" (
      "_order", "_parent_id", "_locale", "id", "title", "description", "image_id", "link_label", "link_url"
    )
    SELECT "_order", "_parent_id", "_locale", "id", "title", "description", "image_id", "link_label", "link_url"
    FROM "pages_blocks_edition_use_cases_use_cases"
    ON CONFLICT ("id") DO NOTHING;

    DROP TABLE IF EXISTS "pages_blocks_edition_install" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_edition_use_cases_use_cases" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_edition_use_cases" CASCADE;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_pages_blocks_bento_variant" AS ENUM('feature', 'runtime');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "pages_blocks_bento" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "variant" "enum_pages_blocks_bento_variant" DEFAULT 'feature' NOT NULL,
      "block_name" varchar
    );

    ALTER TABLE "pages_blocks_bento"
      ADD CONSTRAINT "pages_blocks_bento_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "pages_blocks_bento_order_idx" ON "pages_blocks_bento" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_bento_parent_id_idx" ON "pages_blocks_bento" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_bento_path_idx" ON "pages_blocks_bento" USING btree ("_path");
    CREATE INDEX IF NOT EXISTS "pages_blocks_bento_locale_idx" ON "pages_blocks_bento" USING btree ("_locale");
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "pages_blocks_roadmap" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "block_name" varchar
    );

    CREATE TABLE IF NOT EXISTS "pages_blocks_roadmap_items" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "time" varchar NOT NULL,
      "title" varchar NOT NULL,
      "description" varchar NOT NULL
    );

    ALTER TABLE "pages_blocks_roadmap"
      ADD CONSTRAINT "pages_blocks_roadmap_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "pages_blocks_roadmap_items"
      ADD CONSTRAINT "pages_blocks_roadmap_items_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_roadmap"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "pages_blocks_roadmap_order_idx" ON "pages_blocks_roadmap" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_roadmap_parent_id_idx" ON "pages_blocks_roadmap" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_roadmap_path_idx" ON "pages_blocks_roadmap" USING btree ("_path");
    CREATE INDEX IF NOT EXISTS "pages_blocks_roadmap_locale_idx" ON "pages_blocks_roadmap" USING btree ("_locale");
    CREATE INDEX IF NOT EXISTS "pages_blocks_roadmap_items_order_idx" ON "pages_blocks_roadmap_items" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_roadmap_items_parent_id_idx" ON "pages_blocks_roadmap_items" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_roadmap_items_locale_idx" ON "pages_blocks_roadmap_items" USING btree ("_locale");

    INSERT INTO "pages_blocks_roadmap" (
      "_order",
      "_parent_id",
      "_path",
      "_locale",
      "id"
    )
    SELECT
      COALESCE((
        SELECT MAX("_order") + 1
        FROM (
          SELECT "_order", "_parent_id", "_locale" FROM "pages_blocks_hero"
          UNION ALL SELECT "_order", "_parent_id", "_locale" FROM "pages_blocks_brand"
          UNION ALL SELECT "_order", "_parent_id", "_locale" FROM "pages_blocks_faq"
          UNION ALL SELECT "_order", "_parent_id", "_locale" FROM "pages_blocks_cta"
          UNION ALL SELECT "_order", "_parent_id", "_locale" FROM "pages_blocks_jobs"
          UNION ALL SELECT "_order", "_parent_id", "_locale" FROM "pages_blocks_blog"
          UNION ALL SELECT "_order", "_parent_id", "_locale" FROM "pages_blocks_actions"
          UNION ALL SELECT "_order", "_parent_id", "_locale" FROM "pages_blocks_markdown"
          UNION ALL SELECT "_order", "_parent_id", "_locale" FROM "pages_blocks_contact"
          UNION ALL SELECT "_order", "_parent_id", "_locale" FROM "pages_blocks_bento"
          UNION ALL SELECT "_order", "_parent_id", "_locale" FROM "pages_blocks_offset_cards"
          UNION ALL SELECT "_order", "_parent_id", "_locale" FROM "pages_blocks_install"
          UNION ALL SELECT "_order", "_parent_id", "_locale" FROM "pages_blocks_swipe_cards"
          UNION ALL SELECT "_order", "_parent_id", "_locale" FROM "pages_blocks_card_row"
        ) layout_orders
        WHERE layout_orders."_parent_id" = pages."id"
          AND layout_orders."_locale" = locale_values."_locale"
      ), 0),
      pages."id",
      'layout',
      locale_values."_locale",
      'roadmap-' || pages."id" || '-' || locale_values."_locale"::text
    FROM "pages" pages
    CROSS JOIN (
      SELECT DISTINCT "_locale" FROM "roadmap_items_locales"
    ) locale_values
    WHERE pages."slug" = 'main'
      AND EXISTS (
        SELECT 1 FROM "roadmap_items_locales"
        WHERE "roadmap_items_locales"."_locale" = locale_values."_locale"
      )
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_roadmap_items" (
      "_order",
      "_parent_id",
      "_locale",
      "id",
      "time",
      "title",
      "description"
    )
    SELECT
      ROW_NUMBER() OVER (PARTITION BY roadmap_locale."_locale" ORDER BY roadmap."created_at" DESC, roadmap."id" DESC) - 1,
      'roadmap-' || pages."id" || '-' || roadmap_locale."_locale"::text,
      roadmap_locale."_locale",
      'roadmap-item-' || roadmap."id" || '-' || roadmap_locale."_locale"::text,
      roadmap_locale."time",
      roadmap_locale."title",
      roadmap_locale."description"
    FROM "roadmap_items" roadmap
    INNER JOIN "roadmap_items_locales" roadmap_locale ON roadmap_locale."_parent_id" = roadmap."id"
    INNER JOIN "pages" pages ON pages."slug" = 'main'
    ON CONFLICT ("id") DO NOTHING;

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_roadmap_items_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_roadmap_items_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "roadmap_items_id";

    DROP TABLE IF EXISTS "roadmap_items_locales" CASCADE;
    DROP TABLE IF EXISTS "roadmap_items" CASCADE;
  `)

  await db.execute(sql`
    ALTER TABLE "pages_blocks_bento" ADD COLUMN IF NOT EXISTS "section_heading" varchar;
    ALTER TABLE "pages_blocks_bento" ADD COLUMN IF NOT EXISTS "section_description" varchar;
    ALTER TABLE "pages_blocks_bento" ADD COLUMN IF NOT EXISTS "section_link_button_label" varchar;
    ALTER TABLE "pages_blocks_bento" ADD COLUMN IF NOT EXISTS "section_link_button_url" varchar;

    ALTER TABLE "pages_blocks_roadmap" ADD COLUMN IF NOT EXISTS "section_heading" varchar;
    ALTER TABLE "pages_blocks_roadmap" ADD COLUMN IF NOT EXISTS "section_description" varchar;
    ALTER TABLE "pages_blocks_roadmap" ADD COLUMN IF NOT EXISTS "section_link_button_label" varchar;
    ALTER TABLE "pages_blocks_roadmap" ADD COLUMN IF NOT EXISTS "section_link_button_url" varchar;

    ALTER TABLE "pages_blocks_faq" ADD COLUMN IF NOT EXISTS "section_heading" varchar;
    ALTER TABLE "pages_blocks_faq" ADD COLUMN IF NOT EXISTS "section_description" varchar;
    ALTER TABLE "pages_blocks_faq" ADD COLUMN IF NOT EXISTS "section_link_button_label" varchar;
    ALTER TABLE "pages_blocks_faq" ADD COLUMN IF NOT EXISTS "section_link_button_url" varchar;

    ALTER TABLE "pages_blocks_offset_cards" ADD COLUMN IF NOT EXISTS "section_heading" varchar;
    ALTER TABLE "pages_blocks_offset_cards" ADD COLUMN IF NOT EXISTS "section_description" varchar;
    ALTER TABLE "pages_blocks_offset_cards" ADD COLUMN IF NOT EXISTS "section_link_button_label" varchar;
    ALTER TABLE "pages_blocks_offset_cards" ADD COLUMN IF NOT EXISTS "section_link_button_url" varchar;

    ALTER TABLE "pages_blocks_card_row" ADD COLUMN IF NOT EXISTS "section_heading" varchar;
    ALTER TABLE "pages_blocks_card_row" ADD COLUMN IF NOT EXISTS "section_description" varchar;
    ALTER TABLE "pages_blocks_card_row" ADD COLUMN IF NOT EXISTS "section_link_button_label" varchar;
    ALTER TABLE "pages_blocks_card_row" ADD COLUMN IF NOT EXISTS "section_link_button_url" varchar;

    WITH section_source AS (
      SELECT
        sections."section_type"::text AS "section_type",
        sections."link_button_url",
        sections_locales."_locale",
        sections_locales."heading",
        sections_locales."subheading",
        sections_locales."link_button_label"
      FROM "sections"
      INNER JOIN "sections_locales" ON "sections_locales"."_parent_id" = sections."id"
    )
    UPDATE "pages_blocks_bento" block
    SET
      "section_heading" = section_source."heading",
      "section_description" = section_source."subheading",
      "section_link_button_label" = section_source."link_button_label",
      "section_link_button_url" = section_source."link_button_url"
    FROM section_source
    WHERE block."_locale" = section_source."_locale"
      AND (
        (block."variant" = 'feature' AND section_source."section_type" = 'AppFeatureSection')
        OR (block."variant" = 'runtime' AND section_source."section_type" = 'RuntimeFeatureSection')
      );

    WITH section_source AS (
      SELECT
        sections."section_type"::text AS "section_type",
        sections."link_button_url",
        sections_locales."_locale",
        sections_locales."heading",
        sections_locales."subheading",
        sections_locales."link_button_label"
      FROM "sections"
      INNER JOIN "sections_locales" ON "sections_locales"."_parent_id" = sections."id"
    )
    UPDATE "pages_blocks_roadmap" block
    SET
      "section_heading" = section_source."heading",
      "section_description" = section_source."subheading",
      "section_link_button_label" = section_source."link_button_label",
      "section_link_button_url" = section_source."link_button_url"
    FROM section_source
    WHERE block."_locale" = section_source."_locale"
      AND section_source."section_type" = 'RoadmapSection';

    WITH section_source AS (
      SELECT
        sections."section_type"::text AS "section_type",
        sections."link_button_url",
        sections_locales."_locale",
        sections_locales."heading",
        sections_locales."subheading",
        sections_locales."link_button_label"
      FROM "sections"
      INNER JOIN "sections_locales" ON "sections_locales"."_parent_id" = sections."id"
    )
    UPDATE "pages_blocks_faq" block
    SET
      "section_heading" = section_source."heading",
      "section_description" = section_source."subheading",
      "section_link_button_label" = section_source."link_button_label",
      "section_link_button_url" = section_source."link_button_url"
    FROM section_source
    WHERE block."_locale" = section_source."_locale"
      AND section_source."section_type" = 'FaqSection';

    WITH section_source AS (
      SELECT
        sections."section_type"::text AS "section_type",
        sections."link_button_url",
        sections_locales."_locale",
        sections_locales."heading",
        sections_locales."subheading",
        sections_locales."link_button_label"
      FROM "sections"
      INNER JOIN "sections_locales" ON "sections_locales"."_parent_id" = sections."id"
    )
    UPDATE "pages_blocks_offset_cards" block
    SET
      "section_heading" = section_source."heading",
      "section_description" = section_source."subheading",
      "section_link_button_label" = section_source."link_button_label",
      "section_link_button_url" = section_source."link_button_url"
    FROM section_source
    WHERE block."_locale" = section_source."_locale"
      AND COALESCE(block."show_section_header", false) = true
      AND section_source."section_type" = 'UseCaseSection';

    WITH section_source AS (
      SELECT
        sections."section_type"::text AS "section_type",
        sections."link_button_url",
        sections_locales."_locale",
        sections_locales."heading",
        sections_locales."subheading",
        sections_locales."link_button_label"
      FROM "sections"
      INNER JOIN "sections_locales" ON "sections_locales"."_parent_id" = sections."id"
    )
    UPDATE "pages_blocks_card_row" block
    SET
      "section_heading" = section_source."heading",
      "section_description" = section_source."subheading",
      "section_link_button_label" = section_source."link_button_label",
      "section_link_button_url" = section_source."link_button_url"
    FROM section_source
    WHERE block."_locale" = section_source."_locale"
      AND section_source."section_type" IN ('CardRowSection', 'DeploymentSection');

    ALTER TABLE "pages_blocks_offset_cards" DROP COLUMN IF EXISTS "show_section_header";

    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_sections_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_sections_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "sections_id";

    DROP TABLE IF EXISTS "sections_locales" CASCADE;
    DROP TABLE IF EXISTS "sections" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_sections_section_type";
  `)

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

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_sections_section_type" AS ENUM('AppFeatureSection', 'FaqSection', 'RoadmapSection', 'RuntimeFeatureSection', 'UseCaseSection', 'DeploymentSection', 'CardRowSection');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "sections" (
      "id" serial PRIMARY KEY NOT NULL,
      "section_type" "enum_sections_section_type" NOT NULL,
      "link_button_url" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "sections_locales" (
      "heading" varchar NOT NULL,
      "subheading" varchar,
      "link_button_label" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    ALTER TABLE "sections_locales"
      ADD CONSTRAINT "sections_locales_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."sections"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "sections_updated_at_idx" ON "sections" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "sections_created_at_idx" ON "sections" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "sections_locales_locale_parent_id_unique" ON "sections_locales" USING btree ("_locale","_parent_id");

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "sections_id" integer;
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_sections_fk"
      FOREIGN KEY ("sections_id") REFERENCES "public"."sections"("id")
      ON DELETE cascade ON UPDATE no action;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_sections_id_idx" ON "payload_locked_documents_rels" USING btree ("sections_id");

    ALTER TABLE "pages_blocks_offset_cards" ADD COLUMN IF NOT EXISTS "show_section_header" boolean DEFAULT false;
    ALTER TABLE "pages_blocks_bento" DROP COLUMN IF EXISTS "section_heading";
    ALTER TABLE "pages_blocks_bento" DROP COLUMN IF EXISTS "section_description";
    ALTER TABLE "pages_blocks_bento" DROP COLUMN IF EXISTS "section_link_button_label";
    ALTER TABLE "pages_blocks_bento" DROP COLUMN IF EXISTS "section_link_button_url";
    ALTER TABLE "pages_blocks_roadmap" DROP COLUMN IF EXISTS "section_heading";
    ALTER TABLE "pages_blocks_roadmap" DROP COLUMN IF EXISTS "section_description";
    ALTER TABLE "pages_blocks_roadmap" DROP COLUMN IF EXISTS "section_link_button_label";
    ALTER TABLE "pages_blocks_roadmap" DROP COLUMN IF EXISTS "section_link_button_url";
    ALTER TABLE "pages_blocks_faq" DROP COLUMN IF EXISTS "section_heading";
    ALTER TABLE "pages_blocks_faq" DROP COLUMN IF EXISTS "section_description";
    ALTER TABLE "pages_blocks_faq" DROP COLUMN IF EXISTS "section_link_button_label";
    ALTER TABLE "pages_blocks_faq" DROP COLUMN IF EXISTS "section_link_button_url";
    ALTER TABLE "pages_blocks_offset_cards" DROP COLUMN IF EXISTS "section_heading";
    ALTER TABLE "pages_blocks_offset_cards" DROP COLUMN IF EXISTS "section_description";
    ALTER TABLE "pages_blocks_offset_cards" DROP COLUMN IF EXISTS "section_link_button_label";
    ALTER TABLE "pages_blocks_offset_cards" DROP COLUMN IF EXISTS "section_link_button_url";
    ALTER TABLE "pages_blocks_card_row" DROP COLUMN IF EXISTS "section_heading";
    ALTER TABLE "pages_blocks_card_row" DROP COLUMN IF EXISTS "section_description";
    ALTER TABLE "pages_blocks_card_row" DROP COLUMN IF EXISTS "section_link_button_label";
    ALTER TABLE "pages_blocks_card_row" DROP COLUMN IF EXISTS "section_link_button_url";
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "roadmap_items" (
      "id" serial PRIMARY KEY NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "roadmap_items_locales" (
      "time" varchar NOT NULL,
      "title" varchar NOT NULL,
      "description" varchar NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    ALTER TABLE "roadmap_items_locales"
      ADD CONSTRAINT "roadmap_items_locales_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."roadmap_items"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "roadmap_items_updated_at_idx" ON "roadmap_items" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "roadmap_items_created_at_idx" ON "roadmap_items" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "roadmap_items_locales_locale_parent_id_unique" ON "roadmap_items_locales" USING btree ("_locale","_parent_id");

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "roadmap_items_id" integer;
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_roadmap_items_fk"
      FOREIGN KEY ("roadmap_items_id") REFERENCES "public"."roadmap_items"("id")
      ON DELETE cascade ON UPDATE no action;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_roadmap_items_id_idx" ON "payload_locked_documents_rels" USING btree ("roadmap_items_id");

    DROP TABLE IF EXISTS "pages_blocks_roadmap_items" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_roadmap" CASCADE;
  `)

  await db.execute(sql`
    DROP TABLE IF EXISTS "pages_blocks_bento" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_pages_blocks_bento_variant";
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "pages_blocks_edition_install" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "heading" varchar NOT NULL,
      "subheading" varchar NOT NULL,
      "label" varchar,
      "code" varchar NOT NULL,
      "block_name" varchar
    );

    CREATE TABLE IF NOT EXISTS "pages_blocks_edition_use_cases" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "heading" varchar NOT NULL,
      "subheading" varchar NOT NULL,
      "block_name" varchar
    );

    CREATE TABLE IF NOT EXISTS "pages_blocks_edition_use_cases_use_cases" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "description" varchar NOT NULL,
      "image_id" integer,
      "link_label" varchar,
      "link_url" varchar
    );

    ALTER TABLE "pages_blocks_edition_install"
      ADD CONSTRAINT "pages_blocks_edition_install_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "pages_blocks_edition_use_cases"
      ADD CONSTRAINT "pages_blocks_edition_use_cases_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "pages_blocks_edition_use_cases_use_cases"
      ADD CONSTRAINT "pages_blocks_edition_use_cases_use_cases_image_id_media_id_fk"
      FOREIGN KEY ("image_id") REFERENCES "public"."media"("id")
      ON DELETE set null ON UPDATE no action;

    ALTER TABLE "pages_blocks_edition_use_cases_use_cases"
      ADD CONSTRAINT "pages_blocks_edition_use_cases_use_cases_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_edition_use_cases"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_install_order_idx" ON "pages_blocks_edition_install" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_install_parent_id_idx" ON "pages_blocks_edition_install" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_install_path_idx" ON "pages_blocks_edition_install" USING btree ("_path");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_install_locale_idx" ON "pages_blocks_edition_install" USING btree ("_locale");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_use_cases_order_idx" ON "pages_blocks_edition_use_cases" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_use_cases_parent_id_idx" ON "pages_blocks_edition_use_cases" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_use_cases_path_idx" ON "pages_blocks_edition_use_cases" USING btree ("_path");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_use_cases_locale_idx" ON "pages_blocks_edition_use_cases" USING btree ("_locale");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_use_cases_use_cases_order_idx" ON "pages_blocks_edition_use_cases_use_cases" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_use_cases_use_cases_parent_id_idx" ON "pages_blocks_edition_use_cases_use_cases" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_use_cases_use_cases_locale_idx" ON "pages_blocks_edition_use_cases_use_cases" USING btree ("_locale");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_use_cases_use_cases_image_idx" ON "pages_blocks_edition_use_cases_use_cases" USING btree ("image_id");

    INSERT INTO "pages_blocks_edition_install" (
      "_order", "_parent_id", "_path", "_locale", "id", "heading", "subheading", "label", "code", "block_name"
    )
    SELECT "_order", "_parent_id", "_path", "_locale", "id", "heading", "subheading", "label", "code", "block_name"
    FROM "pages_blocks_install"
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_edition_use_cases" (
      "_order", "_parent_id", "_path", "_locale", "id", "heading", "subheading", "block_name"
    )
    SELECT "_order", "_parent_id", "_path", "_locale", "id", COALESCE("heading", ''), COALESCE("subheading", ''), "block_name"
    FROM "pages_blocks_swipe_cards"
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_edition_use_cases_use_cases" (
      "_order", "_parent_id", "_locale", "id", "title", "description", "image_id", "link_label", "link_url"
    )
    SELECT "_order", "_parent_id", "_locale", "id", "title", "description", "image_id", "link_label", "link_url"
    FROM "pages_blocks_swipe_cards_cards"
    ON CONFLICT ("id") DO NOTHING;

    DROP TABLE IF EXISTS "pages_blocks_swipe_cards_cards" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_swipe_cards" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_install" CASCADE;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "pages_blocks_usecase" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "block_name" varchar
    );

    CREATE TABLE IF NOT EXISTS "pages_blocks_usecase_use_cases" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "title" varchar NOT NULL,
      "description" varchar NOT NULL,
      "image_id" integer,
      "link_label" varchar,
      "link_url" varchar
    );

    CREATE TABLE IF NOT EXISTS "pages_blocks_edition_features" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "block_name" varchar
    );

    CREATE TABLE IF NOT EXISTS "pages_blocks_edition_features_features" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "title" varchar NOT NULL,
      "description" varchar NOT NULL,
      "image_id" integer,
      "link_label" varchar,
      "link_url" varchar
    );

    ALTER TABLE "pages_blocks_usecase"
      ADD CONSTRAINT "pages_blocks_usecase_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "pages_blocks_usecase_use_cases"
      ADD CONSTRAINT "pages_blocks_usecase_use_cases_image_id_media_id_fk"
      FOREIGN KEY ("image_id") REFERENCES "public"."media"("id")
      ON DELETE set null ON UPDATE no action;

    ALTER TABLE "pages_blocks_usecase_use_cases"
      ADD CONSTRAINT "pages_blocks_usecase_use_cases_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_usecase"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "pages_blocks_edition_features"
      ADD CONSTRAINT "pages_blocks_edition_features_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
      ON DELETE cascade ON UPDATE no action;

    ALTER TABLE "pages_blocks_edition_features_features"
      ADD CONSTRAINT "pages_blocks_edition_features_features_image_id_media_id_fk"
      FOREIGN KEY ("image_id") REFERENCES "public"."media"("id")
      ON DELETE set null ON UPDATE no action;

    ALTER TABLE "pages_blocks_edition_features_features"
      ADD CONSTRAINT "pages_blocks_edition_features_features_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_edition_features"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "pages_blocks_usecase_order_idx" ON "pages_blocks_usecase" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_usecase_parent_id_idx" ON "pages_blocks_usecase" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_usecase_path_idx" ON "pages_blocks_usecase" USING btree ("_path");
    CREATE INDEX IF NOT EXISTS "pages_blocks_usecase_locale_idx" ON "pages_blocks_usecase" USING btree ("_locale");
    CREATE INDEX IF NOT EXISTS "pages_blocks_usecase_use_cases_order_idx" ON "pages_blocks_usecase_use_cases" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_usecase_use_cases_parent_id_idx" ON "pages_blocks_usecase_use_cases" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_usecase_use_cases_locale_idx" ON "pages_blocks_usecase_use_cases" USING btree ("_locale");
    CREATE INDEX IF NOT EXISTS "pages_blocks_usecase_use_cases_image_idx" ON "pages_blocks_usecase_use_cases" USING btree ("image_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_features_order_idx" ON "pages_blocks_edition_features" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_features_parent_id_idx" ON "pages_blocks_edition_features" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_features_path_idx" ON "pages_blocks_edition_features" USING btree ("_path");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_features_locale_idx" ON "pages_blocks_edition_features" USING btree ("_locale");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_features_features_order_idx" ON "pages_blocks_edition_features_features" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_features_features_parent_id_idx" ON "pages_blocks_edition_features_features" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_features_features_locale_idx" ON "pages_blocks_edition_features_features" USING btree ("_locale");
    CREATE INDEX IF NOT EXISTS "pages_blocks_edition_features_features_image_idx" ON "pages_blocks_edition_features_features" USING btree ("image_id");

    INSERT INTO "pages_blocks_usecase" (
      "_order", "_parent_id", "_path", "_locale", "id", "block_name"
    )
    SELECT "_order", "_parent_id", "_path", "_locale", "id", "block_name"
    FROM "pages_blocks_offset_cards"
    WHERE "show_section_header" = true
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_usecase_use_cases" (
      "_order", "_parent_id", "_locale", "id", "label", "title", "description", "image_id", "link_label", "link_url"
    )
    SELECT card."_order", card."_parent_id", card."_locale", card."id", card."label", card."title", card."description", card."image_id", card."link_label", card."link_url"
    FROM "pages_blocks_offset_cards_cards" card
    INNER JOIN "pages_blocks_offset_cards" block ON block."id" = card."_parent_id"
    WHERE block."show_section_header" = true
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_edition_features" (
      "_order", "_parent_id", "_path", "_locale", "id", "block_name"
    )
    SELECT "_order", "_parent_id", "_path", "_locale", "id", "block_name"
    FROM "pages_blocks_offset_cards"
    WHERE COALESCE("show_section_header", false) = false
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_edition_features_features" (
      "_order", "_parent_id", "_locale", "id", "label", "title", "description", "image_id", "link_label", "link_url"
    )
    SELECT card."_order", card."_parent_id", card."_locale", card."id", card."label", card."title", card."description", card."image_id", card."link_label", card."link_url"
    FROM "pages_blocks_offset_cards_cards" card
    INNER JOIN "pages_blocks_offset_cards" block ON block."id" = card."_parent_id"
    WHERE COALESCE(block."show_section_header", false) = false
    ON CONFLICT ("id") DO NOTHING;

    DROP TABLE IF EXISTS "pages_blocks_offset_cards_cards" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_offset_cards" CASCADE;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "pages_blocks_deployment" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "cloud_title" varchar,
      "cloud_description" varchar,
      "cloud_link_label" varchar,
      "cloud_link_url" varchar,
      "selfhost_title" varchar,
      "selfhost_description" varchar,
      "selfhost_link_label" varchar,
      "selfhost_link_url" varchar,
      "dynamic_title" varchar,
      "dynamic_description" varchar,
      "dynamic_link_label" varchar,
      "dynamic_link_url" varchar,
      "block_name" varchar
    );

    ALTER TABLE "pages_blocks_deployment"
      ADD CONSTRAINT "pages_blocks_deployment_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "pages_blocks_deployment_order_idx" ON "pages_blocks_deployment" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_deployment_parent_id_idx" ON "pages_blocks_deployment" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_deployment_path_idx" ON "pages_blocks_deployment" USING btree ("_path");
    CREATE INDEX IF NOT EXISTS "pages_blocks_deployment_locale_idx" ON "pages_blocks_deployment" USING btree ("_locale");

    INSERT INTO "pages_blocks_deployment" (
      "_order", "_parent_id", "_path", "_locale", "id",
      "cloud_title", "cloud_description", "cloud_link_label", "cloud_link_url",
      "selfhost_title", "selfhost_description", "selfhost_link_label", "selfhost_link_url",
      "dynamic_title", "dynamic_description", "dynamic_link_label", "dynamic_link_url",
      "block_name"
    )
    SELECT
      card_row."_order", card_row."_parent_id", card_row."_path", card_row."_locale", card_row."id",
      cloud."title", cloud."description", cloud."link_label", cloud."link_url",
      selfhost."title", selfhost."description", selfhost."link_label", selfhost."link_url",
      dynamic."title", dynamic."description", dynamic."link_label", dynamic."link_url",
      card_row."block_name"
    FROM "pages_blocks_card_row" card_row
    LEFT JOIN "pages_blocks_card_row_cards" cloud
      ON cloud."_parent_id" = card_row."id" AND cloud."_order" = 0
    LEFT JOIN "pages_blocks_card_row_cards" selfhost
      ON selfhost."_parent_id" = card_row."id" AND selfhost."_order" = 1
    LEFT JOIN "pages_blocks_card_row_cards" dynamic
      ON dynamic."_parent_id" = card_row."id" AND dynamic."_order" = 2
    ON CONFLICT ("id") DO NOTHING;

    DROP TABLE IF EXISTS "pages_blocks_card_row_cards" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_card_row" CASCADE;
  `)

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
