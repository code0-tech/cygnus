import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "blog" DROP CONSTRAINT "blog_og_image_id_media_id_fk";
  
  ALTER TABLE "blog" DROP CONSTRAINT "blog_twitter_image_id_media_id_fk";
  
  DROP INDEX "blog_og_image_idx";
  DROP INDEX "blog_twitter_image_idx";
  ALTER TABLE "pages_locales" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "pages_locales" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "pages_locales" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "blog_locales" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "blog_locales" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blog_locales" ADD CONSTRAINT "blog_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_meta_meta_image_idx" ON "pages_locales" USING btree ("meta_image_id","_locale");
  CREATE INDEX "blog_meta_meta_image_idx" ON "blog_locales" USING btree ("meta_image_id","_locale");
  ALTER TABLE "blog" DROP COLUMN "og_image_id";
  ALTER TABLE "blog" DROP COLUMN "twitter_image_id";
  ALTER TABLE "blog_locales" DROP COLUMN "meta_keywords";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_locales" DROP CONSTRAINT "pages_locales_meta_image_id_media_id_fk";
  
  ALTER TABLE "blog_locales" DROP CONSTRAINT "blog_locales_meta_image_id_media_id_fk";
  
  DROP INDEX "pages_meta_meta_image_idx";
  DROP INDEX "blog_meta_meta_image_idx";
  ALTER TABLE "blog" ADD COLUMN "og_image_id" integer;
  ALTER TABLE "blog" ADD COLUMN "twitter_image_id" integer;
  ALTER TABLE "blog_locales" ADD COLUMN "meta_keywords" varchar;
  ALTER TABLE "blog" ADD CONSTRAINT "blog_og_image_id_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blog" ADD CONSTRAINT "blog_twitter_image_id_media_id_fk" FOREIGN KEY ("twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "blog_og_image_idx" ON "blog" USING btree ("og_image_id");
  CREATE INDEX "blog_twitter_image_idx" ON "blog" USING btree ("twitter_image_id");
  ALTER TABLE "pages_locales" DROP COLUMN "meta_title";
  ALTER TABLE "pages_locales" DROP COLUMN "meta_description";
  ALTER TABLE "pages_locales" DROP COLUMN "meta_image_id";
  ALTER TABLE "blog_locales" DROP COLUMN "meta_title";
  ALTER TABLE "blog_locales" DROP COLUMN "meta_image_id";`)
}
