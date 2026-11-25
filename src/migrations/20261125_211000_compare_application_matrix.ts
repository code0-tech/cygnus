import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        DO $$ BEGIN
            CREATE TYPE "public"."enum_pages_blocks_compare_application_apps_features_status" AS ENUM ('included', 'partial', 'unavailable');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;

        ALTER TABLE "pages_blocks_compare_application_apps_features"
            ADD COLUMN IF NOT EXISTS "category" varchar DEFAULT 'Features' NOT NULL,
            ADD COLUMN IF NOT EXISTS "status" "public"."enum_pages_blocks_compare_application_apps_features_status" DEFAULT 'included' NOT NULL;
        DO $$ BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'pages_blocks_compare_application_apps_features' AND column_name = 'exists'
            ) THEN
                UPDATE "pages_blocks_compare_application_apps_features"
                    SET "status" = CASE WHEN "exists" THEN 'included'::"public"."enum_pages_blocks_compare_application_apps_features_status" ELSE 'unavailable'::"public"."enum_pages_blocks_compare_application_apps_features_status" END;
            END IF;
        END $$;
        ALTER TABLE "pages_blocks_compare_application_apps_features" DROP COLUMN IF EXISTS "exists";

        ALTER TABLE "pages_blocks_compare_application_apps"
            ALTER COLUMN "logo_id" DROP NOT NULL,
            ADD COLUMN IF NOT EXISTS "logo_fallback" varchar DEFAULT 'Logo',
            ADD COLUMN IF NOT EXISTS "comparison_url" varchar,
            ADD COLUMN IF NOT EXISTS "comparison_link_label" varchar,
            ADD COLUMN IF NOT EXISTS "highlighted" boolean DEFAULT false;
        UPDATE "pages_blocks_compare_application_apps" SET
            "logo_fallback" = CASE WHEN lower("name") = 'codezero' THEN 'C0' ELSE 'Logo' END,
            "comparison_url" = CASE lower("name")
                WHEN 'codezero' THEN '/compare/codezero'
                WHEN 'n8n' THEN '/compare/n8n'
                WHEN 'kestra' THEN '/compare/kestra'
                WHEN 'zapier' THEN '/compare/zapier'
                ELSE "comparison_url"
            END,
            "comparison_link_label" = CASE WHEN lower("name") = 'codezero' THEN 'Automate a process' ELSE 'vs. ' || "name" || ' ' || chr(8250) END;
        WITH first_app AS (
            SELECT DISTINCT ON ("_parent_id", "_locale") id
            FROM "pages_blocks_compare_application_apps"
            ORDER BY "_parent_id", "_locale", "_order"
        )
        UPDATE "pages_blocks_compare_application_apps" apps SET "highlighted" = true
        FROM first_app WHERE apps.id = first_app.id;

        ALTER TABLE "pages_blocks_compare_application"
            ALTER COLUMN "section_heading" SET DEFAULT '**CodeZero in comparison with**\\nother automation tools',
            ADD COLUMN IF NOT EXISTS "feature_column_label" varchar DEFAULT 'Feature',
            ADD COLUMN IF NOT EXISTS "partial_label" varchar DEFAULT 'Partial',
            ADD COLUMN IF NOT EXISTS "detailed_comparisons_label" varchar DEFAULT 'Detailed comparisons',
            ADD COLUMN IF NOT EXISTS "footnote" varchar DEFAULT 'As of [DATE], based on publicly available information.';
        UPDATE "pages_blocks_compare_application" SET
            "section_heading" = '**CodeZero in comparison with**\\nother automation tools'
        WHERE "section_heading" IS NULL;

        INSERT INTO "pages_blocks_compare_application_buttons" ("_order", "_parent_id", "_locale", id, label, url, variant)
        SELECT 1, block.id, block."_locale", md5(block.id || block."_locale" || 'Automate a process'), 'Automate a process', '/actions', 'filled'
        FROM "pages_blocks_compare_application" block
        WHERE NOT EXISTS (
            SELECT 1 FROM "pages_blocks_compare_application_buttons" button WHERE button."_parent_id" = block.id
        )
        ON CONFLICT (id) DO NOTHING;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        DELETE FROM "pages_blocks_compare_application_buttons"
        WHERE id = md5("_parent_id" || "_locale" || 'Automate a process');
        ALTER TABLE "pages_blocks_compare_application"
            ALTER COLUMN "section_heading" DROP DEFAULT,
            DROP COLUMN IF EXISTS "feature_column_label",
            DROP COLUMN IF EXISTS "partial_label",
            DROP COLUMN IF EXISTS "detailed_comparisons_label",
            DROP COLUMN IF EXISTS "footnote";
        ALTER TABLE "pages_blocks_compare_application_apps_features"
            ADD COLUMN "exists" boolean DEFAULT true NOT NULL;
        UPDATE "pages_blocks_compare_application_apps_features" SET "exists" = ("status" = 'included');
        ALTER TABLE "pages_blocks_compare_application_apps_features"
            DROP COLUMN IF EXISTS "category",
            DROP COLUMN IF EXISTS "status";
        DROP TYPE IF EXISTS "public"."enum_pages_blocks_compare_application_apps_features_status";
        ALTER TABLE "pages_blocks_compare_application_apps"
            DROP COLUMN IF EXISTS "logo_fallback",
            DROP COLUMN IF EXISTS "comparison_url",
            DROP COLUMN IF EXISTS "comparison_link_label",
            DROP COLUMN IF EXISTS "highlighted";
        ALTER TABLE "pages_blocks_compare_application_apps" ALTER COLUMN "logo_id" SET NOT NULL;
    `)
}
