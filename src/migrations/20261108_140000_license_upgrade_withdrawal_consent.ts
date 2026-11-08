import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    // IF NOT EXISTS / COALESCE: local databases may already have an empty column from Payload's dev schema push.
    await db.execute(sql`
        ALTER TABLE "license_dialogs_locales" ADD COLUMN IF NOT EXISTS "upgrade_withdrawal_consent_text" varchar;

        UPDATE "license_dialogs_locales" SET
            "upgrade_withdrawal_consent_text" = COALESCE(
                NULLIF("upgrade_withdrawal_consent_text", ''),
                CASE WHEN "_locale" = 'de'
                    THEN 'Ich verlange ausdrücklich, dass Code0 vor Ablauf der Widerrufsfrist mit der Leistung beginnt. Mir ist bekannt, dass ich bei einem Widerruf für die bis dahin erbrachte Leistung einen anteiligen Betrag zahlen muss.'
                    ELSE 'I expressly request that Code0 begins providing the service before the withdrawal period ends. I acknowledge that if I withdraw, I must pay a pro-rata amount for the service provided up to that point.'
                END
            );

        ALTER TABLE "license_dialogs_locales" ALTER COLUMN "upgrade_withdrawal_consent_text" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "license_dialogs_locales" DROP COLUMN "upgrade_withdrawal_consent_text";
    `)
}
