import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "license_dialogs_locales"
            ADD COLUMN "cancel_immediate_confirm_label" varchar,
            ADD COLUMN "cancel_immediate_description" varchar,
            ADD COLUMN "cancel_immediate_until_label" varchar;

        UPDATE "license_dialogs_locales" SET
            "cancel_immediate_confirm_label" = CASE WHEN "_locale" = 'de' THEN 'Sofort kündigen' ELSE 'Cancel immediately' END,
            "cancel_immediate_description" = CASE WHEN "_locale" = 'de'
                THEN 'Bis zum unten stehenden Datum kannst du auch sofort kündigen. Bereits bezahlte Lizenzzeiträume bleiben gültig.'
                ELSE 'You can also cancel immediately until the date below. Existing paid license periods remain valid.' END,
            "cancel_immediate_until_label" = CASE WHEN "_locale" = 'de' THEN 'Sofortkündigung möglich bis' ELSE 'Immediate cancellation available until' END;

        ALTER TABLE "license_dialogs_locales"
            ALTER COLUMN "cancel_immediate_confirm_label" SET NOT NULL,
            ALTER COLUMN "cancel_immediate_description" SET NOT NULL,
            ALTER COLUMN "cancel_immediate_until_label" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "license_dialogs_locales"
            DROP COLUMN "cancel_immediate_confirm_label",
            DROP COLUMN "cancel_immediate_description",
            DROP COLUMN "cancel_immediate_until_label";
    `)
}
