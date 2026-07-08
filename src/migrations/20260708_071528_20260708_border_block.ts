import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_border" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"padding_top" numeric DEFAULT 0,
  	"padding_bottom" numeric DEFAULT 0,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_border" ADD CONSTRAINT "pages_blocks_border_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_border_order_idx" ON "pages_blocks_border" USING btree ("_order");
  CREATE INDEX "pages_blocks_border_parent_id_idx" ON "pages_blocks_border" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_border_path_idx" ON "pages_blocks_border" USING btree ("_path");
  CREATE INDEX "pages_blocks_border_locale_idx" ON "pages_blocks_border" USING btree ("_locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_border" CASCADE;`)
}
