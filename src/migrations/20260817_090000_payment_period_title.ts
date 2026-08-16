import { sql, type MigrateDownArgs, type MigrateUpArgs } from "@payloadcms/db-postgres"

export async function up({ db }: MigrateUpArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "subscription_config_locales" ADD COLUMN "payment_period_title" varchar;

        UPDATE "subscription_config_locales" SET
            "payment_period_title" = CASE WHEN "_locale" = 'de' THEN 'Zahlungsperiode' ELSE 'Payment Period' END;
    `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
    await db.execute(sql`
        ALTER TABLE "subscription_config_locales" DROP COLUMN "payment_period_title";
    `)
}
