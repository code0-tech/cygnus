import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
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
    FROM "pages_blocks_deployment"
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_card_row_cards" (
      "_order",
      "_parent_id",
      "_locale",
      "id",
      "title",
      "description",
      "link_label",
      "link_url"
    )
    SELECT
      0,
      "id",
      "_locale",
      "id" || '-cloud',
      COALESCE("cloud_title", ''),
      "cloud_description",
      "cloud_link_label",
      "cloud_link_url"
    FROM "pages_blocks_deployment"
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_card_row_cards" (
      "_order",
      "_parent_id",
      "_locale",
      "id",
      "title",
      "description",
      "link_label",
      "link_url"
    )
    SELECT
      1,
      "id",
      "_locale",
      "id" || '-selfhost',
      COALESCE("selfhost_title", ''),
      "selfhost_description",
      "selfhost_link_label",
      "selfhost_link_url"
    FROM "pages_blocks_deployment"
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "pages_blocks_card_row_cards" (
      "_order",
      "_parent_id",
      "_locale",
      "id",
      "title",
      "description",
      "link_label",
      "link_url"
    )
    SELECT
      2,
      "id",
      "_locale",
      "id" || '-dynamic',
      COALESCE("dynamic_title", ''),
      "dynamic_description",
      "dynamic_link_label",
      "dynamic_link_url"
    FROM "pages_blocks_deployment"
    ON CONFLICT ("id") DO NOTHING;

    DROP TABLE IF EXISTS "pages_blocks_deployment" CASCADE;

    UPDATE "sections"
    SET "section_type" = 'CardRowSection'
    WHERE "section_type" = 'DeploymentSection';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
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
      "_order",
      "_parent_id",
      "_path",
      "_locale",
      "id",
      "cloud_title",
      "cloud_description",
      "cloud_link_label",
      "cloud_link_url",
      "selfhost_title",
      "selfhost_description",
      "selfhost_link_label",
      "selfhost_link_url",
      "dynamic_title",
      "dynamic_description",
      "dynamic_link_label",
      "dynamic_link_url",
      "block_name"
    )
    SELECT
      card_row."_order",
      card_row."_parent_id",
      card_row."_path",
      card_row."_locale",
      card_row."id",
      cloud."title",
      cloud."description",
      cloud."link_label",
      cloud."link_url",
      selfhost."title",
      selfhost."description",
      selfhost."link_label",
      selfhost."link_url",
      dynamic."title",
      dynamic."description",
      dynamic."link_label",
      dynamic."link_url",
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

    UPDATE "sections"
    SET "section_type" = 'DeploymentSection'
    WHERE "section_type" = 'CardRowSection';
  `)
}
