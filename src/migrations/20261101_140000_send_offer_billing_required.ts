import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "checkout_locales"
            ADD COLUMN "form_send_offer_billing_required" varchar;

        UPDATE "checkout_locales" SET
            "form_send_offer_billing_required" = CASE WHEN "_locale" = 'de'
                THEN 'Fülle zuerst deine Rechnungsadresse aus. Das Angebot wird auf sie ausgestellt und die Steuern werden danach berechnet.'
                ELSE 'Fill in your billing address first. The offer is made out to it and its taxes are calculated from it.' END;

        ALTER TABLE "checkout_locales"
            ALTER COLUMN "form_send_offer_billing_required" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "checkout_locales"
            DROP COLUMN "form_send_offer_billing_required";
    `)
}
