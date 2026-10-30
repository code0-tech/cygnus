import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_status_label" varchar NOT NULL;
  ALTER TABLE "licenses_locales" ADD COLUMN "dashboard_deployment_label" varchar NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_status_label";
  ALTER TABLE "licenses_locales" DROP COLUMN "dashboard_deployment_label";`)
}
