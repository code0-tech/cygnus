import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "checkout_locales" ADD COLUMN "form_send_offer_prompt" varchar;
  UPDATE "checkout_locales"
  SET "form_send_offer_prompt" = CASE
    WHEN "_locale" = 'de' THEN 'Benötigst du zuerst eine Rechnung oder ein Angebot?'
    ELSE 'Need an invoice or a quote first?'
  END;
  ALTER TABLE "checkout_locales" ALTER COLUMN "form_send_offer_prompt" SET NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "checkout_locales" DROP COLUMN "form_send_offer_prompt";`)
}
