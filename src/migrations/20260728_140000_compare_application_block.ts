import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_compare_application_buttons_variant" AS ENUM('none', 'normal', 'outlined', 'filled');
  CREATE TYPE "public"."enum_pages_blocks_compare_application_section_layout" AS ENUM('center', 'left');
  CREATE TYPE "public"."enum_pages_blocks_compare_application_gradient" AS ENUM('blue', 'yellow', 'pink', 'aqua', 'brand', 'lime', 'magenta', 'neutral');
  CREATE TYPE "public"."enum_pages_blocks_compare_application_gradient_direction" AS ENUM('topLeft', 'topRight', 'bottomLeft', 'bottomRight');
  CREATE TABLE "pages_blocks_compare_application_apps_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"exists" boolean DEFAULT true
  );
  
  CREATE TABLE "pages_blocks_compare_application_apps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer NOT NULL,
  	"name" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_compare_application_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"variant" "enum_pages_blocks_compare_application_buttons_variant" DEFAULT 'normal'
  );
  
  CREATE TABLE "pages_blocks_compare_application" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"section_heading" varchar,
  	"section_layout" "enum_pages_blocks_compare_application_section_layout" DEFAULT 'center' NOT NULL,
  	"section_description" varchar,
  	"section_link_button_label" varchar,
  	"section_link_button_url" varchar,
  	"show_icon" boolean DEFAULT true,
  	"gradient" "enum_pages_blocks_compare_application_gradient" DEFAULT 'blue',
  	"gradient_direction" "enum_pages_blocks_compare_application_gradient_direction" DEFAULT 'topLeft',
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_compare_application_apps_features" ADD CONSTRAINT "pages_blocks_compare_application_apps_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_compare_application_apps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_compare_application_apps" ADD CONSTRAINT "pages_blocks_compare_application_apps_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_compare_application_apps" ADD CONSTRAINT "pages_blocks_compare_application_apps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_compare_application"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_compare_application_buttons" ADD CONSTRAINT "pages_blocks_compare_application_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_compare_application"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_compare_application" ADD CONSTRAINT "pages_blocks_compare_application_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_compare_application_apps_features_order_idx" ON "pages_blocks_compare_application_apps_features" USING btree ("_order");
  CREATE INDEX "pages_blocks_compare_application_apps_features_parent_id_idx" ON "pages_blocks_compare_application_apps_features" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_compare_application_apps_features_locale_idx" ON "pages_blocks_compare_application_apps_features" USING btree ("_locale");
  CREATE INDEX "pages_blocks_compare_application_apps_order_idx" ON "pages_blocks_compare_application_apps" USING btree ("_order");
  CREATE INDEX "pages_blocks_compare_application_apps_parent_id_idx" ON "pages_blocks_compare_application_apps" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_compare_application_apps_locale_idx" ON "pages_blocks_compare_application_apps" USING btree ("_locale");
  CREATE INDEX "pages_blocks_compare_application_apps_logo_idx" ON "pages_blocks_compare_application_apps" USING btree ("logo_id");
  CREATE INDEX "pages_blocks_compare_application_buttons_order_idx" ON "pages_blocks_compare_application_buttons" USING btree ("_order");
  CREATE INDEX "pages_blocks_compare_application_buttons_parent_id_idx" ON "pages_blocks_compare_application_buttons" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_compare_application_buttons_locale_idx" ON "pages_blocks_compare_application_buttons" USING btree ("_locale");
  CREATE INDEX "pages_blocks_compare_application_order_idx" ON "pages_blocks_compare_application" USING btree ("_order");
  CREATE INDEX "pages_blocks_compare_application_parent_id_idx" ON "pages_blocks_compare_application" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_compare_application_path_idx" ON "pages_blocks_compare_application" USING btree ("_path");
  CREATE INDEX "pages_blocks_compare_application_locale_idx" ON "pages_blocks_compare_application" USING btree ("_locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_compare_application_apps_features" CASCADE;
  DROP TABLE "pages_blocks_compare_application_apps" CASCADE;
  DROP TABLE "pages_blocks_compare_application_buttons" CASCADE;
  DROP TABLE "pages_blocks_compare_application" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_compare_application_buttons_variant";
  DROP TYPE "public"."enum_pages_blocks_compare_application_section_layout";
  DROP TYPE "public"."enum_pages_blocks_compare_application_gradient";
  DROP TYPE "public"."enum_pages_blocks_compare_application_gradient_direction";`)
}
