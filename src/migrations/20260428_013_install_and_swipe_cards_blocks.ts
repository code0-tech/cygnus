import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
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
      "heading" varchar NOT NULL,
      "subheading" varchar NOT NULL,
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
      "_order",
      "_parent_id",
      "_path",
      "_locale",
      "id",
      "heading",
      "subheading",
      "label",
      "code",
      "block_name"
    )
    SELECT
      "_order",
      "_parent_id",
      "_path",
      "_locale",
      "id",
      "heading",
      "subheading",
      "label",
      "code",
      "block_name"
    FROM "pages_blocks_edition_install"
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_swipe_cards" (
      "_order",
      "_parent_id",
      "_path",
      "_locale",
      "id",
      "heading",
      "subheading",
      "block_name"
    )
    SELECT
      "_order",
      "_parent_id",
      "_path",
      "_locale",
      "id",
      "heading",
      "subheading",
      "block_name"
    FROM "pages_blocks_edition_use_cases"
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_swipe_cards_cards" (
      "_order",
      "_parent_id",
      "_locale",
      "id",
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
      "title",
      "description",
      "image_id",
      "link_label",
      "link_url"
    FROM "pages_blocks_edition_use_cases_use_cases"
    ON CONFLICT ("id") DO NOTHING;

    DROP TABLE IF EXISTS "pages_blocks_edition_install" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_edition_use_cases_use_cases" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_edition_use_cases" CASCADE;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
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
      "_order",
      "_parent_id",
      "_path",
      "_locale",
      "id",
      "heading",
      "subheading",
      "label",
      "code",
      "block_name"
    )
    SELECT
      "_order",
      "_parent_id",
      "_path",
      "_locale",
      "id",
      "heading",
      "subheading",
      "label",
      "code",
      "block_name"
    FROM "pages_blocks_install"
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_edition_use_cases" (
      "_order",
      "_parent_id",
      "_path",
      "_locale",
      "id",
      "heading",
      "subheading",
      "block_name"
    )
    SELECT
      "_order",
      "_parent_id",
      "_path",
      "_locale",
      "id",
      "heading",
      "subheading",
      "block_name"
    FROM "pages_blocks_swipe_cards"
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_edition_use_cases_use_cases" (
      "_order",
      "_parent_id",
      "_locale",
      "id",
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
      "title",
      "description",
      "image_id",
      "link_label",
      "link_url"
    FROM "pages_blocks_swipe_cards_cards"
    ON CONFLICT ("id") DO NOTHING;

    DROP TABLE IF EXISTS "pages_blocks_swipe_cards_cards" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_swipe_cards" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_install" CASCADE;
  `)
}
