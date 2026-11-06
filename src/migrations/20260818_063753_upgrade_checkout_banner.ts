import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" ADD COLUMN "upgrade_banner_text" varchar DEFAULT 'Need more? {plan} gives you more headroom.' NOT NULL;
  ALTER TABLE "checkout_locales" ADD COLUMN "upgrade_banner_button_label" varchar DEFAULT 'Upgrade' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_locales" DROP COLUMN "upgrade_banner_text";
  ALTER TABLE "checkout_locales" DROP COLUMN "upgrade_banner_button_label";`)
}
