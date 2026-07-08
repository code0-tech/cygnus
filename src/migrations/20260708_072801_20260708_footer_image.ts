import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "footer" ADD COLUMN "image_id" integer;
  ALTER TABLE "footer" ADD CONSTRAINT "footer_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "footer_image_idx" ON "footer" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "footer" DROP CONSTRAINT "footer_image_id_media_id_fk";
  
  DROP INDEX "footer_image_idx";
  ALTER TABLE "footer" DROP COLUMN "image_id";`)
}
