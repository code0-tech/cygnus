import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "actions" ADD COLUMN "identifier" varchar;
  UPDATE "actions" SET "identifier" = 'action-' || "id" WHERE "identifier" IS NULL;
  ALTER TABLE "actions" ALTER COLUMN "identifier" SET NOT NULL;
  CREATE UNIQUE INDEX "actions_identifier_idx" ON "actions" USING btree ("identifier");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "actions_identifier_idx";
  ALTER TABLE "actions" DROP COLUMN "identifier";`)
}
