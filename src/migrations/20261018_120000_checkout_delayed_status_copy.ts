import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "checkout_locales"
            ADD COLUMN "success_delayed_heading" varchar,
            ADD COLUMN "success_delayed_confirmed_description" varchar,
            ADD COLUMN "success_delayed_pending_description" varchar;

        UPDATE "checkout_locales" SET
            "success_delayed_heading" = CASE WHEN "_locale" = 'de'
                THEN 'Die Verarbeitung dauert länger'
                ELSE 'Processing is taking longer' END,
            "success_delayed_confirmed_description" = CASE WHEN "_locale" = 'de'
                THEN 'Deine Zahlung ist bestätigt. Die Bereitstellung deiner Lizenz dauert länger als erwartet. Bitte prüfe den Status später erneut. Du musst nicht erneut bezahlen.'
                ELSE 'Your payment is confirmed. Preparing your license is taking longer than expected. Please check the status again later. You do not need to pay again.' END,
            "success_delayed_pending_description" = CASE WHEN "_locale" = 'de'
                THEN 'Dein Checkout wird noch verarbeitet. Bitte prüfe den Status später erneut, bevor du einen neuen Checkout startest.'
                ELSE 'Your checkout is still being processed. Please check the status again later before starting another checkout.' END;

        ALTER TABLE "checkout_locales"
            ALTER COLUMN "success_delayed_heading" SET NOT NULL,
            ALTER COLUMN "success_delayed_confirmed_description" SET NOT NULL,
            ALTER COLUMN "success_delayed_pending_description" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "checkout_locales"
            DROP COLUMN "success_delayed_heading",
            DROP COLUMN "success_delayed_confirmed_description",
            DROP COLUMN "success_delayed_pending_description";
    `)
}
