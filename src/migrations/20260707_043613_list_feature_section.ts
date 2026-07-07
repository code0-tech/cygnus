import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_list_feature_section_layout" AS ENUM('center', 'left');
  CREATE TABLE "pages_blocks_list_feature_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" varchar,
  	"title" varchar NOT NULL,
  	"description" varchar
  );
  
  CREATE TABLE "pages_blocks_list_feature" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"section_heading" varchar,
  	"section_layout" "enum_pages_blocks_list_feature_section_layout" DEFAULT 'center' NOT NULL,
  	"section_description" varchar,
  	"section_link_button_label" varchar,
  	"section_link_button_url" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_list_feature_features" ADD CONSTRAINT "pages_blocks_list_feature_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_list_feature"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_list_feature" ADD CONSTRAINT "pages_blocks_list_feature_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_list_feature_features_order_idx" ON "pages_blocks_list_feature_features" USING btree ("_order");
  CREATE INDEX "pages_blocks_list_feature_features_parent_id_idx" ON "pages_blocks_list_feature_features" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_list_feature_features_locale_idx" ON "pages_blocks_list_feature_features" USING btree ("_locale");
  CREATE INDEX "pages_blocks_list_feature_order_idx" ON "pages_blocks_list_feature" USING btree ("_order");
  CREATE INDEX "pages_blocks_list_feature_parent_id_idx" ON "pages_blocks_list_feature" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_list_feature_path_idx" ON "pages_blocks_list_feature" USING btree ("_path");
  CREATE INDEX "pages_blocks_list_feature_locale_idx" ON "pages_blocks_list_feature" USING btree ("_locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_list_feature_features" CASCADE;
  DROP TABLE "pages_blocks_list_feature" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_list_feature_section_layout";`)
}
