import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
      ALTER TABLE "pages_blocks_action_functions"
        DROP COLUMN IF EXISTS "function_definitions_label";
      ALTER TABLE "pages_blocks_action_events"
        DROP COLUMN IF EXISTS "events_label";
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
      ALTER TABLE "pages_blocks_action_functions"
        ADD COLUMN "function_definitions_label" varchar DEFAULT 'FunctionDefinitions' NOT NULL;
      ALTER TABLE "pages_blocks_action_events"
        ADD COLUMN "events_label" varchar DEFAULT 'Events' NOT NULL;
    `)
}
