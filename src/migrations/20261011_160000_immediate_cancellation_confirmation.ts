import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "license_dialogs_locales"
            ADD COLUMN "cancel_immediate_confirm_heading" varchar,
            ADD COLUMN "cancel_immediate_confirm_description" varchar,
            ADD COLUMN "cancel_immediate_confirm_submit_label" varchar,
            ADD COLUMN "cancel_immediate_confirm_back_label" varchar;

        UPDATE "license_dialogs_locales" SET
            "cancel_immediate_confirm_heading" = CASE WHEN "_locale" = 'de' THEN 'Abonnement sofort kündigen?' ELSE 'Cancel your subscription immediately?' END,
            "cancel_immediate_confirm_description" = CASE WHEN "_locale" = 'de'
                THEN 'Dein Abonnement endet sofort statt zum Ende der Abrechnungsperiode. Das lässt sich nicht rückgängig machen: Das Abonnement kann nicht fortgesetzt werden, für eine weitere Nutzung ist ein neuer Checkout nötig. Bereits bezahlte Lizenzzeiträume bleiben bis zu ihrem Enddatum gültig.'
                ELSE 'Your subscription ends right now instead of at the end of the billing period. This cannot be undone: the subscription cannot be resumed, and continuing requires a new checkout. Licenses already paid for remain valid until their end date.' END,
            "cancel_immediate_confirm_submit_label" = CASE WHEN "_locale" = 'de' THEN 'Ja, sofort kündigen' ELSE 'Yes, cancel immediately' END,
            "cancel_immediate_confirm_back_label" = CASE WHEN "_locale" = 'de' THEN 'Zurück' ELSE 'Go back' END;

        ALTER TABLE "license_dialogs_locales"
            ALTER COLUMN "cancel_immediate_confirm_heading" SET NOT NULL,
            ALTER COLUMN "cancel_immediate_confirm_description" SET NOT NULL,
            ALTER COLUMN "cancel_immediate_confirm_submit_label" SET NOT NULL,
            ALTER COLUMN "cancel_immediate_confirm_back_label" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "license_dialogs_locales"
            DROP COLUMN "cancel_immediate_confirm_heading",
            DROP COLUMN "cancel_immediate_confirm_description",
            DROP COLUMN "cancel_immediate_confirm_submit_label",
            DROP COLUMN "cancel_immediate_confirm_back_label";
    `)
}
