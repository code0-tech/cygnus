import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "checkout_locales"
            ADD COLUMN "form_send_offer_success" varchar;

        UPDATE "checkout_locales" SET
            "form_send_offer_success" = CASE WHEN "_locale" = 'de'
                THEN 'Wir haben das Angebot an {email} gesendet. Es schlüsselt die Kosten einzeln auf und ist unverbindlich.'
                ELSE 'We sent the offer to {email}. It breaks the costs down line by line and is non-binding.' END;

        ALTER TABLE "checkout_locales"
            ALTER COLUMN "form_send_offer_success" SET NOT NULL;

        ALTER TABLE "errors_locales"
            ADD COLUMN "offer_send" varchar,
            ADD COLUMN "offer_delivery" varchar;

        UPDATE "errors_locales" SET
            "offer_send" = CASE WHEN "_locale" = 'de'
                THEN 'Das Angebot konnte nicht gesendet werden. Bitte versuche es erneut.'
                ELSE 'The offer could not be sent. Please try again.' END,
            "offer_delivery" = CASE WHEN "_locale" = 'de'
                THEN 'Das Angebot wurde erstellt, aber die E-Mail konnte nicht gesendet werden. Bitte versuche es später erneut.'
                ELSE 'The offer was created, but the email could not be sent. Please try again later.' END;

        ALTER TABLE "errors_locales"
            ALTER COLUMN "offer_send" SET NOT NULL,
            ALTER COLUMN "offer_delivery" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "errors_locales"
            DROP COLUMN "offer_send",
            DROP COLUMN "offer_delivery";

        ALTER TABLE "checkout_locales"
            DROP COLUMN "form_send_offer_success";
    `)
}
