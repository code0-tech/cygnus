import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

// Localized texts of the subscriptionConfig global that became required: [column, English default, German default].
// The English values are the column defaults this migration drops, so down() can restore them.
const LOCALIZED_TEXTS: [string, string, string][] = [
    ["deployment_label", "Choose where your code0 instance will run.", "Wähle, wo deine code0-Instanz laufen soll."],
    ["deployment_self_hosted_title", "Self-hosted", "Self-hosted"],
    [
        "deployment_self_hosted_description",
        "Deploy on your own infrastructure with full operational control.",
        "Betreibe code0 auf deiner eigenen Infrastruktur mit voller Kontrolle über den Betrieb.",
    ],
    ["deployment_cloud_title", "Cloud", "Cloud"],
    ["deployment_cloud_description", "Use managed infrastructure with selectable runtime consumption.", "Nutze verwaltete Infrastruktur mit wählbarem Laufzeitverbrauch."],
    ["plan_title", "Choose the plan that best matches your requirements.", "Wähle den Plan, der am besten zu deinen Anforderungen passt."],
    ["plan_pro_title", "Pro", "Pro"],
    ["plan_pro_description", "A ready-to-use plan for individuals and smaller teams.", "Ein sofort nutzbarer Plan für Einzelpersonen und kleinere Teams."],
    ["plan_max_title", "Max", "Max"],
    ["plan_max_description", "A ready-to-use plan for organizations with higher requirements.", "Ein sofort nutzbarer Plan für Organisationen mit höheren Anforderungen."],
    ["plan_custom_title", "Custom", "Custom"],
    ["plan_custom_description", "Configure usage for an individual setup.", "Konfiguriere die Nutzung für ein individuelles Setup."],
    ["customer_type_label", "Choose the customer model that best matches your use case.", "Wähle das Kundenmodell, das am besten zu deinem Anwendungsfall passt."],
    ["customer_type_b2b_title", "B2B", "B2B"],
    ["customer_type_b2b_description", "Organization purchase flow with tailored commercial handling.", "Kaufprozess für Organisationen mit individueller kaufmännischer Abwicklung."],
    ["customer_type_b2c_title", "B2C", "B2C"],
    ["customer_type_b2c_description", "Standardized subscription flow with directly selectable plans.", "Standardisierter Abo-Prozess mit direkt wählbaren Plänen."],
    ["packages_pro_title", "Pro", "Pro"],
    ["packages_pro_description", "For individuals and smaller teams.", "Für Einzelpersonen und kleinere Teams."],
    ["packages_max_title", "Max", "Max"],
    ["packages_max_description", "For organizations with higher requirements.", "Für Organisationen mit höheren Anforderungen."],
    ["packages_custom_title", "Custom", "Custom"],
    ["packages_custom_description", "A tailored package for individual requirements.", "Ein maßgeschneidertes Paket für individuelle Anforderungen."],
    ["payment_period_label", "Choose how often you want to be billed.", "Wähle, wie oft du abgerechnet werden möchtest."],
    ["payment_period_monthly_text", "Monthly", "Monatlich"],
    ["payment_period_quarterly_text", "Quarterly", "Vierteljährlich"],
    ["payment_period_yearly_text", "Yearly", "Jährlich"],
    ["payment_period_monthly_period_suffix", "per month", "pro Monat"],
    ["payment_period_quarterly_period_suffix", "per quarter", "pro Quartal"],
    ["payment_period_yearly_period_suffix", "per year", "pro Jahr"],
    ["payment_period_quarterly_paid_label", "paid quarterly", "vierteljährlich bezahlt"],
    ["payment_period_yearly_paid_label", "paid yearly", "jährlich bezahlt"],
    ["workflow_executions_title", "How many workflow executions do you expect per month?", "Wie viele Workflow-Ausführungen erwartest du pro Monat?"],
    ["workflow_executions_suffix", "exec", "Ausf."],
    ["workflow_calculator_trigger_label", "Calculate", "Berechnen"],
    ["workflow_calculator_title", "Calculate workflow executions", "Workflow-Ausführungen berechnen"],
    [
        "workflow_calculator_description",
        "Estimate monthly volume from your active workflows and their average execution frequency.",
        "Schätze das monatliche Volumen anhand deiner aktiven Workflows und ihrer durchschnittlichen Ausführungshäufigkeit.",
    ],
    ["workflow_calculator_close_label", "Close dialog", "Dialog schließen"],
    ["workflow_calculator_business_type_label", "Business type", "Geschäftsbereich"],
    ["workflow_calculator_business_type_search_placeholder", "Search business types", "Geschäftsbereiche durchsuchen"],
    ["workflow_calculator_no_business_types_found_label", "No business types found.", "Keine Geschäftsbereiche gefunden."],
    ["workflow_calculator_active_workflows_label", "Active workflows", "Aktive Workflows"],
    ["workflow_calculator_runs_per_day_label", "Runs per month", "Ausführungen pro Monat"],
    ["workflow_calculator_days_per_month_label", "Days per month", "Tage pro Monat"],
    ["workflow_calculator_estimate_label", "Estimated monthly volume", "Geschätztes monatliches Volumen"],
    ["workflow_calculator_cancel_label", "Cancel", "Abbrechen"],
    ["workflow_calculator_apply_label", "Apply value", "Wert übernehmen"],
    ["ai_tokens_title", "How many AI tokens do you expect to consume per month?", "Wie viele KI-Tokens erwartest du pro Monat zu verbrauchen?"],
    ["ai_tokens_suffix", "tokens", "Tokens"],
    ["contact_sales_prompt", "Need more?", "Du brauchst mehr?"],
    ["contact_sales_label", "Contact sales", "Vertrieb kontaktieren"],
    ["subscribe_label", "Buy now", "Jetzt kaufen"],
]

