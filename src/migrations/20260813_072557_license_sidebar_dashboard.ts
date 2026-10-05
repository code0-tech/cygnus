import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "licenses_locales" ADD COLUMN "sidebar_dashboard" varchar;
   UPDATE "licenses_locales" SET "sidebar_dashboard" = 'Dashboard';
   ALTER TABLE "licenses_locales" ALTER COLUMN "sidebar_dashboard" SET NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "licenses_locales" DROP COLUMN "sidebar_dashboard";`)
}
