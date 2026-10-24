import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "licenses_locales" ADD COLUMN "editor_customer_title" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_customer_description" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_license_title" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_license_description" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_name_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_namespace_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_save_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_cancel_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_close_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_customer_error" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_license_error" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "editor_self_hosted_description" varchar NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "licenses_locales" DROP COLUMN "editor_customer_title";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_customer_description";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_license_title";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_license_description";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_name_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_namespace_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_save_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_cancel_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_close_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_customer_error";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_license_error";
  ALTER TABLE "licenses_locales" DROP COLUMN "editor_self_hosted_description";`)
}
