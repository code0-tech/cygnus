import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

const columns = [
    "common_accept_all",
    "common_reject_all",
    "common_customize",
    "common_save",
    "cookie_banner_title",
    "cookie_banner_description",
    "consent_manager_dialog_title",
    "consent_manager_dialog_description",
    "consent_types_necessary_title",
    "consent_types_necessary_description",
    "consent_types_measurement_title",
    "consent_types_measurement_description",
    "consent_types_marketing_title",
    "consent_types_marketing_description",
    "legal_links_privacy_policy_label",
    "legal_links_privacy_policy_href",
    "legal_links_terms_of_service_label",
    "legal_links_terms_of_service_href",
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
      DROP TABLE IF EXISTS "exports_texts" CASCADE;
      DROP TABLE IF EXISTS "exports" CASCADE;
      DROP TABLE IF EXISTS "imports" CASCADE;
      DROP TABLE IF EXISTS "payload_jobs_log" CASCADE;
      DROP TABLE IF EXISTS "payload_jobs" CASCADE;

      DROP TYPE IF EXISTS "public"."enum_exports_format";
      DROP TYPE IF EXISTS "public"."enum_exports_sort_order";
      DROP TYPE IF EXISTS "public"."enum_exports_locale";
      DROP TYPE IF EXISTS "public"."enum_exports_drafts";
      DROP TYPE IF EXISTS "public"."enum_imports_import_mode";
      DROP TYPE IF EXISTS "public"."enum_imports_status";
      DROP TYPE IF EXISTS "public"."enum_payload_jobs_log_task_slug";
      DROP TYPE IF EXISTS "public"."enum_payload_jobs_log_state";
      DROP TYPE IF EXISTS "public"."enum_payload_jobs_task_slug";
    `)

    for (const column of columns) {
        await db.execute(sql.raw(`ALTER TABLE "cookie_banner_locales" ALTER COLUMN "${column}" DROP NOT NULL;`))
    }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    for (const column of columns) {
        await db.execute(sql.raw(`UPDATE "cookie_banner_locales" SET "${column}" = '' WHERE "${column}" IS NULL;`))
        await db.execute(sql.raw(`ALTER TABLE "cookie_banner_locales" ALTER COLUMN "${column}" SET NOT NULL;`))
    }

    await db.execute(sql`
      CREATE TYPE "public"."enum_exports_format" AS ENUM('csv', 'json');
      CREATE TYPE "public"."enum_exports_sort_order" AS ENUM('asc', 'desc');
      CREATE TYPE "public"."enum_exports_locale" AS ENUM('all', 'en', 'de');
      CREATE TYPE "public"."enum_exports_drafts" AS ENUM('yes', 'no');
      CREATE TYPE "public"."enum_imports_import_mode" AS ENUM('create', 'update', 'upsert');
      CREATE TYPE "public"."enum_imports_status" AS ENUM('pending', 'completed', 'partial', 'failed');
      CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport');
      CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
      CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport');

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
        "text" varchar,
        CONSTRAINT "exports_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."exports"("id") ON DELETE cascade
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
        "error" jsonb,
        CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade
      );

      CREATE INDEX "exports_updated_at_idx" ON "exports" ("updated_at");
      CREATE INDEX "exports_created_at_idx" ON "exports" ("created_at");
      CREATE UNIQUE INDEX "exports_filename_idx" ON "exports" ("filename");
      CREATE INDEX "exports_texts_order_parent" ON "exports_texts" ("order", "parent_id");
      CREATE INDEX "imports_updated_at_idx" ON "imports" ("updated_at");
      CREATE INDEX "imports_created_at_idx" ON "imports" ("created_at");
      CREATE UNIQUE INDEX "imports_filename_idx" ON "imports" ("filename");
      CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" ("_order");
      CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" ("_parent_id");
      CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" ("completed_at");
      CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" ("total_tried");
      CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" ("has_error");
      CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" ("task_slug");
      CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" ("queue");
      CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" ("wait_until");
      CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" ("processing");
      CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" ("updated_at");
      CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" ("created_at");
    `)
}