// Non-localized columns of subscription_config that became required: [column, default]. They keep their column default.
const CONFIG_VALUES: [string, string][] = [
    ["defaults_deployment", "self_hosted"],
    ["defaults_customer_type", "b2b"],
    ["defaults_payment_period_b2b", "monthly"],
    ["defaults_payment_period_b2c", "monthly"],
    ["deployment_self_hosted_color", "yellow"],
    ["deployment_cloud_color", "aqua"],
    ["plan_pro_color", "lime"],
    ["plan_max_color", "magenta"],
    ["plan_custom_color", "yellow"],
    ["customer_type_b2b_color", "blue"],
    ["customer_type_b2c_color", "pink"],
    ["payment_period_monthly_color", "brand"],
    ["payment_period_quarterly_color", "aqua"],
    ["payment_period_yearly_color", "magenta"],
    ["contact_sales_href", "/contact"],
]

const literal = (value: string) => `'${value.replaceAll("'", "''")}'`
const localizedValue = (en: string, de: string) => `CASE WHEN "_locale" = 'de' THEN ${literal(de)} ELSE ${literal(en)} END`
// Enum columns cannot be compared with an empty string, so only text columns treat blank values as missing.
const isMissing = (column: string, text: boolean) => (text ? `("${column}" IS NULL OR btrim("${column}") = '')` : `"${column}" IS NULL`)

export async function up({ db }: MigrateUpArgs): Promise<void> {
    const fillLocales = LOCALIZED_TEXTS.map(([column, en, de]) => `"${column}" = CASE WHEN ${isMissing(column, true)} THEN ${localizedValue(en, de)} ELSE "${column}" END`).join(",\n            ")
    const fillConfig = CONFIG_VALUES.map(([column, value]) => {
        const text = column === "contact_sales_href"
        return `"${column}" = CASE WHEN ${isMissing(column, text)} THEN ${literal(value)} ELSE "${column}" END`
    }).join(",\n            ")

    await db.execute(
        sql.raw(`
        UPDATE "subscription_config" SET
            ${fillConfig},
            "subscribe_base_url" = CASE WHEN ${isMissing("subscribe_base_url", true)} THEN '/checkout' ELSE "subscribe_base_url" END;

        ALTER TABLE "subscription_config"
            ${CONFIG_VALUES.map(([column]) => `ALTER COLUMN "${column}" SET NOT NULL`).join(",\n            ")},
            ALTER COLUMN "subscribe_base_url" SET DEFAULT '/checkout',
            ALTER COLUMN "subscribe_base_url" SET NOT NULL;

        UPDATE "subscription_config_locales" SET
            ${fillLocales};

        ALTER TABLE "subscription_config_locales"
            ${LOCALIZED_TEXTS.map(([column]) => `ALTER COLUMN "${column}" DROP DEFAULT, ALTER COLUMN "${column}" SET NOT NULL`).join(",\n            ")};

        UPDATE "subscription_config_workflow_calculator_business_types" SET "conversion_rate" = 1 WHERE "conversion_rate" IS NULL;
        ALTER TABLE "subscription_config_workflow_calculator_business_types" ALTER COLUMN "conversion_rate" SET NOT NULL;

        UPDATE "subscription_config_workflow_calculator_business_types_locales" SET
            "name" = CASE WHEN ${isMissing("name", true)} THEN ${localizedValue("General", "Allgemein")} ELSE "name" END,
            "conversion_unit" = CASE WHEN ${isMissing("conversion_unit", true)} THEN ${localizedValue("executions", "Ausführungen")} ELSE "conversion_unit" END;

        ALTER TABLE "subscription_config_workflow_calculator_business_types_locales"
            ALTER COLUMN "name" SET NOT NULL,
            ALTER COLUMN "conversion_unit" DROP DEFAULT,
            ALTER COLUMN "conversion_unit" SET NOT NULL;
    `)
    )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(
        sql.raw(`
        ALTER TABLE "subscription_config"
            ${CONFIG_VALUES.map(([column]) => `ALTER COLUMN "${column}" DROP NOT NULL`).join(",\n            ")},
            ALTER COLUMN "subscribe_base_url" SET DEFAULT '',
            ALTER COLUMN "subscribe_base_url" DROP NOT NULL;

        ALTER TABLE "subscription_config_locales"
            ${LOCALIZED_TEXTS.map(([column, en]) => `ALTER COLUMN "${column}" SET DEFAULT ${literal(en)}, ALTER COLUMN "${column}" DROP NOT NULL`).join(",\n            ")};

        ALTER TABLE "subscription_config_workflow_calculator_business_types" ALTER COLUMN "conversion_rate" DROP NOT NULL;

        ALTER TABLE "subscription_config_workflow_calculator_business_types_locales"
            ALTER COLUMN "name" DROP NOT NULL,
            ALTER COLUMN "conversion_unit" SET DEFAULT 'executions',
            ALTER COLUMN "conversion_unit" DROP NOT NULL;
    `)
    )
}
