import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

type LocalizedColumn = { table: string; column: string; en: string; de: string }

const COLUMNS: LocalizedColumn[] = [
    { table: "license_dialogs_locales", column: "cancel_extraordinary_label", en: "Terminate for cause", de: "Außerordentlich kündigen" },
    {
        table: "license_dialogs_locales",
        column: "cancel_extraordinary_description",
        en: "If you have good cause, for example a prolonged outage or a breach of contract on our side, you can terminate extraordinarily. We review your request within three business days and let you know by email whether your subscription ends immediately or at the end of the billing period.",
        de: "Liegt ein wichtiger Grund vor, etwa ein längerer Ausfall oder eine Vertragsverletzung unsererseits, kannst du außerordentlich kündigen. Wir prüfen deinen Antrag innerhalb von drei Werktagen und teilen dir per E-Mail mit, ob dein Abonnement sofort oder zum Ende der Abrechnungsperiode endet.",
    },
    { table: "license_dialogs_locales", column: "cancel_extraordinary_reason_placeholder", en: "Select a reason", de: "Grund auswählen" },
    { table: "license_dialogs_locales", column: "cancel_extraordinary_submit_label", en: "Submit termination request", de: "Kündigungsantrag senden" },
    {
        table: "license_dialogs_locales",
        column: "cancel_extraordinary_requested_description",
        en: "Your request is being reviewed. We will let you know the outcome by email within three business days.",
        de: "Dein Antrag wird geprüft. Wir teilen dir das Ergebnis innerhalb von drei Werktagen per E-Mail mit.",
    },
    { table: "license_dialogs_locales", column: "cancel_extraordinary_reasons_prolonged_outage", en: "Prolonged outage of the service", de: "Längerer Ausfall des Dienstes" },
    { table: "license_dialogs_locales", column: "cancel_extraordinary_reasons_unresolved_material_defect", en: "Material defect that remains unresolved", de: "Erheblicher Mangel, der nicht behoben wird" },
    { table: "license_dialogs_locales", column: "cancel_extraordinary_reasons_core_feature_removed", en: "A core feature was removed", de: "Eine Kernfunktion wurde entfernt" },
    { table: "license_dialogs_locales", column: "cancel_extraordinary_reasons_data_breach_by_provider", en: "Data breach on the provider's side", de: "Datenschutzverletzung beim Anbieter" },
    { table: "license_dialogs_locales", column: "cancel_extraordinary_reasons_breach_of_contractual_commitment", en: "Breach of a contractual commitment", de: "Verletzung einer vertraglichen Zusage" },
    { table: "license_dialogs_locales", column: "cancel_extraordinary_reasons_dpa_violation", en: "Violation of the data processing agreement", de: "Verstoß gegen den Auftragsverarbeitungsvertrag" },
    { table: "license_dialogs_locales", column: "cancel_extraordinary_reasons_unjustified_suspension", en: "Unjustified suspension of my account", de: "Unberechtigte Sperrung meines Kontos" },
    { table: "license_dialogs_locales", column: "cancel_extraordinary_reasons_other", en: "Other good cause", de: "Sonstiger wichtiger Grund" },
    { table: "license_toasts_locales", column: "termination_requested_title", en: "Termination request received", de: "Kündigungsantrag eingegangen" },
    {
        table: "license_toasts_locales",
        column: "termination_requested_description",
        en: "We review your request within three business days and send you a confirmation by email. Your subscription stays active until then.",
        de: "Wir prüfen deinen Antrag innerhalb von drei Werktagen und senden dir eine Bestätigung per E-Mail. Bis dahin bleibt dein Abo aktiv.",
    },
    {
        table: "errors_locales",
        column: "extraordinary_termination",
        en: "The termination request could not be submitted. If you already submitted one, it is still being reviewed.",
        de: "Der Kündigungsantrag konnte nicht gesendet werden. Falls du bereits einen gestellt hast, wird dieser noch geprüft.",
    },
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
