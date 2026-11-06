import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

// The original migration added this field to licenses_locales instead of the dialog global.
// Keep that migration intact so databases that already ran it receive this correction too.
export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "license_dialogs_locales"
            ADD COLUMN IF NOT EXISTS "billing_current_period_end_canceled_description" varchar;

        UPDATE "license_dialogs_locales" AS dialogs SET
            "billing_current_period_end_canceled_description" = COALESCE(
                (
                    SELECT licenses."billing_current_period_end_canceled_description"
                    FROM "licenses_locales" AS licenses
                    WHERE licenses."_locale" = dialogs."_locale"
                        AND licenses."_parent_id" = dialogs."_parent_id"
                ),
                CASE WHEN dialogs."_locale" = 'de'
                    THEN 'Das Abonnement ist gekündigt, der Zugriff endet am {date}.'
                    ELSE 'The subscription is canceled, access ends on {date}.' END
            )
        WHERE dialogs."billing_current_period_end_canceled_description" IS NULL;

        ALTER TABLE "license_dialogs_locales"
            ALTER COLUMN "billing_current_period_end_canceled_description" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "license_dialogs_locales"
            DROP COLUMN "billing_current_period_end_canceled_description";
    `)
}
