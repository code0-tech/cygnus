import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_edition_hero_buttons_variant" AS ENUM('none', 'normal', 'outlined', 'filled');
  CREATE TYPE "public"."enum_subscription_config_deployment_self_hosted_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue');
  CREATE TYPE "public"."enum_subscription_config_deployment_cloud_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue');
  CREATE TYPE "public"."enum_subscription_config_customer_type_b2b_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue');
  CREATE TYPE "public"."enum_subscription_config_customer_type_b2c_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue');
  CREATE TYPE "public"."enum_subscription_config_subscription_tier_pro_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue');
  CREATE TYPE "public"."enum_subscription_config_subscription_tier_team_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue');
  ALTER TYPE "public"."enum_pages_slug" ADD VALUE 'community-edition';
  ALTER TYPE "public"."enum_pages_slug" ADD VALUE 'enterprise-edition';
  ALTER TYPE "public"."enum_pages_slug" ADD VALUE 'subscription';
  CREATE TABLE "pages_blocks_edition_hero_texts" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_edition_hero_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"variant" "enum_pages_blocks_edition_hero_buttons_variant" DEFAULT 'normal'
  );
  
  CREATE TABLE "pages_blocks_edition_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"image_alt" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_edition_features_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"image_id" integer,
  	"link_label" varchar,
  	"link_url" varchar
  );
  
  CREATE TABLE "pages_blocks_edition_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_edition_install" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"subheading" varchar NOT NULL,
  	"label" varchar,
  	"code" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_edition_use_cases_use_cases" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"image_id" integer,
  	"link_label" varchar,
  	"link_url" varchar
  );
  
  CREATE TABLE "pages_blocks_edition_use_cases" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"subheading" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "subscription_config_feature_overview" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" varchar NOT NULL
  );
  
  CREATE TABLE "subscription_config_feature_overview_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "subscription_config_additional_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" varchar NOT NULL,
  	"price" numeric DEFAULT 0 NOT NULL
  );
  
  CREATE TABLE "subscription_config_additional_features_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "subscription_config" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Subscription Config' NOT NULL,
  	"deployment_self_hosted_icon" varchar NOT NULL,
  	"deployment_self_hosted_color" "enum_subscription_config_deployment_self_hosted_color" DEFAULT 'yellow' NOT NULL,
  	"deployment_cloud_icon" varchar NOT NULL,
  	"deployment_cloud_color" "enum_subscription_config_deployment_cloud_color" DEFAULT 'aqua' NOT NULL,
  	"customer_type_b2b_icon" varchar NOT NULL,
  	"customer_type_b2b_color" "enum_subscription_config_customer_type_b2b_color" DEFAULT 'blue' NOT NULL,
  	"customer_type_b2c_icon" varchar NOT NULL,
  	"customer_type_b2c_color" "enum_subscription_config_customer_type_b2c_color" DEFAULT 'pink' NOT NULL,
  	"subscription_tier_pro_icon" varchar NOT NULL,
  	"subscription_tier_pro_color" "enum_subscription_config_subscription_tier_pro_color" DEFAULT 'brand' NOT NULL,
  	"subscription_tier_team_icon" varchar NOT NULL,
  	"subscription_tier_team_color" "enum_subscription_config_subscription_tier_team_color" DEFAULT 'aqua' NOT NULL,
  	"team_seats_min" numeric DEFAULT 2 NOT NULL,
  	"team_seats_max" numeric DEFAULT 250 NOT NULL,
  	"team_seats_step" numeric DEFAULT 1 NOT NULL,
  	"runtime_min" numeric DEFAULT 200 NOT NULL,
  	"runtime_max" numeric DEFAULT 10000 NOT NULL,
  	"runtime_step" numeric DEFAULT 100 NOT NULL,
  	"contact_sales_href" varchar NOT NULL,
  	"subscribe_base_url" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "subscription_config_locales" (
  	"page_intro_heading" varchar NOT NULL,
  	"page_intro_description" varchar NOT NULL,
  	"options_panel_heading" varchar NOT NULL,
  	"deployment_label" varchar NOT NULL,
  	"deployment_self_hosted_title" varchar NOT NULL,
  	"deployment_self_hosted_description" varchar NOT NULL,
  	"deployment_cloud_title" varchar NOT NULL,
  	"deployment_cloud_description" varchar NOT NULL,
  	"customer_type_label" varchar NOT NULL,
  	"customer_type_b2b_title" varchar NOT NULL,
  	"customer_type_b2b_description" varchar NOT NULL,
  	"customer_type_b2c_title" varchar NOT NULL,
  	"customer_type_b2c_description" varchar NOT NULL,
  	"subscription_tier_label" varchar NOT NULL,
  	"subscription_tier_pro_title" varchar NOT NULL,
  	"subscription_tier_pro_description" varchar NOT NULL,
  	"subscription_tier_team_title" varchar NOT NULL,
  	"subscription_tier_team_description" varchar NOT NULL,
  	"team_seats_title" varchar NOT NULL,
  	"team_seats_description" varchar NOT NULL,
  	"team_seats_min_label" varchar NOT NULL,
  	"team_seats_max_label" varchar NOT NULL,
  	"team_seats_center_suffix" varchar NOT NULL,
  	"runtime_title" varchar NOT NULL,
  	"runtime_description" varchar NOT NULL,
  	"runtime_monthly_label" varchar NOT NULL,
  	"runtime_payg_label" varchar NOT NULL,
  	"runtime_payg_description" varchar NOT NULL,
  	"runtime_min_label" varchar NOT NULL,
  	"runtime_max_label" varchar NOT NULL,
  	"runtime_center_suffix" varchar NOT NULL,
  	"contact_sales_prompt" varchar NOT NULL,
  	"contact_sales_label" varchar NOT NULL,
  	"subscribe_label" varchar NOT NULL,
  	"price_heading" varchar NOT NULL,
  	"price_caption" varchar NOT NULL,
  	"additional_features_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "subscription_config_id" integer;
  ALTER TABLE "pages_blocks_edition_hero_texts" ADD CONSTRAINT "pages_blocks_edition_hero_texts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_edition_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_edition_hero_buttons" ADD CONSTRAINT "pages_blocks_edition_hero_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_edition_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_edition_hero" ADD CONSTRAINT "pages_blocks_edition_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_edition_features_features" ADD CONSTRAINT "pages_blocks_edition_features_features_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_edition_features_features" ADD CONSTRAINT "pages_blocks_edition_features_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_edition_features"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_edition_features" ADD CONSTRAINT "pages_blocks_edition_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_edition_install" ADD CONSTRAINT "pages_blocks_edition_install_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_edition_use_cases_use_cases" ADD CONSTRAINT "pages_blocks_edition_use_cases_use_cases_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_edition_use_cases_use_cases" ADD CONSTRAINT "pages_blocks_edition_use_cases_use_cases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_edition_use_cases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_edition_use_cases" ADD CONSTRAINT "pages_blocks_edition_use_cases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscription_config_feature_overview" ADD CONSTRAINT "subscription_config_feature_overview_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."subscription_config"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscription_config_feature_overview_locales" ADD CONSTRAINT "subscription_config_feature_overview_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."subscription_config_feature_overview"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscription_config_additional_features" ADD CONSTRAINT "subscription_config_additional_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."subscription_config"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscription_config_additional_features_locales" ADD CONSTRAINT "subscription_config_additional_features_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."subscription_config_additional_features"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscription_config_locales" ADD CONSTRAINT "subscription_config_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."subscription_config"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_edition_hero_texts_order_idx" ON "pages_blocks_edition_hero_texts" USING btree ("_order");
  CREATE INDEX "pages_blocks_edition_hero_texts_parent_id_idx" ON "pages_blocks_edition_hero_texts" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_edition_hero_texts_locale_idx" ON "pages_blocks_edition_hero_texts" USING btree ("_locale");
  CREATE INDEX "pages_blocks_edition_hero_buttons_order_idx" ON "pages_blocks_edition_hero_buttons" USING btree ("_order");
  CREATE INDEX "pages_blocks_edition_hero_buttons_parent_id_idx" ON "pages_blocks_edition_hero_buttons" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_edition_hero_buttons_locale_idx" ON "pages_blocks_edition_hero_buttons" USING btree ("_locale");
  CREATE INDEX "pages_blocks_edition_hero_order_idx" ON "pages_blocks_edition_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_edition_hero_parent_id_idx" ON "pages_blocks_edition_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_edition_hero_path_idx" ON "pages_blocks_edition_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_edition_hero_locale_idx" ON "pages_blocks_edition_hero" USING btree ("_locale");
  CREATE INDEX "pages_blocks_edition_features_features_order_idx" ON "pages_blocks_edition_features_features" USING btree ("_order");
  CREATE INDEX "pages_blocks_edition_features_features_parent_id_idx" ON "pages_blocks_edition_features_features" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_edition_features_features_locale_idx" ON "pages_blocks_edition_features_features" USING btree ("_locale");
  CREATE INDEX "pages_blocks_edition_features_features_image_idx" ON "pages_blocks_edition_features_features" USING btree ("image_id");
  CREATE INDEX "pages_blocks_edition_features_order_idx" ON "pages_blocks_edition_features" USING btree ("_order");
  CREATE INDEX "pages_blocks_edition_features_parent_id_idx" ON "pages_blocks_edition_features" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_edition_features_path_idx" ON "pages_blocks_edition_features" USING btree ("_path");
  CREATE INDEX "pages_blocks_edition_features_locale_idx" ON "pages_blocks_edition_features" USING btree ("_locale");
  CREATE INDEX "pages_blocks_edition_install_order_idx" ON "pages_blocks_edition_install" USING btree ("_order");
  CREATE INDEX "pages_blocks_edition_install_parent_id_idx" ON "pages_blocks_edition_install" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_edition_install_path_idx" ON "pages_blocks_edition_install" USING btree ("_path");
  CREATE INDEX "pages_blocks_edition_install_locale_idx" ON "pages_blocks_edition_install" USING btree ("_locale");
  CREATE INDEX "pages_blocks_edition_use_cases_use_cases_order_idx" ON "pages_blocks_edition_use_cases_use_cases" USING btree ("_order");
  CREATE INDEX "pages_blocks_edition_use_cases_use_cases_parent_id_idx" ON "pages_blocks_edition_use_cases_use_cases" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_edition_use_cases_use_cases_locale_idx" ON "pages_blocks_edition_use_cases_use_cases" USING btree ("_locale");
  CREATE INDEX "pages_blocks_edition_use_cases_use_cases_image_idx" ON "pages_blocks_edition_use_cases_use_cases" USING btree ("image_id");
  CREATE INDEX "pages_blocks_edition_use_cases_order_idx" ON "pages_blocks_edition_use_cases" USING btree ("_order");
  CREATE INDEX "pages_blocks_edition_use_cases_parent_id_idx" ON "pages_blocks_edition_use_cases" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_edition_use_cases_path_idx" ON "pages_blocks_edition_use_cases" USING btree ("_path");
  CREATE INDEX "pages_blocks_edition_use_cases_locale_idx" ON "pages_blocks_edition_use_cases" USING btree ("_locale");
  CREATE INDEX "subscription_config_feature_overview_order_idx" ON "subscription_config_feature_overview" USING btree ("_order");
  CREATE INDEX "subscription_config_feature_overview_parent_id_idx" ON "subscription_config_feature_overview" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "subscription_config_feature_overview_locales_locale_parent_i" ON "subscription_config_feature_overview_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "subscription_config_additional_features_order_idx" ON "subscription_config_additional_features" USING btree ("_order");
  CREATE INDEX "subscription_config_additional_features_parent_id_idx" ON "subscription_config_additional_features" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "subscription_config_additional_features_locales_locale_paren" ON "subscription_config_additional_features_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "subscription_config_updated_at_idx" ON "subscription_config" USING btree ("updated_at");
  CREATE INDEX "subscription_config_created_at_idx" ON "subscription_config" USING btree ("created_at");
  CREATE UNIQUE INDEX "subscription_config_locales_locale_parent_id_unique" ON "subscription_config_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscription_config_fk" FOREIGN KEY ("subscription_config_id") REFERENCES "public"."subscription_config"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_subscription_config_id_idx" ON "payload_locked_documents_rels" USING btree ("subscription_config_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_edition_hero_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_edition_hero_buttons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_edition_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_edition_features_features" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_edition_features" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_edition_install" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_edition_use_cases_use_cases" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_edition_use_cases" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subscription_config_feature_overview" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subscription_config_feature_overview_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subscription_config_additional_features" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subscription_config_additional_features_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subscription_config" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subscription_config_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_edition_hero_texts" CASCADE;
  DROP TABLE "pages_blocks_edition_hero_buttons" CASCADE;
  DROP TABLE "pages_blocks_edition_hero" CASCADE;
  DROP TABLE "pages_blocks_edition_features_features" CASCADE;
  DROP TABLE "pages_blocks_edition_features" CASCADE;
  DROP TABLE "pages_blocks_edition_install" CASCADE;
  DROP TABLE "pages_blocks_edition_use_cases_use_cases" CASCADE;
  DROP TABLE "pages_blocks_edition_use_cases" CASCADE;
  DROP TABLE "subscription_config_feature_overview" CASCADE;
  DROP TABLE "subscription_config_feature_overview_locales" CASCADE;
  DROP TABLE "subscription_config_additional_features" CASCADE;
  DROP TABLE "subscription_config_additional_features_locales" CASCADE;
  DROP TABLE "subscription_config" CASCADE;
  DROP TABLE "subscription_config_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_subscription_config_fk";
  
  ALTER TABLE "pages" ALTER COLUMN "slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_pages_slug";
  CREATE TYPE "public"."enum_pages_slug" AS ENUM('main', 'jobs', 'features', 'about-us', 'legal-notice', 'privacy', 'terms', 'contact');
  ALTER TABLE "pages" ALTER COLUMN "slug" SET DATA TYPE "public"."enum_pages_slug" USING "slug"::"public"."enum_pages_slug";
  DROP INDEX "payload_locked_documents_rels_subscription_config_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "subscription_config_id";
  DROP TYPE "public"."enum_pages_blocks_edition_hero_buttons_variant";
  DROP TYPE "public"."enum_subscription_config_deployment_self_hosted_color";
  DROP TYPE "public"."enum_subscription_config_deployment_cloud_color";
  DROP TYPE "public"."enum_subscription_config_customer_type_b2b_color";
  DROP TYPE "public"."enum_subscription_config_customer_type_b2c_color";
  DROP TYPE "public"."enum_subscription_config_subscription_tier_pro_color";
  DROP TYPE "public"."enum_subscription_config_subscription_tier_team_color";`)
}
