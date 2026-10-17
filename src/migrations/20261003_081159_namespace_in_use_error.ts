import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "errors_locales" ADD COLUMN "namespace_in_use" varchar;
  UPDATE "errors_locales" SET "namespace_in_use" = CASE WHEN "_locale" = 'de'
    THEN 'Dieser Namespace ist bereits mit einem anderen Abonnement verknüpft. Wähle einen anderen Namespace.'
    ELSE 'This namespace is already linked to another subscription. Choose a different namespace.' END;
  ALTER TABLE "errors_locales" ALTER COLUMN "namespace_in_use" SET NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
   ALTER TABLE "errors_locales" DROP COLUMN "namespace_in_use";`)
}
