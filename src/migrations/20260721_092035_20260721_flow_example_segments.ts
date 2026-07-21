import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_flow_example_flow_items_segments_type" AS ENUM('text', 'literal', 'reference', 'node');
  CREATE TYPE "public"."enum_pages_blocks_flow_example_flow_items_color" AS ENUM('brand', 'yellow', 'aqua', 'blue', 'pink');
  CREATE TABLE "pages_blocks_flow_example_flow_items_segments" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_pages_blocks_flow_example_flow_items_segments_type" DEFAULT 'text' NOT NULL,
  	"value" varchar NOT NULL
  );
  
  ALTER TABLE "pages_blocks_flow_example_flow_items" DROP COLUMN "icon";
  ALTER TABLE "pages_blocks_flow_example_flow_items" DROP COLUMN "text";
  ALTER TABLE "pages_blocks_flow_example_flow_items" ADD COLUMN "color" "enum_pages_blocks_flow_example_flow_items_color" DEFAULT 'brand' NOT NULL;
  ALTER TABLE "pages_blocks_flow_example_flow_items" ADD COLUMN "outline" boolean DEFAULT true;
  ALTER TABLE "pages_blocks_flow_example_flow_items_segments" ADD CONSTRAINT "pages_blocks_flow_example_flow_items_segments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_flow_example_flow_items"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_flow_example_flow_items_segments_order_idx" ON "pages_blocks_flow_example_flow_items_segments" USING btree ("_order");
  CREATE INDEX "pages_blocks_flow_example_flow_items_segments_parent_id_idx" ON "pages_blocks_flow_example_flow_items_segments" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_flow_example_flow_items_segments_locale_idx" ON "pages_blocks_flow_example_flow_items_segments" USING btree ("_locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_flow_example_flow_items_segments" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_flow_example_flow_items_segments" CASCADE;
  ALTER TABLE "pages_blocks_flow_example_flow_items" ADD COLUMN "icon" varchar DEFAULT '' NOT NULL;
  ALTER TABLE "pages_blocks_flow_example_flow_items" ADD COLUMN "text" varchar DEFAULT '' NOT NULL;
  ALTER TABLE "pages_blocks_flow_example_flow_items" DROP COLUMN "color";
  ALTER TABLE "pages_blocks_flow_example_flow_items" DROP COLUMN "outline";
  DROP TYPE "public"."enum_pages_blocks_flow_example_flow_items_segments_type";
  DROP TYPE "public"."enum_pages_blocks_flow_example_flow_items_color";`)
}
