import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "licenses_locales" ADD COLUMN "editor_license_edit_description" varchar;

  UPDATE "licenses_locales" SET
    "editor_license_edit_description" = CASE
      WHEN "_locale" = 'de' THEN 'Verwalte die Lizenz, Zahlungsmethode und den Abrechnungszeitraum.'
      ELSE 'Manage the license, payment method, and billing period.'
    END;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_license_edit_description" SET NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "licenses_locales" DROP COLUMN "editor_license_edit_description";`)
}
