import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" ALTER COLUMN "form_country_label" SET DEFAULT 'Country';
  ALTER TABLE "checkout_locales" ALTER COLUMN "form_country_placeholder" SET DEFAULT 'Select a country';
  UPDATE "checkout_locales" SET "form_country_label" = 'Country' WHERE "form_country_label" = 'Country code';
  UPDATE "checkout_locales" SET "form_country_placeholder" = 'Select a country' WHERE "form_country_placeholder" = 'DE';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" ALTER COLUMN "form_country_label" SET DEFAULT 'Country code';
  ALTER TABLE "checkout_locales" ALTER COLUMN "form_country_placeholder" SET DEFAULT 'DE';
  UPDATE "checkout_locales" SET "form_country_label" = 'Country code' WHERE "form_country_label" = 'Country';
  UPDATE "checkout_locales" SET "form_country_placeholder" = 'DE' WHERE "form_country_placeholder" = 'Select a country';`)
}
