import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        DO $$ BEGIN CREATE TYPE "public"."subscription_config_customer_type_default" AS ENUM ('b2c', 'b2b'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        DO $$ BEGIN CREATE TYPE "public"."subscription_config_plan_default" AS ENUM ('pro', 'max', 'custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        DO $$ BEGIN CREATE TYPE "public"."subscription_config_deployment_default" AS ENUM ('self_hosted', 'cloud'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        DO $$ BEGIN CREATE TYPE "public"."subscription_config_period_b2c_default" AS ENUM ('monthly', 'quarterly', 'yearly'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        DO $$ BEGIN CREATE TYPE "public"."subscription_config_period_b2b_default" AS ENUM ('monthly', 'quarterly', 'yearly'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

        ALTER TABLE "pages_blocks_subscription_configurator"
            ADD COLUMN IF NOT EXISTS "selection_defaults_customer_type" "public"."subscription_config_customer_type_default" DEFAULT 'b2c',
            ADD COLUMN IF NOT EXISTS "selection_defaults_plan" "public"."subscription_config_plan_default" DEFAULT 'custom',
            ADD COLUMN IF NOT EXISTS "selection_defaults_deployment" "public"."subscription_config_deployment_default" DEFAULT 'self_hosted',
            ADD COLUMN IF NOT EXISTS "selection_defaults_payment_period_b2_c" "public"."subscription_config_period_b2c_default" DEFAULT 'monthly',
            ADD COLUMN IF NOT EXISTS "selection_defaults_payment_period_b2_b" "public"."subscription_config_period_b2b_default" DEFAULT 'monthly',
            ADD COLUMN IF NOT EXISTS "selection_defaults_usage_b2_c_workflow_executions" numeric,
            ADD COLUMN IF NOT EXISTS "selection_defaults_usage_b2_c_ai_tokens" numeric,
            ADD COLUMN IF NOT EXISTS "selection_defaults_usage_b2_b_workflow_executions" numeric,
            ADD COLUMN IF NOT EXISTS "selection_defaults_usage_b2_b_ai_tokens" numeric;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "pages_blocks_subscription_configurator"
            DROP COLUMN IF EXISTS "selection_defaults_customer_type",
            DROP COLUMN IF EXISTS "selection_defaults_plan",
            DROP COLUMN IF EXISTS "selection_defaults_deployment",
            DROP COLUMN IF EXISTS "selection_defaults_payment_period_b2_c",
            DROP COLUMN IF EXISTS "selection_defaults_payment_period_b2_b",
            DROP COLUMN IF EXISTS "selection_defaults_usage_b2_c_workflow_executions",
            DROP COLUMN IF EXISTS "selection_defaults_usage_b2_c_ai_tokens",
            DROP COLUMN IF EXISTS "selection_defaults_usage_b2_b_workflow_executions",
            DROP COLUMN IF EXISTS "selection_defaults_usage_b2_b_ai_tokens";
        DROP TYPE IF EXISTS "public"."subscription_config_customer_type_default";
        DROP TYPE IF EXISTS "public"."subscription_config_plan_default";
        DROP TYPE IF EXISTS "public"."subscription_config_deployment_default";
        DROP TYPE IF EXISTS "public"."subscription_config_period_b2c_default";
        DROP TYPE IF EXISTS "public"."subscription_config_period_b2b_default";
    `)
}
