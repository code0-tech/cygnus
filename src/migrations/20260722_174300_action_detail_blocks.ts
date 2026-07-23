import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "pages_blocks_action_hero" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "_path" text NOT NULL,
        "_locale" "_locales" NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        CONSTRAINT "pages_blocks_action_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pages"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "pages_blocks_action_hero_order_idx" ON "pages_blocks_action_hero" ("_order");
      CREATE INDEX IF NOT EXISTS "pages_blocks_action_hero_parent_id_idx" ON "pages_blocks_action_hero" ("_parent_id");
      CREATE INDEX IF NOT EXISTS "pages_blocks_action_hero_locale_idx" ON "pages_blocks_action_hero" ("_locale");

      CREATE TABLE IF NOT EXISTS "pages_blocks_action_details" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "_path" text NOT NULL,
        "_locale" "_locales" NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "section_heading" varchar,
        "section_description" varchar,
        "flow_types_label" varchar NOT NULL DEFAULT 'FlowTypes',
        "function_definitions_label" varchar NOT NULL DEFAULT 'FunctionDefinitions',
        CONSTRAINT "pages_blocks_action_details_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pages"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "pages_blocks_action_details_order_idx" ON "pages_blocks_action_details" ("_order");
      CREATE INDEX IF NOT EXISTS "pages_blocks_action_details_parent_id_idx" ON "pages_blocks_action_details" ("_parent_id");
      CREATE INDEX IF NOT EXISTS "pages_blocks_action_details_locale_idx" ON "pages_blocks_action_details" ("_locale");

      CREATE TABLE IF NOT EXISTS "pages_blocks_action_references" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "_path" text NOT NULL,
        "_locale" "_locales" NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "label" varchar NOT NULL DEFAULT 'References',
        CONSTRAINT "pages_blocks_action_references_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pages"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "pages_blocks_action_references_order_idx" ON "pages_blocks_action_references" ("_order");
      CREATE INDEX IF NOT EXISTS "pages_blocks_action_references_parent_id_idx" ON "pages_blocks_action_references" ("_parent_id");
      CREATE INDEX IF NOT EXISTS "pages_blocks_action_references_locale_idx" ON "pages_blocks_action_references" ("_locale");
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
      DROP TABLE IF EXISTS "pages_blocks_action_references";
      DROP TABLE IF EXISTS "pages_blocks_action_details";
      DROP TABLE IF EXISTS "pages_blocks_action_hero";
    `)
}
