import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "license_dialogs_locales"
            ADD COLUMN "billing_heading" varchar,
            ADD COLUMN "billing_status_description" varchar,
            ADD COLUMN "billing_current_period_end_description" varchar,
            ADD COLUMN "billing_current_period_end_unknown_description" varchar,
            ADD COLUMN "subscription_preview_total_description" varchar,
            ADD COLUMN "subscription_preview_proration_description" varchar;

        UPDATE "license_dialogs_locales" SET
            "billing_heading" = CASE WHEN "_locale" = 'de' THEN 'Abrechnung' ELSE 'Billing' END,
            "billing_status_description" = CASE WHEN "_locale" = 'de'
                THEN 'Der aktuelle Zustand dieses Abonnements und der Zugriff, den es gewährt.'
                ELSE 'The current state of this subscription and the access it grants.' END,
            "billing_current_period_end_description" = CASE WHEN "_locale" = 'de'
                THEN 'Das Abonnement verlängert sich am {date}, sofern es nicht vorher gekündigt wird.'
                ELSE 'The subscription renews on {date} unless it is canceled before.' END,
            "billing_current_period_end_unknown_description" = CASE WHEN "_locale" = 'de'
                THEN 'Für dieses Abonnement steht noch keine Verlängerung an.'
                ELSE 'This subscription has no scheduled renewal yet.' END,
            "subscription_preview_total_description" = CASE WHEN "_locale" = 'de'
                THEN 'Was dir nach dieser Änderung pro Periode berechnet wird.'
                ELSE 'What you will be billed per period once this change applies.' END,
            "subscription_preview_proration_description" = CASE WHEN "_locale" = 'de'
                THEN 'Die Differenz für den Rest der aktuellen Periode.'
                ELSE 'The difference for the remainder of the current period.' END;

        ALTER TABLE "license_dialogs_locales"
            ALTER COLUMN "billing_heading" SET NOT NULL,
            ALTER COLUMN "billing_status_description" SET NOT NULL,
            ALTER COLUMN "billing_current_period_end_description" SET NOT NULL,
            ALTER COLUMN "billing_current_period_end_unknown_description" SET NOT NULL,
            ALTER COLUMN "subscription_preview_total_description" SET NOT NULL,
            ALTER COLUMN "subscription_preview_proration_description" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "license_dialogs_locales"
            DROP COLUMN "billing_heading",
            DROP COLUMN "billing_status_description",
            DROP COLUMN "billing_current_period_end_description",
            DROP COLUMN "billing_current_period_end_unknown_description",
            DROP COLUMN "subscription_preview_total_description",
            DROP COLUMN "subscription_preview_proration_description";
    `)
}
