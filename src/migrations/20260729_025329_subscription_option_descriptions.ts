import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config_locales" ADD COLUMN "deployment_description" varchar DEFAULT 'Choose where your code0 instance will run.';
  ALTER TABLE "subscription_config_locales" ADD COLUMN "customer_type_description" varchar DEFAULT 'Choose the customer model that best matches your use case.';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "subscription_config_locales" DROP COLUMN "deployment_description";
  ALTER TABLE "subscription_config_locales" DROP COLUMN "customer_type_description";`)
}
