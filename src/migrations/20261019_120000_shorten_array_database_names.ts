import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

// missingFeatures -> missing and workflowCalculator.businessTypes -> workflowCalculator.types.
// Preserve content by renaming existing objects, using Postgres's stored (truncated) identifiers.
// Keep primary-key names: earlier table renames retained their original names.
export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "pages_blocks_pricing_pro_missing_features" RENAME TO "pages_blocks_pricing_pro_missing";
        ALTER INDEX "pages_blocks_pricing_pro_missing_features_order_idx" RENAME TO "pages_blocks_pricing_pro_missing_order_idx";
        ALTER INDEX "pages_blocks_pricing_pro_missing_features_parent_id_idx" RENAME TO "pages_blocks_pricing_pro_missing_parent_id_idx";
        ALTER INDEX "pages_blocks_pricing_pro_missing_features_locale_idx" RENAME TO "pages_blocks_pricing_pro_missing_locale_idx";
        ALTER TABLE "pages_blocks_pricing_pro_missing" RENAME CONSTRAINT "pages_blocks_pricing_pro_missing_features_parent_id_fk" TO "pages_blocks_pricing_pro_missing_parent_id_fk";
        ALTER TABLE "pages_blocks_pricing_max_missing_features" RENAME TO "pages_blocks_pricing_max_missing";
        ALTER INDEX "pages_blocks_pricing_max_missing_features_order_idx" RENAME TO "pages_blocks_pricing_max_missing_order_idx";
        ALTER INDEX "pages_blocks_pricing_max_missing_features_parent_id_idx" RENAME TO "pages_blocks_pricing_max_missing_parent_id_idx";
        ALTER INDEX "pages_blocks_pricing_max_missing_features_locale_idx" RENAME TO "pages_blocks_pricing_max_missing_locale_idx";
        ALTER TABLE "pages_blocks_pricing_max_missing" RENAME CONSTRAINT "pages_blocks_pricing_max_missing_features_parent_id_fk" TO "pages_blocks_pricing_max_missing_parent_id_fk";
        ALTER TABLE "pages_blocks_pricing_custom_missing_features" RENAME TO "pages_blocks_pricing_custom_missing";
        ALTER INDEX "pages_blocks_pricing_custom_missing_features_order_idx" RENAME TO "pages_blocks_pricing_custom_missing_order_idx";
        ALTER INDEX "pages_blocks_pricing_custom_missing_features_parent_id_idx" RENAME TO "pages_blocks_pricing_custom_missing_parent_id_idx";
        ALTER INDEX "pages_blocks_pricing_custom_missing_features_locale_idx" RENAME TO "pages_blocks_pricing_custom_missing_locale_idx";
        ALTER TABLE "pages_blocks_pricing_custom_missing" RENAME CONSTRAINT "pages_blocks_pricing_custom_missing_features_parent_id_fk" TO "pages_blocks_pricing_custom_missing_parent_id_fk";
        ALTER TABLE "pages_blocks_small_pricing_pro_missing_features" RENAME TO "pages_blocks_small_pricing_pro_missing";
        ALTER INDEX "pages_blocks_small_pricing_pro_missing_features_order_idx" RENAME TO "pages_blocks_small_pricing_pro_missing_order_idx";
        ALTER INDEX "pages_blocks_small_pricing_pro_missing_features_parent_id_idx" RENAME TO "pages_blocks_small_pricing_pro_missing_parent_id_idx";
        ALTER INDEX "pages_blocks_small_pricing_pro_missing_features_locale_idx" RENAME TO "pages_blocks_small_pricing_pro_missing_locale_idx";
        ALTER TABLE "pages_blocks_small_pricing_pro_missing" RENAME CONSTRAINT "pages_blocks_small_pricing_pro_missing_features_parent_id_fk" TO "pages_blocks_small_pricing_pro_missing_parent_id_fk";
        ALTER TABLE "pages_blocks_small_pricing_max_missing_features" RENAME TO "pages_blocks_small_pricing_max_missing";
        ALTER INDEX "pages_blocks_small_pricing_max_missing_features_order_idx" RENAME TO "pages_blocks_small_pricing_max_missing_order_idx";
        ALTER INDEX "pages_blocks_small_pricing_max_missing_features_parent_id_idx" RENAME TO "pages_blocks_small_pricing_max_missing_parent_id_idx";
        ALTER INDEX "pages_blocks_small_pricing_max_missing_features_locale_idx" RENAME TO "pages_blocks_small_pricing_max_missing_locale_idx";
        ALTER TABLE "pages_blocks_small_pricing_max_missing" RENAME CONSTRAINT "pages_blocks_small_pricing_max_missing_features_parent_id_fk" TO "pages_blocks_small_pricing_max_missing_parent_id_fk";
        ALTER TABLE "pages_blocks_small_pricing_custom_missing_features" RENAME TO "pages_blocks_small_pricing_custom_missing";
        ALTER INDEX "pages_blocks_small_pricing_custom_missing_features_order_idx" RENAME TO "pages_blocks_small_pricing_custom_missing_order_idx";
        ALTER INDEX "pages_blocks_small_pricing_custom_missing_features_parent_id_id" RENAME TO "pages_blocks_small_pricing_custom_missing_parent_id_idx";
        ALTER INDEX "pages_blocks_small_pricing_custom_missing_features_locale_idx" RENAME TO "pages_blocks_small_pricing_custom_missing_locale_idx";
        ALTER TABLE "pages_blocks_small_pricing_custom_missing" RENAME CONSTRAINT "pages_blocks_small_pricing_custom_missing_features_parent_id_fk" TO "pages_blocks_small_pricing_custom_missing_parent_id_fk";
        ALTER TABLE "subscription_config_workflow_calculator_business_types" RENAME TO "subscription_config_workflow_calculator_types";
        ALTER INDEX "subscription_config_workflow_calculator_business_types_order_id" RENAME TO "subscription_config_workflow_calculator_types_order_idx";
        ALTER INDEX "subscription_config_workflow_calculator_business_types_parent_i" RENAME TO "subscription_config_workflow_calculator_types_parent_id_idx";
        ALTER TABLE "subscription_config_workflow_calculator_types" RENAME CONSTRAINT "subscription_config_workflow_calculator_business_types_parent_i" TO "subscription_config_workflow_calculator_types_parent_id_fk";
        ALTER TABLE "subscription_config_workflow_calculator_business_types_locales" RENAME TO "subscription_config_workflow_calculator_types_locales";
        ALTER INDEX "subscription_config_workflow_calculator_business_types_local" RENAME TO "subscription_config_workflow_calculator_types_locales_locale";
        ALTER TABLE "subscription_config_workflow_calculator_types_locales" RENAME CONSTRAINT "subscription_config_workflow_calculator_business_types_lo_fk" TO "subscription_config_workflow_calculator_types_locales_par_fk";
        ALTER SEQUENCE "subscription_config_workflow_calculator_business_types_l_id_seq" RENAME TO "subscription_config_workflow_calculator_types_locales_id_seq";
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER SEQUENCE "subscription_config_workflow_calculator_types_locales_id_seq" RENAME TO "subscription_config_workflow_calculator_business_types_l_id_seq";
        ALTER TABLE "subscription_config_workflow_calculator_types_locales" RENAME CONSTRAINT "subscription_config_workflow_calculator_types_locales_par_fk" TO "subscription_config_workflow_calculator_business_types_lo_fk";
        ALTER INDEX "subscription_config_workflow_calculator_types_locales_locale" RENAME TO "subscription_config_workflow_calculator_business_types_local";
        ALTER TABLE "subscription_config_workflow_calculator_types_locales" RENAME TO "subscription_config_workflow_calculator_business_types_locales";
        ALTER TABLE "subscription_config_workflow_calculator_types" RENAME CONSTRAINT "subscription_config_workflow_calculator_types_parent_id_fk" TO "subscription_config_workflow_calculator_business_types_parent_i";
        ALTER INDEX "subscription_config_workflow_calculator_types_parent_id_idx" RENAME TO "subscription_config_workflow_calculator_business_types_parent_i";
        ALTER INDEX "subscription_config_workflow_calculator_types_order_idx" RENAME TO "subscription_config_workflow_calculator_business_types_order_id";
        ALTER TABLE "subscription_config_workflow_calculator_types" RENAME TO "subscription_config_workflow_calculator_business_types";
        ALTER TABLE "pages_blocks_small_pricing_custom_missing" RENAME CONSTRAINT "pages_blocks_small_pricing_custom_missing_parent_id_fk" TO "pages_blocks_small_pricing_custom_missing_features_parent_id_fk";
        ALTER INDEX "pages_blocks_small_pricing_custom_missing_locale_idx" RENAME TO "pages_blocks_small_pricing_custom_missing_features_locale_idx";
        ALTER INDEX "pages_blocks_small_pricing_custom_missing_parent_id_idx" RENAME TO "pages_blocks_small_pricing_custom_missing_features_parent_id_id";
        ALTER INDEX "pages_blocks_small_pricing_custom_missing_order_idx" RENAME TO "pages_blocks_small_pricing_custom_missing_features_order_idx";
        ALTER TABLE "pages_blocks_small_pricing_custom_missing" RENAME TO "pages_blocks_small_pricing_custom_missing_features";
        ALTER TABLE "pages_blocks_small_pricing_max_missing" RENAME CONSTRAINT "pages_blocks_small_pricing_max_missing_parent_id_fk" TO "pages_blocks_small_pricing_max_missing_features_parent_id_fk";
        ALTER INDEX "pages_blocks_small_pricing_max_missing_locale_idx" RENAME TO "pages_blocks_small_pricing_max_missing_features_locale_idx";
        ALTER INDEX "pages_blocks_small_pricing_max_missing_parent_id_idx" RENAME TO "pages_blocks_small_pricing_max_missing_features_parent_id_idx";
        ALTER INDEX "pages_blocks_small_pricing_max_missing_order_idx" RENAME TO "pages_blocks_small_pricing_max_missing_features_order_idx";
        ALTER TABLE "pages_blocks_small_pricing_max_missing" RENAME TO "pages_blocks_small_pricing_max_missing_features";
        ALTER TABLE "pages_blocks_small_pricing_pro_missing" RENAME CONSTRAINT "pages_blocks_small_pricing_pro_missing_parent_id_fk" TO "pages_blocks_small_pricing_pro_missing_features_parent_id_fk";
        ALTER INDEX "pages_blocks_small_pricing_pro_missing_locale_idx" RENAME TO "pages_blocks_small_pricing_pro_missing_features_locale_idx";
        ALTER INDEX "pages_blocks_small_pricing_pro_missing_parent_id_idx" RENAME TO "pages_blocks_small_pricing_pro_missing_features_parent_id_idx";
        ALTER INDEX "pages_blocks_small_pricing_pro_missing_order_idx" RENAME TO "pages_blocks_small_pricing_pro_missing_features_order_idx";
        ALTER TABLE "pages_blocks_small_pricing_pro_missing" RENAME TO "pages_blocks_small_pricing_pro_missing_features";
        ALTER TABLE "pages_blocks_pricing_custom_missing" RENAME CONSTRAINT "pages_blocks_pricing_custom_missing_parent_id_fk" TO "pages_blocks_pricing_custom_missing_features_parent_id_fk";
        ALTER INDEX "pages_blocks_pricing_custom_missing_locale_idx" RENAME TO "pages_blocks_pricing_custom_missing_features_locale_idx";
        ALTER INDEX "pages_blocks_pricing_custom_missing_parent_id_idx" RENAME TO "pages_blocks_pricing_custom_missing_features_parent_id_idx";
        ALTER INDEX "pages_blocks_pricing_custom_missing_order_idx" RENAME TO "pages_blocks_pricing_custom_missing_features_order_idx";
        ALTER TABLE "pages_blocks_pricing_custom_missing" RENAME TO "pages_blocks_pricing_custom_missing_features";
        ALTER TABLE "pages_blocks_pricing_max_missing" RENAME CONSTRAINT "pages_blocks_pricing_max_missing_parent_id_fk" TO "pages_blocks_pricing_max_missing_features_parent_id_fk";
        ALTER INDEX "pages_blocks_pricing_max_missing_locale_idx" RENAME TO "pages_blocks_pricing_max_missing_features_locale_idx";
        ALTER INDEX "pages_blocks_pricing_max_missing_parent_id_idx" RENAME TO "pages_blocks_pricing_max_missing_features_parent_id_idx";
        ALTER INDEX "pages_blocks_pricing_max_missing_order_idx" RENAME TO "pages_blocks_pricing_max_missing_features_order_idx";
        ALTER TABLE "pages_blocks_pricing_max_missing" RENAME TO "pages_blocks_pricing_max_missing_features";
        ALTER TABLE "pages_blocks_pricing_pro_missing" RENAME CONSTRAINT "pages_blocks_pricing_pro_missing_parent_id_fk" TO "pages_blocks_pricing_pro_missing_features_parent_id_fk";
        ALTER INDEX "pages_blocks_pricing_pro_missing_locale_idx" RENAME TO "pages_blocks_pricing_pro_missing_features_locale_idx";
        ALTER INDEX "pages_blocks_pricing_pro_missing_parent_id_idx" RENAME TO "pages_blocks_pricing_pro_missing_features_parent_id_idx";
        ALTER INDEX "pages_blocks_pricing_pro_missing_order_idx" RENAME TO "pages_blocks_pricing_pro_missing_features_order_idx";
        ALTER TABLE "pages_blocks_pricing_pro_missing" RENAME TO "pages_blocks_pricing_pro_missing_features";
    `)
}
