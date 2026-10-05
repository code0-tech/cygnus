import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_payment_period_label" varchar;
  ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_workflow_executions_label" varchar;
  ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_ai_tokens_label" varchar;

  UPDATE "licenses_locales"
  SET
    "dashboard_payment_period_label" = CASE WHEN "_locale" = 'de' THEN 'Zahlungsintervall' ELSE 'Payment period' END,
    "dashboard_workflow_executions_label" = CASE WHEN "_locale" = 'de' THEN 'Workflow-Ausführungen' ELSE 'Workflow executions' END,
    "dashboard_ai_tokens_label" = CASE WHEN "_locale" = 'de' THEN 'KI-Tokens' ELSE 'AI tokens' END;

  ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_payment_period_label" SET NOT NULL;
  ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_workflow_executions_label" SET NOT NULL;
  ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_ai_tokens_label" SET NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_payment_period_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_workflow_executions_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_ai_tokens_label";`)
}
