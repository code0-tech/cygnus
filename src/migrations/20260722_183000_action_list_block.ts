import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "pages_blocks_action_list" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "_path" text NOT NULL,
        "_locale" "_locales" NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "section_heading" varchar DEFAULT 'Actions',
        "section_description" varchar DEFAULT 'Browse available actions and integrations.',
        "search_placeholder" varchar NOT NULL DEFAULT 'Search actions',
        "no_actions_found_label" varchar NOT NULL DEFAULT 'No actions found for your search.',
        CONSTRAINT "pages_blocks_action_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "pages"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "pages_blocks_action_list_order_idx" ON "pages_blocks_action_list" ("_order");
      CREATE INDEX IF NOT EXISTS "pages_blocks_action_list_parent_id_idx" ON "pages_blocks_action_list" ("_parent_id");
      CREATE INDEX IF NOT EXISTS "pages_blocks_action_list_locale_idx" ON "pages_blocks_action_list" ("_locale");
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`DROP TABLE IF EXISTS "pages_blocks_action_list";`)
}
