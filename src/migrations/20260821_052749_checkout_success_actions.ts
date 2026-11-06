import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "checkout_locales" ADD COLUMN "success_sculptor_label" varchar;
  ALTER TABLE "checkout_locales" ADD COLUMN "success_license_download_label" varchar;
  ALTER TABLE "checkout_locales" ADD COLUMN "success_license_download_error" varchar;

  UPDATE "checkout_locales"
  SET
    "success_sculptor_label" = CASE WHEN "_locale" = 'de' THEN 'Sculptor öffnen' ELSE 'Open Sculptor' END,
    "success_license_download_label" = CASE WHEN "_locale" = 'de' THEN 'Lizenz herunterladen' ELSE 'Download license' END,
    "success_license_download_error" = CASE WHEN "_locale" = 'de' THEN 'Die Lizenz konnte nicht heruntergeladen werden.' ELSE 'The license could not be downloaded.' END;

  ALTER TABLE "checkout_locales" ALTER COLUMN "success_sculptor_label" SET NOT NULL;
  ALTER TABLE "checkout_locales" ALTER COLUMN "success_license_download_label" SET NOT NULL;
  ALTER TABLE "checkout_locales" ALTER COLUMN "success_license_download_error" SET NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "checkout_locales" DROP COLUMN "success_sculptor_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "success_license_download_label";
  ALTER TABLE "checkout_locales" DROP COLUMN "success_license_download_error";`)
}
