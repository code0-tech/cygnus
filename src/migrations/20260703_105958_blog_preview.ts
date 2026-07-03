import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_blog_preview_section_layout" AS ENUM('imageCenter', 'imageLeft', 'imageRight');
  CREATE TABLE "pages_blocks_blog_preview" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"section_heading" varchar,
  	"section_layout" "enum_pages_blocks_blog_preview_section_layout" DEFAULT 'imageCenter' NOT NULL,
  	"section_description" varchar,
  	"blog_id" integer NOT NULL,
  	"show_border" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_blog_preview" ADD CONSTRAINT "pages_blocks_blog_preview_blog_id_blog_id_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blog"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_blog_preview" ADD CONSTRAINT "pages_blocks_blog_preview_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_blog_preview_order_idx" ON "pages_blocks_blog_preview" USING btree ("_order");
  CREATE INDEX "pages_blocks_blog_preview_parent_id_idx" ON "pages_blocks_blog_preview" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_blog_preview_path_idx" ON "pages_blocks_blog_preview" USING btree ("_path");
  CREATE INDEX "pages_blocks_blog_preview_locale_idx" ON "pages_blocks_blog_preview" USING btree ("_locale");
  CREATE INDEX "pages_blocks_blog_preview_blog_idx" ON "pages_blocks_blog_preview" USING btree ("blog_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_blog_preview" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_blog_preview_section_layout";`)
}
