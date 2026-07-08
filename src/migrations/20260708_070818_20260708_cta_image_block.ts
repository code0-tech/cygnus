import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_cta_image_buttons_variant" AS ENUM('none', 'normal', 'outlined', 'filled');
  CREATE TYPE "public"."enum_pages_blocks_cta_image_image_mask" AS ENUM('top', 'right', 'bottom', 'left');
  CREATE TABLE "pages_blocks_cta_image_texts" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_cta_image_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"variant" "enum_pages_blocks_cta_image_buttons_variant" DEFAULT 'normal'
  );
  
  CREATE TABLE "pages_blocks_cta_image_image_mask" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_pages_blocks_cta_image_image_mask",
  	"locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "pages_blocks_cta_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"image_id" integer,
  	"show_card" boolean DEFAULT true,
  	"show_image_border" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_cta_image_texts" ADD CONSTRAINT "pages_blocks_cta_image_texts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cta_image"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta_image_buttons" ADD CONSTRAINT "pages_blocks_cta_image_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cta_image"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta_image_image_mask" ADD CONSTRAINT "pages_blocks_cta_image_image_mask_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages_blocks_cta_image"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta_image" ADD CONSTRAINT "pages_blocks_cta_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta_image" ADD CONSTRAINT "pages_blocks_cta_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_cta_image_texts_order_idx" ON "pages_blocks_cta_image_texts" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_image_texts_parent_id_idx" ON "pages_blocks_cta_image_texts" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_image_texts_locale_idx" ON "pages_blocks_cta_image_texts" USING btree ("_locale");
  CREATE INDEX "pages_blocks_cta_image_buttons_order_idx" ON "pages_blocks_cta_image_buttons" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_image_buttons_parent_id_idx" ON "pages_blocks_cta_image_buttons" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_image_buttons_locale_idx" ON "pages_blocks_cta_image_buttons" USING btree ("_locale");
  CREATE INDEX "pages_blocks_cta_image_image_mask_order_idx" ON "pages_blocks_cta_image_image_mask" USING btree ("order");
  CREATE INDEX "pages_blocks_cta_image_image_mask_parent_idx" ON "pages_blocks_cta_image_image_mask" USING btree ("parent_id");
  CREATE INDEX "pages_blocks_cta_image_image_mask_locale_idx" ON "pages_blocks_cta_image_image_mask" USING btree ("locale");
  CREATE INDEX "pages_blocks_cta_image_order_idx" ON "pages_blocks_cta_image" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_image_parent_id_idx" ON "pages_blocks_cta_image" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_image_path_idx" ON "pages_blocks_cta_image" USING btree ("_path");
  CREATE INDEX "pages_blocks_cta_image_locale_idx" ON "pages_blocks_cta_image" USING btree ("_locale");
  CREATE INDEX "pages_blocks_cta_image_image_idx" ON "pages_blocks_cta_image" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_cta_image_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_cta_image_buttons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_cta_image_image_mask" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_cta_image" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_cta_image_texts" CASCADE;
  DROP TABLE "pages_blocks_cta_image_buttons" CASCADE;
  DROP TABLE "pages_blocks_cta_image_image_mask" CASCADE;
  DROP TABLE "pages_blocks_cta_image" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_cta_image_buttons_variant";
  DROP TYPE "public"."enum_pages_blocks_cta_image_image_mask";`)
}
