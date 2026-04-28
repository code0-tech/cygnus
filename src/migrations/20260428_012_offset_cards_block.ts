import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
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
      "_order",
      "_parent_id",
      "_path",
      "_locale",
      "id",
      "show_section_header",
      "block_name"
    )
    SELECT
      "_order",
      "_parent_id",
      "_path",
      "_locale",
      "id",
      true,
      "block_name"
    FROM "pages_blocks_usecase"
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_offset_cards_cards" (
      "_order",
      "_parent_id",
      "_locale",
      "id",
      "label",
      "title",
      "description",
      "image_id",
      "link_label",
      "link_url"
    )
    SELECT
      "_order",
      "_parent_id",
      "_locale",
      "id",
      "label",
      "title",
      "description",
      "image_id",
      "link_label",
      "link_url"
    FROM "pages_blocks_usecase_use_cases"
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_offset_cards" (
      "_order",
      "_parent_id",
      "_path",
      "_locale",
      "id",
      "show_section_header",
      "block_name"
    )
    SELECT
      "_order",
      "_parent_id",
      "_path",
      "_locale",
      "id",
      false,
      "block_name"
    FROM "pages_blocks_edition_features"
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_offset_cards_cards" (
      "_order",
      "_parent_id",
      "_locale",
      "id",
      "label",
      "title",
      "description",
      "image_id",
      "link_label",
      "link_url"
    )
    SELECT
      "_order",
      "_parent_id",
      "_locale",
      "id",
      "label",
      "title",
      "description",
      "image_id",
      "link_label",
      "link_url"
    FROM "pages_blocks_edition_features_features"
    ON CONFLICT ("id") DO NOTHING;

    DROP TABLE IF EXISTS "pages_blocks_usecase_use_cases" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_usecase" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_edition_features_features" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_edition_features" CASCADE;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
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
      "_order",
      "_parent_id",
      "_path",
      "_locale",
      "id",
      "block_name"
    )
    SELECT
      "_order",
      "_parent_id",
      "_path",
      "_locale",
      "id",
      "block_name"
    FROM "pages_blocks_offset_cards"
    WHERE "show_section_header" = true
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_usecase_use_cases" (
      "_order",
      "_parent_id",
      "_locale",
      "id",
      "label",
      "title",
      "description",
      "image_id",
      "link_label",
      "link_url"
    )
    SELECT
      card."_order",
      card."_parent_id",
      card."_locale",
      card."id",
      card."label",
      card."title",
      card."description",
      card."image_id",
      card."link_label",
      card."link_url"
    FROM "pages_blocks_offset_cards_cards" card
    INNER JOIN "pages_blocks_offset_cards" block ON block."id" = card."_parent_id"
    WHERE block."show_section_header" = true
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_edition_features" (
      "_order",
      "_parent_id",
      "_path",
      "_locale",
      "id",
      "block_name"
    )
    SELECT
      "_order",
      "_parent_id",
      "_path",
      "_locale",
      "id",
      "block_name"
    FROM "pages_blocks_offset_cards"
    WHERE COALESCE("show_section_header", false) = false
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_edition_features_features" (
      "_order",
      "_parent_id",
      "_locale",
      "id",
      "label",
      "title",
      "description",
      "image_id",
      "link_label",
      "link_url"
    )
    SELECT
      card."_order",
      card."_parent_id",
      card."_locale",
      card."id",
      card."label",
      card."title",
      card."description",
      card."image_id",
      card."link_label",
      card."link_url"
    FROM "pages_blocks_offset_cards_cards" card
    INNER JOIN "pages_blocks_offset_cards" block ON block."id" = card."_parent_id"
    WHERE COALESCE(block."show_section_header", false) = false
    ON CONFLICT ("id") DO NOTHING;

    DROP TABLE IF EXISTS "pages_blocks_offset_cards_cards" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_offset_cards" CASCADE;
  `)
}
