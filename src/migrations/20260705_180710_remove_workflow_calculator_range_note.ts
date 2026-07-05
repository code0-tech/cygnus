import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config_locales" DROP COLUMN "workflow_calculator_range_note";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config_locales" ADD COLUMN "workflow_calculator_range_note" varchar DEFAULT 'Rounded to the configurable range from {min} to {max}.';`)
}
