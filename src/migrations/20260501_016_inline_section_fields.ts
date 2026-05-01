import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
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
        sections."section_type",
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
        sections."section_type",
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
        sections."section_type",
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
        sections."section_type",
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
        sections."section_type",
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
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
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
}
