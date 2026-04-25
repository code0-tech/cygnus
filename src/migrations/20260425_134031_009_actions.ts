import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_pages_slug" ADD VALUE 'actions' BEFORE 'community-edition';
  CREATE TABLE "pages_blocks_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Actions' NOT NULL,
  	"description" varchar DEFAULT 'Browse available actions and integrations.' NOT NULL,
  	"search_placeholder" varchar DEFAULT 'Search actions' NOT NULL,
  	"no_actions_found_label" varchar DEFAULT 'No actions found for your search.' NOT NULL,
  	"references_label" varchar DEFAULT 'References' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "actions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"icon_id" integer,
  	"trigger_id" integer,
  	"functiondefinitions_id" integer,
  	"documentation_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "actions_locales" (
  	"title" varchar NOT NULL,
  	"short_description" varchar,
  	"description" varchar,
  	"documentation_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "actions_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "actions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"actions_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "actions_id" integer;
  ALTER TABLE "pages_blocks_actions" ADD CONSTRAINT "pages_blocks_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "actions" ADD CONSTRAINT "actions_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "actions" ADD CONSTRAINT "actions_trigger_id_media_id_fk" FOREIGN KEY ("trigger_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "actions" ADD CONSTRAINT "actions_functiondefinitions_id_media_id_fk" FOREIGN KEY ("functiondefinitions_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "actions_locales" ADD CONSTRAINT "actions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."actions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "actions_texts" ADD CONSTRAINT "actions_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."actions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "actions_rels" ADD CONSTRAINT "actions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."actions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "actions_rels" ADD CONSTRAINT "actions_rels_actions_fk" FOREIGN KEY ("actions_id") REFERENCES "public"."actions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_actions_order_idx" ON "pages_blocks_actions" USING btree ("_order");
  CREATE INDEX "pages_blocks_actions_parent_id_idx" ON "pages_blocks_actions" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_actions_path_idx" ON "pages_blocks_actions" USING btree ("_path");
  CREATE INDEX "pages_blocks_actions_locale_idx" ON "pages_blocks_actions" USING btree ("_locale");
  CREATE UNIQUE INDEX "actions_slug_idx" ON "actions" USING btree ("slug");
  CREATE INDEX "actions_icon_idx" ON "actions" USING btree ("icon_id");
  CREATE INDEX "actions_trigger_idx" ON "actions" USING btree ("trigger_id");
  CREATE INDEX "actions_functiondefinitions_idx" ON "actions" USING btree ("functiondefinitions_id");
  CREATE INDEX "actions_updated_at_idx" ON "actions" USING btree ("updated_at");
  CREATE INDEX "actions_created_at_idx" ON "actions" USING btree ("created_at");
  CREATE UNIQUE INDEX "actions_locales_locale_parent_id_unique" ON "actions_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "actions_texts_order_parent" ON "actions_texts" USING btree ("order","parent_id");
  CREATE INDEX "actions_rels_order_idx" ON "actions_rels" USING btree ("order");
  CREATE INDEX "actions_rels_parent_idx" ON "actions_rels" USING btree ("parent_id");
  CREATE INDEX "actions_rels_path_idx" ON "actions_rels" USING btree ("path");
  CREATE INDEX "actions_rels_actions_id_idx" ON "actions_rels" USING btree ("actions_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_actions_fk" FOREIGN KEY ("actions_id") REFERENCES "public"."actions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_actions_id_idx" ON "payload_locked_documents_rels" USING btree ("actions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_actions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "actions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "actions_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "actions_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "actions_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_actions" CASCADE;
  DROP TABLE "actions" CASCADE;
  DROP TABLE "actions_locales" CASCADE;
  DROP TABLE "actions_texts" CASCADE;
  DROP TABLE "actions_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_actions_fk";
  
  ALTER TABLE "pages" ALTER COLUMN "slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_pages_slug";
  CREATE TYPE "public"."enum_pages_slug" AS ENUM('main', 'jobs', 'features', 'about-us', 'legal-notice', 'privacy', 'terms', 'contact', 'community-edition', 'enterprise-edition', 'subscription');
  ALTER TABLE "pages" ALTER COLUMN "slug" SET DATA TYPE "public"."enum_pages_slug" USING "slug"::"public"."enum_pages_slug";
  DROP INDEX "payload_locked_documents_rels_actions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "actions_id";`)
}
