import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales"
            ADD COLUMN "invoices_pending_payment_description" varchar;

        UPDATE "licenses_locales" SET
            "invoices_pending_payment_description" = CASE WHEN "_locale" = 'de'
                THEN 'Eine Rechnung dieser Lizenz wartet noch auf die Zahlung. Davon abhängige Änderungen wie ein Upgrade gelten, sobald sie bezahlt ist.'
                ELSE 'An invoice for this license is still waiting for payment. Changes that depend on it, such as an upgrade, apply once it is paid.' END;

        ALTER TABLE "licenses_locales"
            ALTER COLUMN "invoices_pending_payment_description" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales"
            DROP COLUMN "invoices_pending_payment_description";
    `)
}
