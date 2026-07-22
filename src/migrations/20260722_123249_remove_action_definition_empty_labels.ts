import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_actions" DROP COLUMN "no_flow_types_found_label";
  ALTER TABLE "pages_blocks_actions" DROP COLUMN "no_function_definitions_found_label";
  ALTER TABLE "pages_blocks_actions" DROP COLUMN "no_action_definitions_found_label";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_actions" ADD COLUMN "no_flow_types_found_label" varchar DEFAULT 'No flow types found.' NOT NULL;
  ALTER TABLE "pages_blocks_actions" ADD COLUMN "no_function_definitions_found_label" varchar DEFAULT 'No function definitions found.' NOT NULL;
  ALTER TABLE "pages_blocks_actions" ADD COLUMN "no_action_definitions_found_label" varchar DEFAULT 'No flow types or function definitions found.' NOT NULL;`)
}
