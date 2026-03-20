import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_hero" ADD COLUMN "badge_link" varchar;
  ALTER TABLE "pages_blocks_usecase_use_cases" ADD COLUMN "image_id" integer;
  ALTER TABLE "pages_blocks_usecase_use_cases" ADD CONSTRAINT "pages_blocks_usecase_use_cases_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_usecase_use_cases_image_idx" ON "pages_blocks_usecase_use_cases" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_usecase_use_cases" DROP CONSTRAINT "pages_blocks_usecase_use_cases_image_id_media_id_fk";
  
  DROP INDEX "pages_blocks_usecase_use_cases_image_idx";
  ALTER TABLE "pages_blocks_hero" DROP COLUMN "badge_link";
  ALTER TABLE "pages_blocks_usecase_use_cases" DROP COLUMN "image_id";`)
}
