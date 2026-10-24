import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "errors_locales" ADD COLUMN "checkout_rate_limit" varchar;
        UPDATE "errors_locales" SET "checkout_rate_limit" = CASE WHEN "_locale" = 'de'
            THEN 'Zu viele Anfragen. Bitte versuche es später erneut.'
            ELSE 'Too many requests. Please try again later.' END;
        ALTER TABLE "errors_locales" ALTER COLUMN "checkout_rate_limit" SET NOT NULL;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`ALTER TABLE "errors_locales" DROP COLUMN "checkout_rate_limit";`)
}
