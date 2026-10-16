import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

// Shown instead of the invoice number until Crater has received it from Stripe.
export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales"
            ADD COLUMN "invoices_number_pending_label" varchar;

        UPDATE "licenses_locales" SET
            "invoices_number_pending_label" = CASE WHEN "_locale" = 'de' THEN 'Noch nicht verfügbar' ELSE 'Not yet available' END;

        ALTER TABLE "licenses_locales"
            ALTER COLUMN "invoices_number_pending_label" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales"
            DROP COLUMN "invoices_number_pending_label";
    `)
}
