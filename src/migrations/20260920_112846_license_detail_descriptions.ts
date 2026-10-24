import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "licenses_locales" ADD COLUMN "license_description" varchar;
  ALTER TABLE "licenses_locales" ADD COLUMN "invoices_description" varchar;

  UPDATE "licenses_locales" SET
    "license_description" = CASE
      WHEN "_locale" = 'de' THEN 'Sieh dir die Lizenzkonfiguration und den aktuellen Zugriffsstatus an.'
      ELSE 'View the license configuration and current access status.'
    END,
    "invoices_description" = CASE
      WHEN "_locale" = 'de' THEN 'Sieh dir die für diese Lizenz ausgestellten Rechnungen an und lade sie herunter.'
      ELSE 'View and download invoices issued for this license.'
    END;

  ALTER TABLE "licenses_locales" ALTER COLUMN "license_description" SET NOT NULL;
  ALTER TABLE "licenses_locales" ALTER COLUMN "invoices_description" SET NOT NULL;
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_namespace_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_namespace_connected_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_namespace_not_connected_label";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "licenses_locales" ADD COLUMN "editor_namespace_label" varchar;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_namespace_connected_label" varchar;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_namespace_not_connected_label" varchar;

  UPDATE "licenses_locales" SET
    "editor_namespace_label" = CASE WHEN "_locale" = 'de' THEN 'Namespace-ID' ELSE 'Namespace ID' END,
    "editor_namespace_connected_label" = CASE WHEN "_locale" = 'de' THEN 'Verbunden' ELSE 'Connected' END,
    "editor_namespace_not_connected_label" = CASE WHEN "_locale" = 'de' THEN 'Nicht verbunden' ELSE 'Not connected' END;

  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_namespace_label" SET NOT NULL;
  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_namespace_connected_label" SET NOT NULL;
  ALTER TABLE "licenses_locales" ALTER COLUMN "editor_namespace_not_connected_label" SET NOT NULL;
  ALTER TABLE "licenses_locales" DROP COLUMN "license_description";
  ALTER TABLE "licenses_locales" DROP COLUMN "invoices_description";`)
}
