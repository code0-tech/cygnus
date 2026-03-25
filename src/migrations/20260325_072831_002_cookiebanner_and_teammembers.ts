import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_footer_social_links_platform" AS ENUM('instagram', 'discord', 'x', 'github');
  CREATE TABLE "footer_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_footer_social_links_platform" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "cookie_banner" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cookie_banner_locales" (
  	"common_accept_all" varchar NOT NULL,
  	"common_reject_all" varchar NOT NULL,
  	"common_customize" varchar NOT NULL,
  	"common_save" varchar NOT NULL,
  	"cookie_banner_title" varchar NOT NULL,
  	"cookie_banner_description" varchar NOT NULL,
  	"consent_manager_dialog_title" varchar NOT NULL,
  	"consent_manager_dialog_description" varchar NOT NULL,
  	"consent_types_necessary_title" varchar NOT NULL,
  	"consent_types_necessary_description" varchar NOT NULL,
  	"consent_types_measurement_title" varchar NOT NULL,
  	"consent_types_measurement_description" varchar NOT NULL,
  	"consent_types_marketing_title" varchar NOT NULL,
  	"consent_types_marketing_description" varchar NOT NULL,
  	"legal_links_privacy_policy_label" varchar NOT NULL,
  	"legal_links_privacy_policy_href" varchar NOT NULL,
  	"legal_links_terms_of_service_label" varchar NOT NULL,
  	"legal_links_terms_of_service_href" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "team_members" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"image_id" integer,
  	"joined_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "team_members_locales" (
  	"short_description" varchar,
  	"about" varchar,
  	"role" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "users_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "users_locales" CASCADE;
  ALTER TABLE "blog" DROP CONSTRAINT "blog_author_id_users_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "cookie_banner_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "team_members_id" integer;
  ALTER TABLE "footer_social_links" ADD CONSTRAINT "footer_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cookie_banner_locales" ADD CONSTRAINT "cookie_banner_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cookie_banner"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "team_members" ADD CONSTRAINT "team_members_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "team_members_locales" ADD CONSTRAINT "team_members_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "footer_social_links_order_idx" ON "footer_social_links" USING btree ("_order");
  CREATE INDEX "footer_social_links_parent_id_idx" ON "footer_social_links" USING btree ("_parent_id");
  CREATE INDEX "cookie_banner_updated_at_idx" ON "cookie_banner" USING btree ("updated_at");
  CREATE INDEX "cookie_banner_created_at_idx" ON "cookie_banner" USING btree ("created_at");
  CREATE UNIQUE INDEX "cookie_banner_locales_locale_parent_id_unique" ON "cookie_banner_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "team_members_image_idx" ON "team_members" USING btree ("image_id");
  CREATE INDEX "team_members_updated_at_idx" ON "team_members" USING btree ("updated_at");
  CREATE INDEX "team_members_created_at_idx" ON "team_members" USING btree ("created_at");
  CREATE UNIQUE INDEX "team_members_locales_locale_parent_id_unique" ON "team_members_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "blog" ADD CONSTRAINT "blog_author_id_team_members_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cookie_banner_fk" FOREIGN KEY ("cookie_banner_id") REFERENCES "public"."cookie_banner"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_cookie_banner_id_idx" ON "payload_locked_documents_rels" USING btree ("cookie_banner_id");
  CREATE INDEX "payload_locked_documents_rels_team_members_id_idx" ON "payload_locked_documents_rels" USING btree ("team_members_id");
  ALTER TABLE "users" DROP COLUMN "joined_at";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "users_locales" (
  	"short_description" varchar,
  	"about" varchar,
  	"role" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "footer_social_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cookie_banner" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cookie_banner_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "team_members" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "team_members_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "footer_social_links" CASCADE;
  DROP TABLE "cookie_banner" CASCADE;
  DROP TABLE "cookie_banner_locales" CASCADE;
  DROP TABLE "team_members" CASCADE;
  DROP TABLE "team_members_locales" CASCADE;
  ALTER TABLE "blog" DROP CONSTRAINT "blog_author_id_team_members_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_cookie_banner_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_team_members_fk";
  
  DROP INDEX "payload_locked_documents_rels_cookie_banner_id_idx";
  DROP INDEX "payload_locked_documents_rels_team_members_id_idx";
  ALTER TABLE "users" ADD COLUMN "joined_at" timestamp(3) with time zone;
  ALTER TABLE "users_locales" ADD CONSTRAINT "users_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "users_locales_locale_parent_id_unique" ON "users_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "blog" ADD CONSTRAINT "blog_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "cookie_banner_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "team_members_id";
  DROP TYPE "public"."enum_footer_social_links_platform";`)
}
