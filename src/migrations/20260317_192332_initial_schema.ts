import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('en', 'de');
  CREATE TYPE "public"."enum_navbar_items_sub_menu_icon" AS ENUM('cube', 'gitBranch', 'lock');
  CREATE TYPE "public"."enum_navbar_items_sub_menu_color" AS ENUM('brand', 'pink', 'yellow', 'aqua', 'blue');
  CREATE TYPE "public"."enum_sections_section_type" AS ENUM('AppFeatureSection', 'FaqSection', 'RoadmapSection', 'RuntimeFeatureSection', 'UseCaseSection', 'DeploymentSection');
  CREATE TYPE "public"."enum_pages_blocks_hero_buttons_variant" AS ENUM('none', 'normal', 'outlined', 'filled');
  CREATE TYPE "public"."enum_pages_slug" AS ENUM('main', 'jobs', 'features', 'about-us', 'legal-notice', 'privacy', 'terms', 'contact');
  CREATE TYPE "public"."enum_features_slug" AS ENUM('projects', 'role-system', 'member-management', 'organizations', 'suggestion-menu', 'nodes', 'runtime-types', 'action-list');
  CREATE TYPE "public"."enum_jobs_category" AS ENUM('engineering', 'marketing', 'design', 'product', 'sales', 'operations');
  CREATE TYPE "public"."enum_jobs_type" AS ENUM('full-time', 'part-time', 'contract', 'internship', 'working-student', 'freelance');
  CREATE TYPE "public"."enum_jobs_location" AS ENUM('remote', 'hybrid', 'leipzig', 'solingen');
  CREATE TYPE "public"."enum_exports_format" AS ENUM('csv', 'json');
  CREATE TYPE "public"."enum_exports_sort_order" AS ENUM('asc', 'desc');
  CREATE TYPE "public"."enum_exports_locale" AS ENUM('all', 'en', 'de');
  CREATE TYPE "public"."enum_exports_drafts" AS ENUM('yes', 'no');
  CREATE TYPE "public"."enum_imports_import_mode" AS ENUM('create', 'update', 'upsert');
  CREATE TYPE "public"."enum_imports_status" AS ENUM('pending', 'completed', 'partial', 'failed');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"image_id" integer,
  	"joined_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "users_locales" (
  	"short_description" varchar,
  	"about" varchar,
  	"role" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"href" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "navbar_items_sub_menu" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"href" varchar NOT NULL,
  	"icon" "enum_navbar_items_sub_menu_icon" NOT NULL,
  	"color" "enum_navbar_items_sub_menu_color" DEFAULT 'brand' NOT NULL
  );
  
  CREATE TABLE "navbar_items_sub_menu_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navbar_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"href" varchar,
  	"order" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "navbar_items_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "sections" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"section_type" "enum_sections_section_type" NOT NULL,
  	"link_button_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "sections_locales" (
  	"heading" varchar NOT NULL,
  	"subheading" varchar,
  	"link_button_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "footer_groups_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "footer_groups_items_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "footer_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "footer_groups_locales" (
  	"heading" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "footer" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "footer_locales" (
  	"company_name" varchar DEFAULT 'CodeZero GmbH' NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "pages_blocks_hero_texts" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_hero_buttons" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"variant" "enum_pages_blocks_hero_buttons_variant" DEFAULT 'normal'
  );
  
  CREATE TABLE "pages_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"badge" varchar,
  	"heading" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_brand_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer NOT NULL
  );
  
  CREATE TABLE "pages_blocks_brand" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"description" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_usecase_use_cases" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_usecase" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL
  );
  
  CREATE TABLE "pages_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"subheading" varchar NOT NULL,
  	"cta_link_label" varchar NOT NULL,
  	"cta_link_url" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_jobs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Join Our Team' NOT NULL,
  	"search_placeholder" varchar DEFAULT 'Search jobs' NOT NULL,
  	"all_locations_label" varchar DEFAULT 'All locations' NOT NULL,
  	"all_job_types_label" varchar DEFAULT 'All job types' NOT NULL,
  	"all_categories_label" varchar DEFAULT 'All categories' NOT NULL,
  	"no_jobs_found_label" varchar DEFAULT 'No jobs found for your filter.' NOT NULL,
  	"application_heading" varchar DEFAULT 'Apply now' NOT NULL,
  	"application_name_label" varchar DEFAULT 'Name' NOT NULL,
  	"application_name_placeholder" varchar DEFAULT 'Your name' NOT NULL,
  	"application_email_label" varchar DEFAULT 'Email' NOT NULL,
  	"application_email_placeholder" varchar DEFAULT 'you@example.com' NOT NULL,
  	"application_message_label" varchar DEFAULT 'Message' NOT NULL,
  	"application_message_placeholder" varchar DEFAULT 'Tell us a bit about yourself...' NOT NULL,
  	"application_submit_label" varchar DEFAULT 'Send application' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_markdown" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content" jsonb NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_contact" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Contact us' NOT NULL,
  	"name_label" varchar DEFAULT 'Name' NOT NULL,
  	"name_placeholder" varchar DEFAULT 'Your name' NOT NULL,
  	"email_label" varchar DEFAULT 'Email' NOT NULL,
  	"email_placeholder" varchar DEFAULT 'you@example.com' NOT NULL,
  	"message_label" varchar DEFAULT 'Message' NOT NULL,
  	"message_placeholder" varchar DEFAULT 'How can we help you?' NOT NULL,
  	"submit_label" varchar DEFAULT 'Send message' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_deployment" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"cloud_title" varchar,
  	"cloud_description" varchar,
  	"cloud_link_label" varchar,
  	"cloud_link_url" varchar,
  	"selfhost_title" varchar,
  	"selfhost_description" varchar,
  	"selfhost_link_label" varchar,
  	"selfhost_link_url" varchar,
  	"dynamic_title" varchar,
  	"dynamic_description" varchar,
  	"dynamic_link_label" varchar,
  	"dynamic_link_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" "enum_pages_slug" NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pages_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "pages_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar,
  	"locale" "_locales"
  );
  
  CREATE TABLE "features" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" "enum_features_slug" NOT NULL,
  	"link_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "features_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"category" "enum_jobs_category" NOT NULL,
  	"type" "enum_jobs_type" NOT NULL,
  	"location" "enum_jobs_location" NOT NULL,
  	"order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "jobs_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"content" jsonb NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "blog" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"author_id" integer NOT NULL,
  	"hero_image_id" integer,
  	"og_image_id" integer,
  	"twitter_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "blog_locales" (
  	"title" varchar NOT NULL,
  	"content" jsonb NOT NULL,
  	"short_description" varchar,
  	"meta_description" varchar,
  	"meta_keywords" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "roadmap_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "roadmap_items_locales" (
  	"time" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "exports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"format" "enum_exports_format" DEFAULT 'csv' NOT NULL,
  	"limit" numeric,
  	"page" numeric DEFAULT 1,
  	"sort" varchar,
  	"sort_order" "enum_exports_sort_order",
  	"locale" "enum_exports_locale" DEFAULT 'all',
  	"drafts" "enum_exports_drafts" DEFAULT 'yes',
  	"collection_slug" varchar DEFAULT 'users' NOT NULL,
  	"where" jsonb DEFAULT '{}'::jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "exports_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "imports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"collection_slug" varchar DEFAULT 'users' NOT NULL,
  	"import_mode" "enum_imports_import_mode",
  	"match_field" varchar DEFAULT 'id',
  	"status" "enum_imports_status" DEFAULT 'pending',
  	"summary_imported" numeric,
  	"summary_updated" numeric,
  	"summary_total" numeric,
  	"summary_issues" numeric,
  	"summary_issue_details" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"navbar_items_id" integer,
  	"sections_id" integer,
  	"footer_id" integer,
  	"pages_id" integer,
  	"features_id" integer,
  	"jobs_id" integer,
  	"blog_id" integer,
  	"roadmap_items_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_locales" ADD CONSTRAINT "users_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navbar_items_sub_menu" ADD CONSTRAINT "navbar_items_sub_menu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navbar_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navbar_items_sub_menu_locales" ADD CONSTRAINT "navbar_items_sub_menu_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navbar_items_sub_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navbar_items_locales" ADD CONSTRAINT "navbar_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navbar_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sections_locales" ADD CONSTRAINT "sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_groups_items" ADD CONSTRAINT "footer_groups_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_groups_items_locales" ADD CONSTRAINT "footer_groups_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_groups_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_groups" ADD CONSTRAINT "footer_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_groups_locales" ADD CONSTRAINT "footer_groups_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_locales" ADD CONSTRAINT "footer_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero_texts" ADD CONSTRAINT "pages_blocks_hero_texts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero_buttons" ADD CONSTRAINT "pages_blocks_hero_buttons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_brand_logos" ADD CONSTRAINT "pages_blocks_brand_logos_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_brand_logos" ADD CONSTRAINT "pages_blocks_brand_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_brand"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_brand" ADD CONSTRAINT "pages_blocks_brand_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_usecase_use_cases" ADD CONSTRAINT "pages_blocks_usecase_use_cases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_usecase"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_usecase" ADD CONSTRAINT "pages_blocks_usecase_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_items" ADD CONSTRAINT "pages_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq" ADD CONSTRAINT "pages_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_jobs" ADD CONSTRAINT "pages_blocks_jobs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_markdown" ADD CONSTRAINT "pages_blocks_markdown_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_contact" ADD CONSTRAINT "pages_blocks_contact_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_deployment" ADD CONSTRAINT "pages_blocks_deployment_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_texts" ADD CONSTRAINT "pages_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "features_locales" ADD CONSTRAINT "features_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."features"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "jobs_locales" ADD CONSTRAINT "jobs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog" ADD CONSTRAINT "blog_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blog" ADD CONSTRAINT "blog_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blog" ADD CONSTRAINT "blog_og_image_id_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blog" ADD CONSTRAINT "blog_twitter_image_id_media_id_fk" FOREIGN KEY ("twitter_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blog_locales" ADD CONSTRAINT "blog_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "roadmap_items_locales" ADD CONSTRAINT "roadmap_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."roadmap_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exports_texts" ADD CONSTRAINT "exports_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."exports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_navbar_items_fk" FOREIGN KEY ("navbar_items_id") REFERENCES "public"."navbar_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sections_fk" FOREIGN KEY ("sections_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_footer_fk" FOREIGN KEY ("footer_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_features_fk" FOREIGN KEY ("features_id") REFERENCES "public"."features"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_jobs_fk" FOREIGN KEY ("jobs_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blog_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_roadmap_items_fk" FOREIGN KEY ("roadmap_items_id") REFERENCES "public"."roadmap_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_image_idx" ON "users" USING btree ("image_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "users_locales_locale_parent_id_unique" ON "users_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "navbar_items_sub_menu_order_idx" ON "navbar_items_sub_menu" USING btree ("_order");
  CREATE INDEX "navbar_items_sub_menu_parent_id_idx" ON "navbar_items_sub_menu" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navbar_items_sub_menu_locales_locale_parent_id_unique" ON "navbar_items_sub_menu_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navbar_items_updated_at_idx" ON "navbar_items" USING btree ("updated_at");
  CREATE INDEX "navbar_items_created_at_idx" ON "navbar_items" USING btree ("created_at");
  CREATE UNIQUE INDEX "navbar_items_locales_locale_parent_id_unique" ON "navbar_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "sections_updated_at_idx" ON "sections" USING btree ("updated_at");
  CREATE INDEX "sections_created_at_idx" ON "sections" USING btree ("created_at");
  CREATE UNIQUE INDEX "sections_locales_locale_parent_id_unique" ON "sections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "footer_groups_items_order_idx" ON "footer_groups_items" USING btree ("_order");
  CREATE INDEX "footer_groups_items_parent_id_idx" ON "footer_groups_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "footer_groups_items_locales_locale_parent_id_unique" ON "footer_groups_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "footer_groups_order_idx" ON "footer_groups" USING btree ("_order");
  CREATE INDEX "footer_groups_parent_id_idx" ON "footer_groups" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "footer_groups_locales_locale_parent_id_unique" ON "footer_groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "footer_updated_at_idx" ON "footer" USING btree ("updated_at");
  CREATE INDEX "footer_created_at_idx" ON "footer" USING btree ("created_at");
  CREATE UNIQUE INDEX "footer_locales_locale_parent_id_unique" ON "footer_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_hero_texts_order_idx" ON "pages_blocks_hero_texts" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_texts_parent_id_idx" ON "pages_blocks_hero_texts" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_texts_locale_idx" ON "pages_blocks_hero_texts" USING btree ("_locale");
  CREATE INDEX "pages_blocks_hero_buttons_order_idx" ON "pages_blocks_hero_buttons" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_buttons_parent_id_idx" ON "pages_blocks_hero_buttons" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_buttons_locale_idx" ON "pages_blocks_hero_buttons" USING btree ("_locale");
  CREATE INDEX "pages_blocks_hero_order_idx" ON "pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_parent_id_idx" ON "pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_path_idx" ON "pages_blocks_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_hero_locale_idx" ON "pages_blocks_hero" USING btree ("_locale");
  CREATE INDEX "pages_blocks_brand_logos_order_idx" ON "pages_blocks_brand_logos" USING btree ("_order");
  CREATE INDEX "pages_blocks_brand_logos_parent_id_idx" ON "pages_blocks_brand_logos" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_brand_logos_locale_idx" ON "pages_blocks_brand_logos" USING btree ("_locale");
  CREATE INDEX "pages_blocks_brand_logos_logo_idx" ON "pages_blocks_brand_logos" USING btree ("logo_id");
  CREATE INDEX "pages_blocks_brand_order_idx" ON "pages_blocks_brand" USING btree ("_order");
  CREATE INDEX "pages_blocks_brand_parent_id_idx" ON "pages_blocks_brand" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_brand_path_idx" ON "pages_blocks_brand" USING btree ("_path");
  CREATE INDEX "pages_blocks_brand_locale_idx" ON "pages_blocks_brand" USING btree ("_locale");
  CREATE INDEX "pages_blocks_usecase_use_cases_order_idx" ON "pages_blocks_usecase_use_cases" USING btree ("_order");
  CREATE INDEX "pages_blocks_usecase_use_cases_parent_id_idx" ON "pages_blocks_usecase_use_cases" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_usecase_use_cases_locale_idx" ON "pages_blocks_usecase_use_cases" USING btree ("_locale");
  CREATE INDEX "pages_blocks_usecase_order_idx" ON "pages_blocks_usecase" USING btree ("_order");
  CREATE INDEX "pages_blocks_usecase_parent_id_idx" ON "pages_blocks_usecase" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_usecase_path_idx" ON "pages_blocks_usecase" USING btree ("_path");
  CREATE INDEX "pages_blocks_usecase_locale_idx" ON "pages_blocks_usecase" USING btree ("_locale");
  CREATE INDEX "pages_blocks_faq_items_order_idx" ON "pages_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_items_parent_id_idx" ON "pages_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_items_locale_idx" ON "pages_blocks_faq_items" USING btree ("_locale");
  CREATE INDEX "pages_blocks_faq_order_idx" ON "pages_blocks_faq" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_parent_id_idx" ON "pages_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_path_idx" ON "pages_blocks_faq" USING btree ("_path");
  CREATE INDEX "pages_blocks_faq_locale_idx" ON "pages_blocks_faq" USING btree ("_locale");
  CREATE INDEX "pages_blocks_cta_order_idx" ON "pages_blocks_cta" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_parent_id_idx" ON "pages_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_path_idx" ON "pages_blocks_cta" USING btree ("_path");
  CREATE INDEX "pages_blocks_cta_locale_idx" ON "pages_blocks_cta" USING btree ("_locale");
  CREATE INDEX "pages_blocks_jobs_order_idx" ON "pages_blocks_jobs" USING btree ("_order");
  CREATE INDEX "pages_blocks_jobs_parent_id_idx" ON "pages_blocks_jobs" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_jobs_path_idx" ON "pages_blocks_jobs" USING btree ("_path");
  CREATE INDEX "pages_blocks_jobs_locale_idx" ON "pages_blocks_jobs" USING btree ("_locale");
  CREATE INDEX "pages_blocks_markdown_order_idx" ON "pages_blocks_markdown" USING btree ("_order");
  CREATE INDEX "pages_blocks_markdown_parent_id_idx" ON "pages_blocks_markdown" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_markdown_path_idx" ON "pages_blocks_markdown" USING btree ("_path");
  CREATE INDEX "pages_blocks_markdown_locale_idx" ON "pages_blocks_markdown" USING btree ("_locale");
  CREATE INDEX "pages_blocks_contact_order_idx" ON "pages_blocks_contact" USING btree ("_order");
  CREATE INDEX "pages_blocks_contact_parent_id_idx" ON "pages_blocks_contact" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_contact_path_idx" ON "pages_blocks_contact" USING btree ("_path");
  CREATE INDEX "pages_blocks_contact_locale_idx" ON "pages_blocks_contact" USING btree ("_locale");
  CREATE INDEX "pages_blocks_deployment_order_idx" ON "pages_blocks_deployment" USING btree ("_order");
  CREATE INDEX "pages_blocks_deployment_parent_id_idx" ON "pages_blocks_deployment" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_deployment_path_idx" ON "pages_blocks_deployment" USING btree ("_path");
  CREATE INDEX "pages_blocks_deployment_locale_idx" ON "pages_blocks_deployment" USING btree ("_locale");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_texts_order_parent" ON "pages_texts" USING btree ("order","parent_id");
  CREATE INDEX "pages_texts_locale_parent" ON "pages_texts" USING btree ("locale","parent_id");
  CREATE UNIQUE INDEX "features_slug_idx" ON "features" USING btree ("slug");
  CREATE INDEX "features_updated_at_idx" ON "features" USING btree ("updated_at");
  CREATE INDEX "features_created_at_idx" ON "features" USING btree ("created_at");
  CREATE UNIQUE INDEX "features_locales_locale_parent_id_unique" ON "features_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "jobs_slug_idx" ON "jobs" USING btree ("slug");
  CREATE INDEX "jobs_updated_at_idx" ON "jobs" USING btree ("updated_at");
  CREATE INDEX "jobs_created_at_idx" ON "jobs" USING btree ("created_at");
  CREATE UNIQUE INDEX "jobs_locales_locale_parent_id_unique" ON "jobs_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "blog_slug_idx" ON "blog" USING btree ("slug");
  CREATE INDEX "blog_author_idx" ON "blog" USING btree ("author_id");
  CREATE INDEX "blog_hero_image_idx" ON "blog" USING btree ("hero_image_id");
  CREATE INDEX "blog_og_image_idx" ON "blog" USING btree ("og_image_id");
  CREATE INDEX "blog_twitter_image_idx" ON "blog" USING btree ("twitter_image_id");
  CREATE INDEX "blog_updated_at_idx" ON "blog" USING btree ("updated_at");
  CREATE INDEX "blog_created_at_idx" ON "blog" USING btree ("created_at");
  CREATE UNIQUE INDEX "blog_locales_locale_parent_id_unique" ON "blog_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "roadmap_items_updated_at_idx" ON "roadmap_items" USING btree ("updated_at");
  CREATE INDEX "roadmap_items_created_at_idx" ON "roadmap_items" USING btree ("created_at");
  CREATE UNIQUE INDEX "roadmap_items_locales_locale_parent_id_unique" ON "roadmap_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "exports_updated_at_idx" ON "exports" USING btree ("updated_at");
  CREATE INDEX "exports_created_at_idx" ON "exports" USING btree ("created_at");
  CREATE UNIQUE INDEX "exports_filename_idx" ON "exports" USING btree ("filename");
  CREATE INDEX "exports_texts_order_parent" ON "exports_texts" USING btree ("order","parent_id");
  CREATE INDEX "imports_updated_at_idx" ON "imports" USING btree ("updated_at");
  CREATE INDEX "imports_created_at_idx" ON "imports" USING btree ("created_at");
  CREATE UNIQUE INDEX "imports_filename_idx" ON "imports" USING btree ("filename");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_navbar_items_id_idx" ON "payload_locked_documents_rels" USING btree ("navbar_items_id");
  CREATE INDEX "payload_locked_documents_rels_sections_id_idx" ON "payload_locked_documents_rels" USING btree ("sections_id");
  CREATE INDEX "payload_locked_documents_rels_footer_id_idx" ON "payload_locked_documents_rels" USING btree ("footer_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_features_id_idx" ON "payload_locked_documents_rels" USING btree ("features_id");
  CREATE INDEX "payload_locked_documents_rels_jobs_id_idx" ON "payload_locked_documents_rels" USING btree ("jobs_id");
  CREATE INDEX "payload_locked_documents_rels_blog_id_idx" ON "payload_locked_documents_rels" USING btree ("blog_id");
  CREATE INDEX "payload_locked_documents_rels_roadmap_items_id_idx" ON "payload_locked_documents_rels" USING btree ("roadmap_items_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "users_locales" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "navbar_items_sub_menu" CASCADE;
  DROP TABLE "navbar_items_sub_menu_locales" CASCADE;
  DROP TABLE "navbar_items" CASCADE;
  DROP TABLE "navbar_items_locales" CASCADE;
  DROP TABLE "sections" CASCADE;
  DROP TABLE "sections_locales" CASCADE;
  DROP TABLE "footer_groups_items" CASCADE;
  DROP TABLE "footer_groups_items_locales" CASCADE;
  DROP TABLE "footer_groups" CASCADE;
  DROP TABLE "footer_groups_locales" CASCADE;
  DROP TABLE "footer" CASCADE;
  DROP TABLE "footer_locales" CASCADE;
  DROP TABLE "pages_blocks_hero_texts" CASCADE;
  DROP TABLE "pages_blocks_hero_buttons" CASCADE;
  DROP TABLE "pages_blocks_hero" CASCADE;
  DROP TABLE "pages_blocks_brand_logos" CASCADE;
  DROP TABLE "pages_blocks_brand" CASCADE;
  DROP TABLE "pages_blocks_usecase_use_cases" CASCADE;
  DROP TABLE "pages_blocks_usecase" CASCADE;
  DROP TABLE "pages_blocks_faq_items" CASCADE;
  DROP TABLE "pages_blocks_faq" CASCADE;
  DROP TABLE "pages_blocks_cta" CASCADE;
  DROP TABLE "pages_blocks_jobs" CASCADE;
  DROP TABLE "pages_blocks_markdown" CASCADE;
  DROP TABLE "pages_blocks_contact" CASCADE;
  DROP TABLE "pages_blocks_deployment" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_locales" CASCADE;
  DROP TABLE "pages_texts" CASCADE;
  DROP TABLE "features" CASCADE;
  DROP TABLE "features_locales" CASCADE;
  DROP TABLE "jobs" CASCADE;
  DROP TABLE "jobs_locales" CASCADE;
  DROP TABLE "blog" CASCADE;
  DROP TABLE "blog_locales" CASCADE;
  DROP TABLE "roadmap_items" CASCADE;
  DROP TABLE "roadmap_items_locales" CASCADE;
  DROP TABLE "exports" CASCADE;
  DROP TABLE "exports_texts" CASCADE;
  DROP TABLE "imports" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_navbar_items_sub_menu_icon";
  DROP TYPE "public"."enum_navbar_items_sub_menu_color";
  DROP TYPE "public"."enum_sections_section_type";
  DROP TYPE "public"."enum_pages_blocks_hero_buttons_variant";
  DROP TYPE "public"."enum_pages_slug";
  DROP TYPE "public"."enum_features_slug";
  DROP TYPE "public"."enum_jobs_category";
  DROP TYPE "public"."enum_jobs_type";
  DROP TYPE "public"."enum_jobs_location";
  DROP TYPE "public"."enum_exports_format";
  DROP TYPE "public"."enum_exports_sort_order";
  DROP TYPE "public"."enum_exports_locale";
  DROP TYPE "public"."enum_exports_drafts";
  DROP TYPE "public"."enum_imports_import_mode";
  DROP TYPE "public"."enum_imports_status";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";`)
}
