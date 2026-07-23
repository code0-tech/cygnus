import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_actions" ADD COLUMN "flow_types_label" varchar DEFAULT 'FlowTypes' NOT NULL;
  ALTER TABLE "pages_blocks_actions" ADD COLUMN "function_definitions_label" varchar DEFAULT 'FunctionDefinitions' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_actions" DROP COLUMN "flow_types_label";
  ALTER TABLE "pages_blocks_actions" DROP COLUMN "function_definitions_label";`)
}
