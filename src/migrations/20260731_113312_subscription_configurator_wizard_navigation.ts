import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config_locales" ADD COLUMN "configurator_navigation_back_label" varchar DEFAULT 'Back';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "configurator_navigation_next_label" varchar DEFAULT 'Next';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config_locales" DROP COLUMN "configurator_navigation_back_label";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "configurator_navigation_next_label";`)
}
