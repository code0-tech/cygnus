import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "license_dialogs_locales"
            ADD COLUMN "billing_current_period_end_pending_description" varchar,
            ADD COLUMN "billing_pending_change_note" varchar;

        UPDATE "license_dialogs_locales" SET
            "billing_current_period_end_pending_description" = CASE WHEN "_locale" = 'de'
                THEN 'Das Abonnement wechselt am {date} auf {selection}.'
                ELSE 'The subscription switches to {selection} on {date}.' END,
            "billing_pending_change_note" = CASE WHEN "_locale" = 'de'
                THEN 'Wechselt auf {selection}'
                ELSE 'Switches to {selection}' END;

        ALTER TABLE "license_dialogs_locales"
            ALTER COLUMN "billing_current_period_end_pending_description" SET NOT NULL,
            ALTER COLUMN "billing_pending_change_note" SET NOT NULL;

        ALTER TABLE "license_dialogs_locales"
            DROP COLUMN "subscription_preview_pending_change_text";
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "license_dialogs_locales"
            ADD COLUMN "subscription_preview_pending_change_text" varchar;

        UPDATE "license_dialogs_locales" SET
            "subscription_preview_pending_change_text" = CASE WHEN "_locale" = 'de'
                THEN 'Wechsel auf {selection} am {date}.'
                ELSE 'Switch to {selection} on {date}.' END;

        ALTER TABLE "license_dialogs_locales"
            ALTER COLUMN "subscription_preview_pending_change_text" SET NOT NULL;

        ALTER TABLE "license_dialogs_locales"
            DROP COLUMN "billing_current_period_end_pending_description",
            DROP COLUMN "billing_pending_change_note";
    `)
}
