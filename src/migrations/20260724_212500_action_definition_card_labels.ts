import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
      ALTER TABLE "pages_blocks_action_functions"
        ADD COLUMN IF NOT EXISTS "function_definition_label" varchar DEFAULT 'FunctionDefinition' NOT NULL,
        ADD COLUMN IF NOT EXISTS "parameters_label" varchar DEFAULT 'Parameters' NOT NULL;

      ALTER TABLE "pages_blocks_action_events"
        ADD COLUMN IF NOT EXISTS "flow_type_label" varchar DEFAULT 'FlowType' NOT NULL,
        ADD COLUMN IF NOT EXISTS "settings_label" varchar DEFAULT 'Settings' NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
      ALTER TABLE "pages_blocks_action_events"
        DROP COLUMN IF EXISTS "settings_label",
        DROP COLUMN IF EXISTS "flow_type_label";

      ALTER TABLE "pages_blocks_action_functions"
        DROP COLUMN IF EXISTS "parameters_label",
        DROP COLUMN IF EXISTS "function_definition_label";
    `)
}
