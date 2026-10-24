import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "licenses_locales" ADD COLUMN "withdrawal_text" varchar;

   UPDATE "licenses_locales" SET
       "withdrawal_text" = CASE WHEN "_locale" = 'de' THEN 'Du kannst diesen Kauf bis zum {date} kostenlos widerrufen.' ELSE 'You can withdraw from this purchase free of charge until {date}.' END;

   ALTER TABLE "licenses_locales" ALTER COLUMN "withdrawal_text" SET NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "licenses_locales" DROP COLUMN "withdrawal_text";`)
}
