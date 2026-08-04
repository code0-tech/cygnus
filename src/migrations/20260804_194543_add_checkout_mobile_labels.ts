import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" ADD COLUMN "form_mobile_contact_label" varchar DEFAULT 'Contact details' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_mobile_next_label" varchar DEFAULT 'Continue' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_mobile_tax_label" varchar DEFAULT 'Tax details' NOT NULL;
  UPDATE "checkout_locales"
  SET
    "form_mobile_contact_label" = 'Kontaktdaten',
    "form_mobile_next_label" = 'Weiter',
    "form_mobile_tax_label" = 'Steuerangaben'
  WHERE "_locale" = 'de';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" DROP COLUMN "form_mobile_contact_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_mobile_next_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_mobile_tax_label";`)
}
