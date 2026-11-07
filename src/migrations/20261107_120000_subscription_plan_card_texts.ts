import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "subscription_config_locales"
            ADD COLUMN "plan_ai_tokens_label" varchar,
            ADD COLUMN "plan_workflow_executions_label" varchar,
            ADD COLUMN "plan_more_workflows_label" varchar,
            ADD COLUMN "plan_max_comparison_text" varchar,
            ADD COLUMN "plan_max_price_difference_text" varchar,
            ADD COLUMN "plan_custom_quantities_text" varchar,
            ADD COLUMN "plan_custom_price_fallback_text" varchar;

        UPDATE "subscription_config_locales" SET
            "plan_ai_tokens_label" = 'AI Tokens',
            "plan_workflow_executions_label" = CASE WHEN "_locale" = 'de' THEN 'Workflow-Ausführungen' ELSE 'Workflow Executions' END,
            "plan_more_workflows_label" = CASE WHEN "_locale" = 'de' THEN 'mehr Workflows' ELSE 'more workflows' END,
            "plan_max_comparison_text" = CASE WHEN "_locale" = 'de' THEN '{multiplier} mehr als Pro' ELSE '{multiplier} more than Pro' END,
            "plan_max_price_difference_text" = CASE WHEN "_locale" = 'de' THEN 'nur {amount} mehr als Pro' ELSE 'only {amount} more than Pro' END,
            "plan_custom_quantities_text" = CASE WHEN "_locale" = 'de' THEN 'Ab {quantities}' ELSE 'From {quantities}' END,
            "plan_custom_price_fallback_text" = CASE WHEN "_locale" = 'de' THEN 'Preis hängt von deiner Konfiguration ab' ELSE 'Price depends on your configuration' END;

        ALTER TABLE "subscription_config_locales"
            ALTER COLUMN "plan_ai_tokens_label" SET NOT NULL,
            ALTER COLUMN "plan_workflow_executions_label" SET NOT NULL,
            ALTER COLUMN "plan_more_workflows_label" SET NOT NULL,
            ALTER COLUMN "plan_max_comparison_text" SET NOT NULL,
            ALTER COLUMN "plan_max_price_difference_text" SET NOT NULL,
            ALTER COLUMN "plan_custom_quantities_text" SET NOT NULL,
            ALTER COLUMN "plan_custom_price_fallback_text" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "subscription_config_locales"
            DROP COLUMN "plan_ai_tokens_label",
            DROP COLUMN "plan_workflow_executions_label",
            DROP COLUMN "plan_more_workflows_label",
            DROP COLUMN "plan_max_comparison_text",
            DROP COLUMN "plan_max_price_difference_text",
            DROP COLUMN "plan_custom_quantities_text",
            DROP COLUMN "plan_custom_price_fallback_text";
    `)
}
