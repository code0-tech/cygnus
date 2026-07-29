import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" ADD COLUMN "form_name_label" varchar DEFAULT 'Name' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_name_placeholder" varchar DEFAULT 'Full name or company name' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_email_label" varchar DEFAULT 'Email' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_email_placeholder" varchar DEFAULT 'billing@example.com' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_phone_label" varchar DEFAULT 'Phone' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_phone_placeholder" varchar DEFAULT 'Optional' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_line1_label" varchar DEFAULT 'Address' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_line1_placeholder" varchar DEFAULT 'Street and house number' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_line2_label" varchar DEFAULT 'Address line 2' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_line2_placeholder" varchar DEFAULT 'Optional' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_city_label" varchar DEFAULT 'City' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_state_label" varchar DEFAULT 'State' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_state_placeholder" varchar DEFAULT 'Optional' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_postal_code_label" varchar DEFAULT 'Postal code' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_country_label" varchar DEFAULT 'Country code' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_country_placeholder" varchar DEFAULT 'DE' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_tax_id_type_label" varchar DEFAULT 'Tax ID type' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_tax_id_type_placeholder" varchar DEFAULT 'eu_vat' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_tax_id_value_label" varchar DEFAULT 'Tax ID' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "form_tax_id_value_placeholder" varchar DEFAULT 'DE123456789' NOT NULL;`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" DROP COLUMN "form_name_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_name_placeholder";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_email_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_email_placeholder";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_phone_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_phone_placeholder";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_line1_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_line1_placeholder";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_line2_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_line2_placeholder";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_city_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_state_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_state_placeholder";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_postal_code_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_country_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_country_placeholder";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_tax_id_type_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_tax_id_type_placeholder";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_tax_id_value_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "form_tax_id_value_placeholder";`);
}
