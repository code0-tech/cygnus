import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_usecase_use_cases" ADD COLUMN "link_label" varchar;
  ALTER TABLE "pages_blocks_usecase_use_cases" ADD COLUMN "link_url" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_usecase_use_cases" DROP COLUMN "link_label";
  ALTER TABLE "pages_blocks_usecase_use_cases" DROP COLUMN "link_url";`)
}
