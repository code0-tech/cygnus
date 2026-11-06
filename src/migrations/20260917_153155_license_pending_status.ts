import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    // Nullable, backfilled per locale, then NOT NULL: the licenses global already has a row per locale, and a
    // NOT NULL column without a value would fail on every one of them.
    await db.execute(sql`
   ALTER TABLE "licenses_locales" ADD COLUMN "values_statuses_pending" varchar;

  UPDATE "licenses_locales" SET
    "values_statuses_pending" = CASE WHEN "_locale" = 'de' THEN 'Ausstehend' ELSE 'Pending' END;

  ALTER TABLE "licenses_locales" ALTER COLUMN "values_statuses_pending" SET NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "licenses_locales" DROP COLUMN "values_statuses_pending";`)
}
