import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

// IF NOT EXISTS: local databases may already have the columns from Payload's dev schema push.
export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "pages_blocks_action_events"
            ADD COLUMN IF NOT EXISTS "show_all_label" varchar DEFAULT 'Show all' NOT NULL,
            ADD COLUMN IF NOT EXISTS "show_less_label" varchar DEFAULT 'Show less' NOT NULL;
        ALTER TABLE "pages_blocks_action_functions"
            ADD COLUMN IF NOT EXISTS "show_all_label" varchar DEFAULT 'Show all' NOT NULL,
            ADD COLUMN IF NOT EXISTS "show_less_label" varchar DEFAULT 'Show less' NOT NULL;

        UPDATE "pages_blocks_action_events" SET "show_all_label" = 'Alle anzeigen' WHERE "_locale" = 'de' AND "show_all_label" = 'Show all';
        UPDATE "pages_blocks_action_events" SET "show_less_label" = 'Weniger anzeigen' WHERE "_locale" = 'de' AND "show_less_label" = 'Show less';
        UPDATE "pages_blocks_action_functions" SET "show_all_label" = 'Alle anzeigen' WHERE "_locale" = 'de' AND "show_all_label" = 'Show all';
        UPDATE "pages_blocks_action_functions" SET "show_less_label" = 'Weniger anzeigen' WHERE "_locale" = 'de' AND "show_less_label" = 'Show less';
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "pages_blocks_action_functions" DROP COLUMN IF EXISTS "show_less_label", DROP COLUMN IF EXISTS "show_all_label";
        ALTER TABLE "pages_blocks_action_events" DROP COLUMN IF EXISTS "show_less_label", DROP COLUMN IF EXISTS "show_all_label";
    `)
}
