import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_contact_heading" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_billing_address_heading" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_phone_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_address_line1_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_address_line2_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_city_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_state_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_postal_code_label" varchar;
        ALTER TABLE "licenses_locales" ADD COLUMN "editor_country_label" varchar;

        UPDATE "licenses_locales" SET
            "editor_contact_heading" = CASE WHEN "_locale" = 'de' THEN 'Kontaktinformationen' ELSE 'Contact information' END,
            "editor_billing_address_heading" = CASE WHEN "_locale" = 'de' THEN 'Rechnungsadresse' ELSE 'Billing address' END,
            "editor_phone_label" = CASE WHEN "_locale" = 'de' THEN 'Telefon' ELSE 'Phone' END,
            "editor_address_line1_label" = CASE WHEN "_locale" = 'de' THEN 'Adresszeile 1' ELSE 'Address line 1' END,
            "editor_address_line2_label" = CASE WHEN "_locale" = 'de' THEN 'Adresszeile 2' ELSE 'Address line 2' END,
            "editor_city_label" = CASE WHEN "_locale" = 'de' THEN 'Stadt' ELSE 'City' END,
            "editor_state_label" = CASE WHEN "_locale" = 'de' THEN 'Bundesland' ELSE 'State' END,
            "editor_postal_code_label" = CASE WHEN "_locale" = 'de' THEN 'Postleitzahl' ELSE 'Postal code' END,
            "editor_country_label" = CASE WHEN "_locale" = 'de' THEN 'Ländercode' ELSE 'Country code' END;

        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_contact_heading" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_billing_address_heading" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_phone_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_address_line1_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_address_line2_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_city_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_state_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_postal_code_label" SET NOT NULL;
        ALTER TABLE "licenses_locales" ALTER COLUMN "editor_country_label" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "licenses_locales" DROP COLUMN "editor_contact_heading";
        ALTER TABLE "licenses_locales" DROP COLUMN "editor_billing_address_heading";
        ALTER TABLE "licenses_locales" DROP COLUMN "editor_phone_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "editor_address_line1_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "editor_address_line2_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "editor_city_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "editor_state_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "editor_postal_code_label";
        ALTER TABLE "licenses_locales" DROP COLUMN "editor_country_label";
    `)
}
