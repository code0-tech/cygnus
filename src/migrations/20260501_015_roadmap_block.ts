import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
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
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
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
}
