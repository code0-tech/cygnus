import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_type_label" varchar;

   UPDATE "licenses_locales"
   SET "dashboard_type_label" = CASE WHEN "_locale" = 'de' THEN 'Typ' ELSE 'Type' END;

   ALTER TABLE "licenses_locales" ALTER COLUMN "dashboard_type_label" SET NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_type_label";`)
}
