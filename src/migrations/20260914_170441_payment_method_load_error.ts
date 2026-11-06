import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    // The column is added nullable and backfilled per locale before it becomes NOT NULL: the errors global
    // already has a row per locale, so a NOT NULL column without a value would fail on every existing row.
    await db.execute(sql`
   ALTER TABLE "errors_locales" ADD COLUMN "payment_method_load" varchar;

  UPDATE "errors_locales" SET
    "payment_method_load" = CASE WHEN "_locale" = 'de' THEN 'Die Zahlungsmethoden konnten nicht geladen werden.' ELSE 'The payment methods could not be loaded.' END;

  ALTER TABLE "errors_locales" ALTER COLUMN "payment_method_load" SET NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "errors_locales" DROP COLUMN "payment_method_load";`)
}
