import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

// The workflow calculator dialog was removed from the subscription configurator, so its CMS content goes too.
// Dropping the business type table cascades to its locales through the foreign key, but both are dropped explicitly.
export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        DROP TABLE "subscription_config_workflow_calculator_types_locales" CASCADE;
        DROP TABLE "subscription_config_workflow_calculator_types" CASCADE;

        ALTER TABLE "subscription_config_locales"
            DROP COLUMN "workflow_calculator_trigger_label",
            DROP COLUMN "workflow_calculator_title",
            DROP COLUMN "workflow_calculator_description",
            DROP COLUMN "workflow_calculator_close_label",
            DROP COLUMN "workflow_calculator_business_type_label",
            DROP COLUMN "workflow_calculator_business_type_search_placeholder",
            DROP COLUMN "workflow_calculator_no_business_types_found_label",
            DROP COLUMN "workflow_calculator_active_workflows_label",
            DROP COLUMN "workflow_calculator_runs_per_day_label",
            DROP COLUMN "workflow_calculator_days_per_month_label",
            DROP COLUMN "workflow_calculator_estimate_label",
            DROP COLUMN "workflow_calculator_cancel_label",
            DROP COLUMN "workflow_calculator_apply_label";
    `)
}

// Restores the structure with the field defaults. Content edited in the CMS before the removal is not recoverable.
export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "subscription_config_locales"
            ADD COLUMN "workflow_calculator_trigger_label" varchar,
            ADD COLUMN "workflow_calculator_title" varchar,
            ADD COLUMN "workflow_calculator_description" varchar,
            ADD COLUMN "workflow_calculator_close_label" varchar,
            ADD COLUMN "workflow_calculator_business_type_label" varchar,
            ADD COLUMN "workflow_calculator_business_type_search_placeholder" varchar,
            ADD COLUMN "workflow_calculator_no_business_types_found_label" varchar,
            ADD COLUMN "workflow_calculator_active_workflows_label" varchar,
            ADD COLUMN "workflow_calculator_runs_per_day_label" varchar,
            ADD COLUMN "workflow_calculator_days_per_month_label" varchar,
            ADD COLUMN "workflow_calculator_estimate_label" varchar,
            ADD COLUMN "workflow_calculator_cancel_label" varchar,
            ADD COLUMN "workflow_calculator_apply_label" varchar;

        UPDATE "subscription_config_locales" SET
            "workflow_calculator_trigger_label" = CASE WHEN "_locale" = 'de' THEN 'Berechnen' ELSE 'Calculate' END,
            "workflow_calculator_title" = CASE WHEN "_locale" = 'de' THEN 'Workflow-Ausführungen berechnen' ELSE 'Calculate workflow executions' END,
            "workflow_calculator_description" = CASE WHEN "_locale" = 'de'
                THEN 'Schätze das monatliche Volumen anhand deiner aktiven Workflows und ihrer durchschnittlichen Ausführungshäufigkeit.'
                ELSE 'Estimate monthly volume from your active workflows and their average execution frequency.' END,
            "workflow_calculator_close_label" = CASE WHEN "_locale" = 'de' THEN 'Dialog schließen' ELSE 'Close dialog' END,
            "workflow_calculator_business_type_label" = CASE WHEN "_locale" = 'de' THEN 'Geschäftsbereich' ELSE 'Business type' END,
            "workflow_calculator_business_type_search_placeholder" = CASE WHEN "_locale" = 'de' THEN 'Geschäftsbereiche durchsuchen' ELSE 'Search business types' END,
            "workflow_calculator_no_business_types_found_label" = CASE WHEN "_locale" = 'de' THEN 'Keine Geschäftsbereiche gefunden.' ELSE 'No business types found.' END,
            "workflow_calculator_active_workflows_label" = CASE WHEN "_locale" = 'de' THEN 'Aktive Workflows' ELSE 'Active workflows' END,
            "workflow_calculator_runs_per_day_label" = CASE WHEN "_locale" = 'de' THEN 'Ausführungen pro Monat' ELSE 'Runs per month' END,
            "workflow_calculator_days_per_month_label" = CASE WHEN "_locale" = 'de' THEN 'Tage pro Monat' ELSE 'Days per month' END,
            "workflow_calculator_estimate_label" = CASE WHEN "_locale" = 'de' THEN 'Geschätztes monatliches Volumen' ELSE 'Estimated monthly volume' END,
            "workflow_calculator_cancel_label" = CASE WHEN "_locale" = 'de' THEN 'Abbrechen' ELSE 'Cancel' END,
            "workflow_calculator_apply_label" = CASE WHEN "_locale" = 'de' THEN 'Wert übernehmen' ELSE 'Apply value' END;

        ALTER TABLE "subscription_config_locales"
            ALTER COLUMN "workflow_calculator_trigger_label" SET NOT NULL,
            ALTER COLUMN "workflow_calculator_title" SET NOT NULL,
            ALTER COLUMN "workflow_calculator_description" SET NOT NULL,
            ALTER COLUMN "workflow_calculator_close_label" SET NOT NULL,
            ALTER COLUMN "workflow_calculator_business_type_label" SET NOT NULL,
            ALTER COLUMN "workflow_calculator_business_type_search_placeholder" SET NOT NULL,
            ALTER COLUMN "workflow_calculator_no_business_types_found_label" SET NOT NULL,
            ALTER COLUMN "workflow_calculator_active_workflows_label" SET NOT NULL,
            ALTER COLUMN "workflow_calculator_runs_per_day_label" SET NOT NULL,
            ALTER COLUMN "workflow_calculator_days_per_month_label" SET NOT NULL,
            ALTER COLUMN "workflow_calculator_estimate_label" SET NOT NULL,
            ALTER COLUMN "workflow_calculator_cancel_label" SET NOT NULL,
            ALTER COLUMN "workflow_calculator_apply_label" SET NOT NULL;

        CREATE TABLE "subscription_config_workflow_calculator_types" (
            "_order" integer NOT NULL,
            "_parent_id" integer NOT NULL,
            "id" varchar PRIMARY KEY NOT NULL,
            "icon" varchar DEFAULT 'building' NOT NULL,
            "conversion_rate" numeric DEFAULT 1 NOT NULL
        );

        CREATE TABLE "subscription_config_workflow_calculator_types_locales" (
            "name" varchar NOT NULL,
            "conversion_unit" varchar NOT NULL,
            "id" serial PRIMARY KEY NOT NULL,
            "_locale" "_locales" NOT NULL,
            "_parent_id" varchar NOT NULL
        );

        ALTER TABLE "subscription_config_workflow_calculator_types"
            ADD CONSTRAINT "subscription_config_workflow_calculator_types_parent_id_fk"
            FOREIGN KEY ("_parent_id") REFERENCES "public"."subscription_config"("id") ON DELETE cascade ON UPDATE no action;
        ALTER TABLE "subscription_config_workflow_calculator_types_locales"
            ADD CONSTRAINT "subscription_config_workflow_calculator_types_locales_par_fk"
            FOREIGN KEY ("_parent_id") REFERENCES "public"."subscription_config_workflow_calculator_types"("id") ON DELETE cascade ON UPDATE no action;

        CREATE INDEX "subscription_config_workflow_calculator_types_order_idx" ON "subscription_config_workflow_calculator_types" USING btree ("_order");
        CREATE INDEX "subscription_config_workflow_calculator_types_parent_id_idx" ON "subscription_config_workflow_calculator_types" USING btree ("_parent_id");
        CREATE UNIQUE INDEX "subscription_config_workflow_calculator_types_locales_locale" ON "subscription_config_workflow_calculator_types_locales" USING btree ("_locale", "_parent_id");

        -- The array requires at least one row, so restore the default "General" business type.
        INSERT INTO "subscription_config_workflow_calculator_types" ("_order", "_parent_id", "id", "icon", "conversion_rate")
            SELECT 1, "id", 'restored-general-' || "id", 'building', 1 FROM "subscription_config";
        INSERT INTO "subscription_config_workflow_calculator_types_locales" ("name", "conversion_unit", "_locale", "_parent_id")
            SELECT CASE WHEN l."_locale" = 'de' THEN 'Allgemein' ELSE 'General' END,
                   CASE WHEN l."_locale" = 'de' THEN 'Ausführungen' ELSE 'executions' END,
                   l."_locale", t."id"
            FROM "subscription_config_workflow_calculator_types" t
            JOIN "subscription_config_locales" l ON l."_parent_id" = t."_parent_id";
    `)
}
