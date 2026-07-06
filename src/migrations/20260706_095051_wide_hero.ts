import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_widehero_buttons_variant" AS ENUM('none', 'normal', 'outlined', 'filled');
  CREATE TABLE "pages_blocks_widehero_texts" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_widehero_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"variant" "enum_pages_blocks_widehero_buttons_variant" DEFAULT 'normal'
  );
  
  CREATE TABLE "pages_blocks_widehero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"badge" varchar,
  	"badge_link" varchar,
  	"heading" varchar NOT NULL,
  	"image_id" integer,
  	"shine_colors_color1" varchar,
  	"shine_colors_color2" varchar,
  	"shine_colors_color3" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_widehero_texts" ADD CONSTRAINT "pages_blocks_widehero_texts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_widehero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_widehero_buttons" ADD CONSTRAINT "pages_blocks_widehero_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_widehero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_widehero" ADD CONSTRAINT "pages_blocks_widehero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_widehero" ADD CONSTRAINT "pages_blocks_widehero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_widehero_texts_order_idx" ON "pages_blocks_widehero_texts" USING btree ("_order");
  CREATE INDEX "pages_blocks_widehero_texts_parent_id_idx" ON "pages_blocks_widehero_texts" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_widehero_texts_locale_idx" ON "pages_blocks_widehero_texts" USING btree ("_locale");
  CREATE INDEX "pages_blocks_widehero_buttons_order_idx" ON "pages_blocks_widehero_buttons" USING btree ("_order");
  CREATE INDEX "pages_blocks_widehero_buttons_parent_id_idx" ON "pages_blocks_widehero_buttons" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_widehero_buttons_locale_idx" ON "pages_blocks_widehero_buttons" USING btree ("_locale");
  CREATE INDEX "pages_blocks_widehero_order_idx" ON "pages_blocks_widehero" USING btree ("_order");
  CREATE INDEX "pages_blocks_widehero_parent_id_idx" ON "pages_blocks_widehero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_widehero_path_idx" ON "pages_blocks_widehero" USING btree ("_path");
  CREATE INDEX "pages_blocks_widehero_locale_idx" ON "pages_blocks_widehero" USING btree ("_locale");
  CREATE INDEX "pages_blocks_widehero_image_idx" ON "pages_blocks_widehero" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_widehero_texts" CASCADE;
  DROP TABLE "pages_blocks_widehero_buttons" CASCADE;
  DROP TABLE "pages_blocks_widehero" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_widehero_buttons_variant";`)
}
