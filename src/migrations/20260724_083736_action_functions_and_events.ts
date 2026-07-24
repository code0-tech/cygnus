import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
      ALTER TABLE "pages_blocks_action_details"
        RENAME TO "pages_blocks_action_functions";

      DO $$ BEGIN
        IF to_regtype('enum_pages_blocks_action_details_section_layout') IS NOT NULL
          AND to_regtype('enum_pages_blocks_action_functions_section_layout') IS NULL THEN
          ALTER TYPE "enum_pages_blocks_action_details_section_layout"
            RENAME TO "enum_pages_blocks_action_functions_section_layout";
        END IF;
      END $$;

      ALTER TABLE "pages_blocks_action_functions"
        DROP COLUMN IF EXISTS "flow_types_label";

      DO $$ BEGIN
        CREATE TYPE "enum_pages_blocks_action_events_section_layout" AS ENUM ('center', 'left');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      CREATE TABLE "pages_blocks_action_events" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "_path" text NOT NULL,
        "_locale" "_locales" NOT NULL,
        "id" varchar PRIMARY KEY NOT NULL,
        "section_heading" varchar,
        "section_layout" "enum_pages_blocks_action_events_section_layout" DEFAULT 'left' NOT NULL,
        "section_description" varchar,
        "section_link_button_label" varchar,
        "section_link_button_url" varchar,
        "events_label" varchar DEFAULT 'Events' NOT NULL,
        "block_name" varchar,
        CONSTRAINT "pages_blocks_action_events_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "pages"("id") ON DELETE CASCADE
      );

      CREATE INDEX "pages_blocks_action_events_order_idx"
        ON "pages_blocks_action_events" ("_order");
      CREATE INDEX "pages_blocks_action_events_parent_id_idx"
        ON "pages_blocks_action_events" ("_parent_id");
      CREATE INDEX "pages_blocks_action_events_locale_idx"
        ON "pages_blocks_action_events" ("_locale");
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
      DROP TABLE "pages_blocks_action_events";
      DROP TYPE IF EXISTS "enum_pages_blocks_action_events_section_layout";

      ALTER TABLE "pages_blocks_action_functions"
        ADD COLUMN "flow_types_label" varchar DEFAULT 'FlowTypes' NOT NULL;

      DO $$ BEGIN
        IF to_regtype('enum_pages_blocks_action_functions_section_layout') IS NOT NULL
          AND to_regtype('enum_pages_blocks_action_details_section_layout') IS NULL THEN
          ALTER TYPE "enum_pages_blocks_action_functions_section_layout"
            RENAME TO "enum_pages_blocks_action_details_section_layout";
        END IF;
      END $$;

      ALTER TABLE "pages_blocks_action_functions"
        RENAME TO "pages_blocks_action_details";
    `)
}
