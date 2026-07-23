import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
      ALTER TABLE "pages_blocks_action_hero"
        ADD COLUMN IF NOT EXISTS "badge" varchar,
        ADD COLUMN IF NOT EXISTS "heading" varchar,
        ADD COLUMN IF NOT EXISTS "badge_link" varchar;

      DO $$ BEGIN
        CREATE TYPE "enum_pages_blocks_action_hero_buttons_variant" AS ENUM ('none', 'normal', 'outlined', 'filled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS "pages_blocks_action_hero_texts" (
        "_order" integer NOT NULL,
        "_parent_id" varchar NOT NULL,
        "_locale" "_locales" NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "text" varchar NOT NULL,
        CONSTRAINT "pages_blocks_action_hero_texts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pages_blocks_action_hero"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "pages_blocks_action_hero_texts_order_idx" ON "pages_blocks_action_hero_texts" ("_order");
      CREATE INDEX IF NOT EXISTS "pages_blocks_action_hero_texts_parent_id_idx" ON "pages_blocks_action_hero_texts" ("_parent_id");
      CREATE INDEX IF NOT EXISTS "pages_blocks_action_hero_texts_locale_idx" ON "pages_blocks_action_hero_texts" ("_locale");

      CREATE TABLE IF NOT EXISTS "pages_blocks_action_hero_buttons" (
        "_order" integer NOT NULL,
        "_parent_id" varchar NOT NULL,
        "_locale" "_locales" NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "label" varchar NOT NULL,
        "url" varchar NOT NULL,
        "variant" "enum_pages_blocks_action_hero_buttons_variant" DEFAULT 'normal',
        CONSTRAINT "pages_blocks_action_hero_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pages_blocks_action_hero"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "pages_blocks_action_hero_buttons_order_idx" ON "pages_blocks_action_hero_buttons" ("_order");
      CREATE INDEX IF NOT EXISTS "pages_blocks_action_hero_buttons_parent_id_idx" ON "pages_blocks_action_hero_buttons" ("_parent_id");
      CREATE INDEX IF NOT EXISTS "pages_blocks_action_hero_buttons_locale_idx" ON "pages_blocks_action_hero_buttons" ("_locale");
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
      DROP TABLE IF EXISTS "pages_blocks_action_hero_buttons";
      DROP TABLE IF EXISTS "pages_blocks_action_hero_texts";
      ALTER TABLE "pages_blocks_action_hero" DROP COLUMN IF EXISTS "badge", DROP COLUMN IF EXISTS "badge_link";
    `)
}
