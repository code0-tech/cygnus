import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "checkout_locales" ADD COLUMN "form_send_offer_title" varchar;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_send_offer_description" varchar;

  UPDATE "checkout_locales"
  SET
    "form_send_offer_title" = CASE WHEN "_locale" = 'de' THEN 'Angebot senden' ELSE 'Send offer' END,
    "form_send_offer_description" = CASE
      WHEN "_locale" = 'de' THEN 'Gib die E-Mail-Adresse ein, an die diese Konfiguration als Angebot gesendet werden soll.'
      ELSE 'Enter the email address that should receive this configuration as an offer.'
    END;

  ALTER TABLE "checkout_locales" ALTER COLUMN "form_send_offer_title" SET NOT NULL;
  ALTER TABLE "checkout_locales" ALTER COLUMN "form_send_offer_description" SET NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "checkout_locales" DROP COLUMN "form_send_offer_title";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_send_offer_description";`)
}
