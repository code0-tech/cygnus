import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

type LocalizedColumn = { table: string; column: string; en: string; de: string }

const COLUMNS: LocalizedColumn[] = [
    { table: "licenses_locales", column: "dashboard_usage_label", en: "Usage", de: "Nutzung" },
    { table: "licenses_locales", column: "dashboard_usage_description", en: "Consumption in the current usage period. The figures can lag a few minutes behind.", de: "Verbrauch im aktuellen Nutzungszeitraum. Die Zahlen können einige Minuten verzögert sein." },
    { table: "licenses_locales", column: "dashboard_usage_of_label", en: "of {allowance}", de: "von {allowance}" },
    { table: "licenses_locales", column: "dashboard_usage_remaining_label", en: "{remaining} remaining", de: "{remaining} übrig" },
    { table: "licenses_locales", column: "dashboard_usage_unlimited_label", en: "Unlimited", de: "Unbegrenzt" },
    { table: "licenses_locales", column: "dashboard_usage_exceeded_label", en: "Allowance exceeded", de: "Kontingent überschritten" },
    { table: "licenses_locales", column: "dashboard_usage_resets_at_label", en: "Resets on {date}", de: "Wird am {date} zurückgesetzt" },
    { table: "licenses_locales", column: "dashboard_usage_updated_at_label", en: "Updated {time}", de: "Stand: {time}" },
    { table: "licenses_locales", column: "dashboard_usage_unavailable_description", en: "Usage can't be loaded right now. Please try again later.", de: "Die Nutzung kann gerade nicht abgerufen werden. Bitte versuche es später erneut." },
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
    // IF NOT EXISTS / COALESCE: local databases may already have an empty column from Payload's dev schema push.
    // One statement per call: Postgres refuses bound parameters in a multi-statement query.
    for (const { table, column, en, de } of COLUMNS) {
        await db.execute(sql`ALTER TABLE ${sql.identifier(table)} ADD COLUMN IF NOT EXISTS ${sql.identifier(column)} varchar`)
        await db.execute(sql`
            UPDATE ${sql.identifier(table)} SET
                ${sql.identifier(column)} = COALESCE(
                    NULLIF(${sql.identifier(column)}, ''),
                    CASE WHEN "_locale" = 'de' THEN ${de}::varchar ELSE ${en}::varchar END
                )
        `)
        await db.execute(sql`ALTER TABLE ${sql.identifier(table)} ALTER COLUMN ${sql.identifier(column)} SET NOT NULL`)
    }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    for (const { table, column } of COLUMNS) {
        await db.execute(sql`
            ALTER TABLE ${sql.identifier(table)} DROP COLUMN IF EXISTS ${sql.identifier(column)};
        `)
    }
}
