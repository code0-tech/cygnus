import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres"

const localizedColumns = [
    "license",
    "values_customer_types_personal",
    "values_customer_types_business",
    "values_deployment_types_cloud",
    "values_deployment_types_self_hosted",
    "values_payment_periods_weekly",
    "values_payment_periods_monthly",
    "values_payment_periods_quarterly",
    "values_payment_periods_yearly",
    "values_statuses_active",
    "values_statuses_paid",
    "values_statuses_payment_failed",
    "values_statuses_canceled",
    "values_statuses_expired",
    "values_plans_pro",
    "values_plans_max",
    "values_plans_custom",
    "values_unknown",
    "errors_dashboard_load",
    "errors_retry",
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales" ADD COLUMN "license" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "values_customer_types_personal" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "values_customer_types_business" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "values_deployment_types_cloud" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "values_deployment_types_self_hosted" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "values_payment_periods_weekly" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "values_payment_periods_monthly" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "values_payment_periods_quarterly" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "values_payment_periods_yearly" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "values_statuses_active" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "values_statuses_paid" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "values_statuses_payment_failed" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "values_statuses_canceled" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "values_statuses_expired" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "values_plans_pro" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "values_plans_max" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "values_plans_custom" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "values_unknown" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "errors_dashboard_load" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "errors_retry" varchar;

        UPDATE "licenses_locales" SET
            "license" = CASE WHEN "_locale" = 'de' THEN 'Lizenz' ELSE 'License' END,
            "values_customer_types_personal" = CASE WHEN "_locale" = 'de' THEN 'Privat' ELSE 'Personal' END,
            "values_customer_types_business" = CASE WHEN "_locale" = 'de' THEN 'Geschäftlich' ELSE 'Business' END,
            "values_deployment_types_cloud" = 'Cloud',
            "values_deployment_types_self_hosted" = 'Self-hosted',
            "values_payment_periods_weekly" = CASE WHEN "_locale" = 'de' THEN 'Wöchentlich' ELSE 'Weekly' END,
            "values_payment_periods_monthly" = CASE WHEN "_locale" = 'de' THEN 'Monatlich' ELSE 'Monthly' END,
            "values_payment_periods_quarterly" = CASE WHEN "_locale" = 'de' THEN 'Vierteljährlich' ELSE 'Quarterly' END,
            "values_payment_periods_yearly" = CASE WHEN "_locale" = 'de' THEN 'Jährlich' ELSE 'Yearly' END,
            "values_statuses_active" = CASE WHEN "_locale" = 'de' THEN 'Aktiv' ELSE 'Active' END,
            "values_statuses_paid" = CASE WHEN "_locale" = 'de' THEN 'Bezahlt' ELSE 'Paid' END,
            "values_statuses_payment_failed" = CASE WHEN "_locale" = 'de' THEN 'Zahlung fehlgeschlagen' ELSE 'Payment failed' END,
            "values_statuses_canceled" = CASE WHEN "_locale" = 'de' THEN 'Gekündigt' ELSE 'Canceled' END,
            "values_statuses_expired" = CASE WHEN "_locale" = 'de' THEN 'Abgelaufen' ELSE 'Expired' END,
            "values_plans_pro" = 'Pro',
            "values_plans_max" = 'Max',
            "values_plans_custom" = CASE WHEN "_locale" = 'de' THEN 'Individuell' ELSE 'Custom' END,
            "values_unknown" = CASE WHEN "_locale" = 'de' THEN 'Unbekannt' ELSE 'Unknown' END,
            "errors_dashboard_load" = CASE WHEN "_locale" = 'de' THEN 'Das Lizenz-Dashboard konnte nicht geladen werden.' ELSE 'The license dashboard could not be loaded.' END,
            "errors_retry" = CASE WHEN "_locale" = 'de' THEN 'Erneut versuchen' ELSE 'Try again' END;
    `)

    for (const column of localizedColumns) {
        await db.execute(sql.raw(`ALTER TABLE "licenses_locales" ALTER COLUMN "${column}" SET NOT NULL;`))
    }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    for (const column of [...localizedColumns].reverse()) {
        await db.execute(sql.raw(`ALTER TABLE "licenses_locales" DROP COLUMN "${column}";`))
    }
}
