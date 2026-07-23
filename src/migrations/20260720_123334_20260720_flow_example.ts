import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_flow_example_section_layout" AS ENUM('flowCenter', 'flowLeft', 'flowRight');
  CREATE TABLE "pages_blocks_flow_example_flow_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" varchar NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_flow_example" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"section_heading" varchar,
  	"section_layout" "enum_pages_blocks_flow_example_section_layout" DEFAULT 'flowCenter' NOT NULL,
  	"section_description" varchar,
  	"section_link_button_label" varchar,
  	"section_link_button_url" varchar,
  	"content_heading" varchar,
  	"content_description" varchar,
  	"flow_trigger_icon" varchar NOT NULL,
  	"flow_trigger_name" varchar NOT NULL,
  	"show_border" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_flow_example_flow_items" ADD CONSTRAINT "pages_blocks_flow_example_flow_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_flow_example"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_flow_example" ADD CONSTRAINT "pages_blocks_flow_example_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_flow_example_flow_items_order_idx" ON "pages_blocks_flow_example_flow_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_flow_example_flow_items_parent_id_idx" ON "pages_blocks_flow_example_flow_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_flow_example_flow_items_locale_idx" ON "pages_blocks_flow_example_flow_items" USING btree ("_locale");
  CREATE INDEX "pages_blocks_flow_example_order_idx" ON "pages_blocks_flow_example" USING btree ("_order");
  CREATE INDEX "pages_blocks_flow_example_parent_id_idx" ON "pages_blocks_flow_example" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_flow_example_path_idx" ON "pages_blocks_flow_example" USING btree ("_path");
  CREATE INDEX "pages_blocks_flow_example_locale_idx" ON "pages_blocks_flow_example" USING btree ("_locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_flow_example_flow_items" CASCADE;
  DROP TABLE "pages_blocks_flow_example" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_flow_example_section_layout";`)
}
