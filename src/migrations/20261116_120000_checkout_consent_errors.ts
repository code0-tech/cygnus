import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

type LocalizedColumn = { table: string; column: string; en: string; de: string }

const COLUMNS: LocalizedColumn[] = [
    {
        table: "errors_locales",
        column: "checkout_consent_missing",
        en: "Please confirm the highlighted consents to continue.",
        de: "Bitte bestätige die markierten Zustimmungen, um fortzufahren.",
    },
    {
        table: "errors_locales",
        column: "checkout_consent_record",
        en: "Your consent could not be saved, so the payment was not started. Please try again.",
        de: "Deine Zustimmung konnte nicht gespeichert werden, daher wurde die Zahlung nicht gestartet. Bitte versuche es erneut.",
    },
    {
        table: "errors_locales",
        column: "checkout_consent_session",
        en: "This checkout can no longer be completed. Please restart the checkout.",
        de: "Dieser Checkout kann nicht mehr abgeschlossen werden. Bitte starte den Checkout neu.",
    },
    { table: "errors_locales", column: "checkout_restart", en: "Restart checkout", de: "Checkout neu starten" },
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
